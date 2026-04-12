import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { GoogleDriveProvider } from '../../infrastructure/GoogleDriveProvider';
import { UploadDocumentUseCase } from '../../application/use-cases/UploadDocumentUseCase';
import path from 'path';
import fs from 'fs';
import { Readable } from 'stream';

const prisma = new PrismaClient();
const storageProvider = new GoogleDriveProvider();

export class CaseController {
  async getAll(req: any, res: any) {
    try {
      const cases = await prisma.case.findMany({
        where: req.user.role === 'ADMIN' ? {} : 
               req.user.role === 'LAWYER' ? { lawyerId: req.user.id } : 
               { clientId: req.user.id },
        include: {
          lawyer: { select: { name: true } },
          client: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
      res.json(cases);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async getById(req: any, res: any) {
    try {
      const { id } = req.params;
      const isAdmin = req.user.role === 'ADMIN';
      const isClient = req.user.role === 'CLIENT';

      const caseFound = await prisma.case.findUnique({
        where: { id },
        include: {
          lawyer: { select: { id: true, name: true, email: true } },
          client: { select: { id: true, name: true, email: true } },
          followUpNotes: { 
            where: isClient ? { isVisibleByClient: true, deletedAt: null } : 
                   isAdmin ? {} : { deletedAt: null },
            include: { 
              author: { select: { name: true } },
              deletedBy: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
          },
          followUpLinks: true,
          statusHistory: { 
            include: { author: { select: { name: true } } },
            orderBy: { createdAt: 'desc' }
          },
          payments: { orderBy: { date: 'desc' } }
        }
      });
      if (!caseFound) return res.status(404).json({ error: 'Caso no encontrado' });
      res.json(caseFound);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async getStats(req: any, res: any) {
    try {
      const isClient = req.user.role === 'CLIENT';
      const isLawyer = req.user.role === 'LAWYER';
      const isAdmin = req.user.role === 'ADMIN';

      const filter: any = isAdmin ? {} : isLawyer ? { lawyerId: req.user.id } : { clientId: req.user.id };

      const [total, pending, inProgress, closed, statsRaw, paymentsRaw] = await Promise.all([
        prisma.case.count({ where: filter }),
        prisma.case.count({ where: { ...filter, status: 'PENDING' } }),
        prisma.case.count({ where: { ...filter, status: 'IN_PROGRESS' } }),
        prisma.case.count({ where: { ...filter, status: 'CLOSED' } }),
        prisma.case.aggregate({ 
          where: filter,
          _sum: { fees: true, paidBalance: true } 
        }),
        prisma.payment.findMany({
          where: isAdmin ? {} : { case: filter },
          select: { amount: true, date: true }
        })
      ]);

      const monthlyData: Record<string, any> = {};
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
        monthlyData[key] = { name: key, ingresos: 0, casos: 0 };
      }

      paymentsRaw.forEach(p => {
        const d = new Date(p.date);
        const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
        if (monthlyData[key]) monthlyData[key].ingresos += Number(p.amount);
      });

      const casesRaw = await prisma.case.findMany({ 
        where: filter,
        select: { createdAt: true } 
      });
      casesRaw.forEach(c => {
        const d = new Date(c.createdAt);
        const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
        if (monthlyData[key]) monthlyData[key].casos += 1;
      });

      res.json({
        total,
        pending,
        inProgress,
        closed,
        totalFees: isClient ? 0 : (statsRaw._sum.fees || 0),
        totalPaid: isClient ? 0 : (statsRaw._sum.paidBalance || 0),
        chartData: isClient ? [] : Object.values(monthlyData)
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async create(req: any, res: any) {
    try {
      const { title, caseNumber, fees, feeType, description, lawyerId, clientId } = req.body;
      const driveFolderId = await storageProvider.createFolder(title);
      
      const newCase = await prisma.case.create({
        data: {
          title,
          caseNumber,
          fees: Number(fees),
          feeType,
          description,
          lawyerId,
          clientId,
          driveFolderId
        },
        include: {
          lawyer: { select: { name: true } },
          client: { select: { name: true } }
        }
      });

      res.status(201).json(newCase);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async addPayment(req: any, res: any) {
    try {
      const { id } = req.params;
      const { amount, method, date } = req.body;
      const file = req.file;

      if (!file) return res.status(400).json({ error: 'El comprobante es obligatorio' });

      const amountNum = Number(amount);
      const currentCase = await prisma.case.findUnique({ where: { id } });
      if (!currentCase) return res.status(404).json({ error: 'Caso no encontrado' });

      const uploadUseCase = new UploadDocumentUseCase(storageProvider);
      const fileName = `COMPROBANTE_PAGO_${new Date().toISOString().split('T')[0]}_${file.originalname}`;
      
      const result = await uploadUseCase.execute(
        id,
        { 
          stream: Readable.from(file.buffer), 
          name: fileName, 
          mimeType: file.mimetype 
        },
        'PAGOS'
      );

      const updated = await prisma.$transaction(async (tx) => {
        await tx.payment.create({
          data: {
            amount: amountNum,
            method: method || 'TRANSFERENCIA',
            date: date ? new Date(date) : new Date(),
            comprobanteId: result.fileId,
            caseId: id
          }
        });

        return tx.case.update({
          where: { id },
          data: { paidBalance: { increment: amountNum } },
          include: {
            payments: { orderBy: { date: 'desc' } },
            lawyer: { select: { name: true } },
            client: { select: { name: true } },
            followUpNotes: { 
              where: { deletedAt: null },
              include: { author: { select: { name: true } } }, 
              orderBy: { createdAt: 'desc' } 
            },
            followUpLinks: true,
            statusHistory: { include: { author: { select: { name: true } } }, orderBy: { createdAt: 'desc' } }
          }
        });
      });

      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async update(req: any, res: any) {
    try {
      const updated = await prisma.case.update({
        where: { id: req.params.id },
        data: req.body,
        include: {
          lawyer: { select: { name: true } },
          client: { select: { name: true } },
          followUpNotes: { 
            where: { deletedAt: null },
            include: { author: { select: { name: true } } }, 
            orderBy: { createdAt: 'desc' } 
          },
          followUpLinks: true,
          statusHistory: { include: { author: { select: { name: true } } }, orderBy: { createdAt: 'desc' } },
          payments: { orderBy: { date: 'desc' } }
        }
      });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async updateStatus(req: any, res: any) {
    try {
      const { status: to, reason, adjustmentReason } = req.body;
      const currentCase = await prisma.case.findUnique({ where: { id: req.params.id } });
      if (!currentCase) return res.status(404).json({ error: 'Caso no encontrado' });

      const updateData: any = { status: to, statusUpdatedAt: new Date() };
      if (to === 'CLOSED') {
        updateData.closedAt = new Date();
        updateData.closedById = req.user.id;
      }

      const updated = await prisma.$transaction(async (tx) => {
        await tx.statusHistory.create({
          data: {
            from: currentCase.status,
            to,
            reason: adjustmentReason ? `${reason} | Ajuste Financiero: ${adjustmentReason}` : reason,
            caseId: req.params.id,
            authorId: req.user.id
          }
        });

        return tx.case.update({
          where: { id: req.params.id },
          data: updateData,
          include: { 
            statusHistory: { include: { author: { select: { name: true } } }, orderBy: { createdAt: 'desc' } },
            lawyer: { select: { name: true } },
            client: { select: { name: true } },
            followUpNotes: { 
              where: { deletedAt: null },
              include: { author: { select: { name: true } } }, 
              orderBy: { createdAt: 'desc' } 
            },
            followUpLinks: true,
            payments: { orderBy: { date: 'desc' } }
          }
        });
      });

      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async addNote(req: any, res: any) {
    try {
      const { content, title, isVisibleByClient } = req.body;
      const note = await prisma.followUpNote.create({
        data: {
          content,
          title: title || 'Avance Jurídico',
          isVisibleByClient: !!isVisibleByClient,
          caseId: req.params.id,
          authorId: req.user.id
        },
        include: { author: { select: { name: true } } }
      });
      res.json(note);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async deleteNote(req: any, res: any) {
    try {
      const { noteId } = req.params;
      const { reason } = req.body;

      if (!reason) return res.status(400).json({ error: 'La justificación de eliminación es obligatoria' });

      await prisma.followUpNote.update({
        where: { id: noteId },
        data: {
          deletedAt: new Date(),
          deletedById: req.user.id,
          deletionReason: reason
        }
      });
      res.sendStatus(204);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async addLink(req: any, res: any) {
    try {
      const { title, url } = req.body;
      const link = await prisma.followUpLink.create({
        data: { title, url, caseId: req.params.id }
      });
      res.json(link);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async deleteLink(req: any, res: any) {
    try {
      const { linkId } = req.params;
      await prisma.followUpLink.delete({ where: { id: linkId } });
      res.sendStatus(204);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async upload(req: any, res: any) {
    try {
      const file = req.file;
      if (!file) return res.status(400).json({ error: 'Archivo no proporcionado' });

      const uploadUseCase = new UploadDocumentUseCase(storageProvider);
      const result = await uploadUseCase.execute(
        req.params.id,
        { 
          stream: Readable.from(file.buffer), 
          name: file.originalname, 
          mimeType: file.mimetype 
        },
        req.query.folder as string
      );
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async delete(req: any, res: any) {
    try {
      await prisma.case.delete({ where: { id: req.params.id } });
      res.sendStatus(204);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async getFolderUrl(req: any, res: any) {
    try {
      const { id, subfolder } = req.params;
      const currentCase = await prisma.case.findUnique({ where: { id } });
      if (!currentCase || !currentCase.driveFolderId) return res.status(404).json({ error: 'Carpeta no encontrada' });

      const folderId = await storageProvider.findSubfolderId(currentCase.driveFolderId, subfolder);
      if (!folderId) return res.status(404).json({ error: 'Subcarpeta no encontrada' });

      res.json({ url: `https://drive.google.com/open?id=${folderId}` });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
