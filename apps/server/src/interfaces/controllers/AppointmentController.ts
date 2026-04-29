import { Request, Response } from 'express';
import { prisma } from '../../infrastructure/prisma';
import { EmailProvider } from '../../infrastructure/EmailProvider';

const emailProvider = new EmailProvider();

export class AppointmentController {
  async book(req: Request, res: Response) {
    try {
      const { 
        clientEmail, clientName, clientLastName, 
        clientPhone, clientPhoneCode, serviceId, 
        lawyerId, scheduledAt, notes 
      } = req.body;

      const service = await prisma.legalService.findUnique({ where: { id: serviceId } });
      if (!service) return res.status(404).json({ error: 'Servicio no encontrado' });

      const appointment = await prisma.appointment.create({
        data: {
          clientEmail, clientName, clientLastName,
          clientPhone, clientPhoneCode,
          serviceId, lawyerId,
          scheduledAt: new Date(scheduledAt),
          notes,
          status: 'PENDING'
        },
        include: { service: true, lawyer: true }
      });

      // Send emails
      const dateStr = new Date(scheduledAt).toLocaleString('es-CO');
      
      // Notify Client
      await emailProvider.sendAppointmentRequestEmail(
        clientEmail, clientName, service.name, dateStr, appointment.lawyer?.name
      );

      // Notify Lawyer or Admin
      if (lawyerId && appointment.lawyer) {
        await emailProvider.sendAppointmentNotificationLawyer(
          appointment.lawyer.email, appointment.lawyer.name, clientName, service.name, dateStr
        );
      } else {
        // Notify Admins if no lawyer selected
        const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
        for (const admin of admins) {
          await emailProvider.sendAppointmentNotificationLawyer(
            admin.email, admin.name, clientName, service.name, dateStr
          );
        }
      }

      res.status(201).json(appointment);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al agendar cita' });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const { role, id } = (req as any).user;
      let where = {};
      
      if (role === 'LAWYER') {
        where = { OR: [{ lawyerId: id }, { lawyerId: null }] };
      }

      const appointments = await prisma.appointment.findMany({
        where,
        include: { service: true, lawyer: { select: { name: true, email: true } } },
        orderBy: { scheduledAt: 'desc' }
      });
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener citas' });
    }
  }

  async updateStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, lawyerId, scheduledAt, notes } = req.body;

      const oldAppointment = await prisma.appointment.findUnique({
        where: { id },
        include: { service: true, lawyer: true }
      });

      if (!oldAppointment) return res.status(404).json({ error: 'Cita no encontrada' });

      const appointment = await prisma.appointment.update({
        where: { id },
        data: { 
          status, 
          lawyerId: lawyerId || oldAppointment.lawyerId,
          scheduledAt: scheduledAt ? new Date(scheduledAt) : oldAppointment.scheduledAt,
          notes: notes || oldAppointment.notes
        },
        include: { service: true, lawyer: true }
      });

      const dateStr = appointment.scheduledAt.toLocaleString('es-CO');

      if (status === 'CONFIRMED' && appointment.lawyer) {
        // End time calculation
        const endTime = new Date(appointment.scheduledAt.getTime() + appointment.service.durationMinutes * 60000);
        
        await emailProvider.sendAppointmentConfirmationEmail(
          appointment.clientEmail, appointment.clientName, appointment.service.name, 
          dateStr, appointment.lawyer.name, 
          appointment.scheduledAt.toISOString(), endTime.toISOString()
        );
      } else if (status === 'CANCELLED' || status === 'MODIFIED') {
        await emailProvider.sendAppointmentUpdateEmail(
          appointment.clientEmail, appointment.clientName, appointment.service.name, 
          dateStr, status, notes
        );
      }

      res.json(appointment);
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar cita' });
    }
  }

  async getMyAppointments(req: Request, res: Response) {
    try {
      const { email } = (req as any).user;
      const appointments = await prisma.appointment.findMany({
        where: { clientEmail: email },
        include: { service: true, lawyer: { select: { name: true } } },
        orderBy: { scheduledAt: 'desc' }
      });
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener mis citas' });
    }
  }
}
