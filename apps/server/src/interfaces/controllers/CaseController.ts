import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { GoogleDriveProvider } from '../../infrastructure/GoogleDriveProvider';
import { EmailProvider } from '../../infrastructure/EmailProvider';
import { UploadDocumentUseCase } from '../../application/use-cases/UploadDocumentUseCase';
import path from 'path';
import fs from 'fs';
import { Readable } from 'stream';

const prisma = new PrismaClient();
const storageProvider = new GoogleDriveProvider();
const emailProvider = new EmailProvider();

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
          payments: { 
            include: { registeredBy: { select: { name: true } } },
            orderBy: { date: 'desc' } 
          },
          documents: {
            where: isAdmin ? {} : { deletedAt: null },
            include: { 
              uploadedBy: { select: { name: true } },
              deletedBy: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!caseFound) return res.status(404).json({ error: 'Caso no encontrado' });

      // Ownership check
      if (!isAdmin) {
        const isLawyerOfCase = caseFound.lawyerId === req.user.id;
        const isClientOfCase = caseFound.clientId === req.user.id;
        if (!isLawyerOfCase && !isClientOfCase) {
          return res.status(403).json({ error: 'No tiene permiso para ver este expediente' });
        }
      }

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
      const { PrismaUserRepository } = require('../../infrastructure/PrismaUserRepository');
      const { CreateCaseUseCase } = require('../../application/use-cases/CreateCaseUseCase');
      const { PrismaCaseRepository } = require('../../infrastructure/PrismaCaseRepository');

      const caseRepo = new PrismaCaseRepository();
      const userRepo = new PrismaUserRepository();
      const createCaseUC = new CreateCaseUseCase(caseRepo, storageProvider, userRepo);

      const newCase = await createCaseUC.execute(req.body);
      res.status(201).json(newCase);
    } catch (err: any) {
      console.error('Error creating case:', err);
      res.status(500).json({ error: err.message });
    }
  }

  async getPublicStatus(req: Request, res: Response) {
    try {
      const { caseNumber, documentNumber } = req.body;
      if (!caseNumber || !documentNumber) return res.status(400).json({ error: 'Faltan datos de consulta' });

      const foundCase = await prisma.case.findFirst({
        where: { 
          caseNumber,
          client: { documentNumber }
        },
        include: {
          client: { select: { name: true } },
          statusHistory: { 
             orderBy: { createdAt: 'desc' },
             take: 1,
             select: { to: true, reason: true, createdAt: true }
          }
        }
      });

      if (!foundCase) return res.status(404).json({ error: 'Caso no encontrado o datos incorrectos' });

      res.json({
         title: foundCase.title,
         status: foundCase.status,
         clientName: foundCase.client.name,
         lastUpdate: foundCase.statusHistory[0] || null
      });
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
            caseId: id,
            registeredById: req.user.id
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
      const { id } = req.params;
      const { title, caseNumber, fees, feeType, lawyerId, clientId, description, followUpLinks } = req.body;

      const updated = await prisma.$transaction(async (tx) => {
        // 1. Clear existing links to sync
        if (followUpLinks) {
          await tx.followUpLink.deleteMany({ where: { caseId: id } });
        }

        return tx.case.update({
          where: { id },
          data: {
            title,
            caseNumber,
            fees: Number(fees),
            feeType,
            lawyerId,
            clientId,
            description,
            followUpLinks: followUpLinks ? {
              create: followUpLinks.map((l: any) => ({
                title: l.title,
                url: l.url
              }))
            } : undefined
          },
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
            payments: { 
              include: { registeredBy: { select: { name: true } } },
              orderBy: { date: 'desc' } 
            }
          }
        });
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
            lawyer: { select: { id: true, name: true } },
            client: { select: { id: true, name: true, email: true } },
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

      // Notify client via Email context (KISS: fire and forget log error)
      if (updated.client?.email) {
        emailProvider.sendStatusUpdateEmail(
          updated.client.email,
          updated.client.name,
          updated.title,
          currentCase.status,
          to,
          reason
        ).catch(e => console.error('Error sending status update mail:', e));
      }

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
      if (req.user.role !== 'ADMIN' && req.user.role !== 'LAWYER') {
        return res.status(403).json({ error: 'No tiene permisos para anular notas de la bitácora' });
      }

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
      if (req.user.role !== 'ADMIN' && req.user.role !== 'LAWYER') {
        return res.status(403).json({ error: 'No tiene permisos para eliminar enlaces del expediente' });
      }

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

      // Log the document upload
      await prisma.documentLog.create({
        data: {
          fileName: file.originalname,
          fileId: result.fileId,
          uploadedById: req.user.id,
          caseId: req.params.id
        }
      });

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async deleteDocument(req: any, res: any) {
    try {
      if (req.user.role !== 'ADMIN' && req.user.role !== 'LAWYER') {
        return res.status(403).json({ error: 'Solo el administrador o el abogado asignado pueden eliminar documentos' });
      }

      const { documentId } = req.params;
      const { reason } = req.body;

      if (!reason) return res.status(400).json({ error: 'La justificación de eliminación es obligatoria' });

      const doc = await prisma.documentLog.findUnique({
        where: { id: documentId },
        include: { case: true }
      });

      if (!doc) return res.status(404).json({ error: 'Documento no encontrado' });

      // 1. Move in Drive to ELIMINADOS folder for quarantine
      if (doc.case.driveFolderId) {
        const deletedFolderId = await storageProvider.ensureSubfolder(doc.case.driveFolderId, 'ELIMINADOS');
        if (deletedFolderId) {
          await storageProvider.moveFile(doc.fileId, deletedFolderId);
        }
      }

      // 2. Mark as deleted in DB (Audit trail)
      await prisma.documentLog.update({
        where: { id: documentId },
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
      const currentCase = await prisma.case.findUnique({ 
        where: { id },
        include: { client: { select: { email: true } } }
      });

      if (!currentCase || !currentCase.driveFolderId) {
        return res.status(404).json({ error: 'Carpeta raíz no encontrada o no configurada para este caso.' });
      }

      // 1. Ownership and Permission Enforcement
      if (req.user.role !== 'ADMIN') {
        if (currentCase.lawyerId !== req.user.id && currentCase.clientId !== req.user.id) {
          return res.status(403).json({ error: 'Acceso denegado al expediente.' });
        }
      }

      // 2. Ensure Client Access (Self-healing permissions)
      // If the client is trying to access, we re-verify/grant permissions just in case
      if (currentCase.client?.email) {
        await storageProvider.shareFolder(currentCase.driveFolderId, currentCase.client.email, 'reader');
      }

      // 3. Find or Create Subfolder On-Demand (Clean implementation)
      const folderId = await storageProvider.ensureSubfolder(currentCase.driveFolderId, subfolder);

      if (!folderId) return res.status(404).json({ error: 'No se pudo localizar ni crear la subcarpeta en Google Drive.' });

      // 4. Special Rule: If subfolder is CLIENTE or PAGOS, ensure it's public (KISS for non-gmail users)
      if (subfolder === 'CLIENTE' || subfolder === 'PAGOS') {
        console.log(`Enforcing public permissions for subfolder: ${subfolder} in folder ${folderId}`);
        await storageProvider.shareFolder(folderId, 'anyone', 'reader');
      }

      res.json({ url: `https://drive.google.com/open?id=${folderId}` });
    } catch (err: any) {
      console.error('Error in getFolderUrl:', err);
      res.status(500).json({ error: err.message });
    }
  }
}
