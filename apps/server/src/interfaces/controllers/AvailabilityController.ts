import { Request, Response } from 'express';
import { prisma } from '../../infrastructure/prisma';

export class AvailabilityController {
  async getByLawyer(req: Request, res: Response) {
    try {
      const { lawyerId } = req.params;
      const availability = await prisma.lawyerAvailability.findMany({
        where: { lawyerId, isActive: true },
        orderBy: { dayOfWeek: 'asc' }
      });
      res.json(availability);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener disponibilidad' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { lawyerId } = req.params;
      const { schedules } = req.body; // Array of { dayOfWeek, startTime, endTime }

      // Simple implementation: delete and recreate for that lawyer
      await prisma.lawyerAvailability.deleteMany({
        where: { lawyerId }
      });

      const created = await prisma.lawyerAvailability.createMany({
        data: schedules.map((s: any) => ({
          lawyerId,
          dayOfWeek: Number(s.dayOfWeek),
          startTime: s.startTime,
          endTime: s.endTime
        }))
      });

      res.json(created);
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar disponibilidad' });
    }
  }

  async getPublicAvailability(req: Request, res: Response) {
    try {
      const { lawyerId, date } = req.query;
      const targetDate = new Date(date as string);
      const dayOfWeek = targetDate.getDay();

      if (lawyerId) {
        // Specific lawyer availability
        const availability = await prisma.lawyerAvailability.findMany({
          where: { lawyerId: lawyerId as string, dayOfWeek, isActive: true }
        });
        
        // Get existing appointments for that day and lawyer
        const appointments = await prisma.appointment.findMany({
          where: {
            lawyerId: lawyerId as string,
            scheduledAt: {
              gte: new Date(targetDate.setHours(0,0,0,0)),
              lte: new Date(targetDate.setHours(23,59,59,999))
            },
            status: { in: ['CONFIRMED', 'PENDING'] }
          }
        });

        res.json({ availability, appointments });
      } else {
        // General availability: anyone who is a LAWYER and has availability that day
        const availabilities = await prisma.lawyerAvailability.findMany({
          where: { dayOfWeek, isActive: true },
          include: { lawyer: { select: { id: true, name: true } } }
        });

        res.json({ availabilities });
      }
    } catch (error) {
      res.status(500).json({ error: 'Error al consultar disponibilidad pública' });
    }
  }
}
