import { Request, Response } from 'express';
import { prisma } from '../../infrastructure/prisma';

export class LegalServiceController {
  async getAll(req: Request, res: Response) {
    try {
      const services = await prisma.legalService.findMany({
        where: { isActive: true },
        include: { lawyers: { select: { id: true, name: true } } },
        orderBy: { name: 'asc' }
      });
      res.json(services);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener servicios' });
    }
  }

  async getAllAdmin(req: Request, res: Response) {
    try {
      const services = await prisma.legalService.findMany({
        include: { lawyers: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' }
      });
      res.json(services);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener servicios' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { name, durationMinutes, requiredDocs, lawyerIds } = req.body;
      
      const serviceData: any = {
        name,
        durationMinutes: Number(durationMinutes),
        requiredDocs,
      };

      if (lawyerIds && Array.isArray(lawyerIds)) {
        serviceData.lawyers = {
          connect: lawyerIds.map((id: string) => ({ id }))
        };
      }

      const service = await prisma.legalService.create({
        data: serviceData,
        include: { lawyers: true }
      });
      res.status(201).json(service);
    } catch (error) {
      console.error('Create service error:', error);
      res.status(500).json({ error: 'Error al crear servicio' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, durationMinutes, requiredDocs, isActive, lawyerIds } = req.body;
      
      const serviceData: any = {
        name,
        durationMinutes: Number(durationMinutes),
        requiredDocs,
        isActive
      };

      if (lawyerIds && Array.isArray(lawyerIds)) {
        serviceData.lawyers = {
          set: lawyerIds.map((id: string) => ({ id }))
        };
      }

      const service = await prisma.legalService.update({
        where: { id },
        data: serviceData,
        include: { lawyers: true }
      });
      res.json(service);
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar servicio' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.legalService.update({
        where: { id },
        data: { isActive: false }
      });
      res.json({ message: 'Servicio desactivado' });
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar servicio' });
    }
  }
}
