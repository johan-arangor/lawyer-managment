import { Request, Response } from 'express';
import { PrismaClient, Role, DocumentType } from '@prisma/client';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { EmailProvider } from '../../infrastructure/EmailProvider';

const prisma = new PrismaClient();
const emailProvider = new EmailProvider();

export class UserController {
  async getAll(req: any, res: any) {
    try {
      const filters: any = { isActive: true };
      
      // Lawyers only see their own clients
      if (req.user.role === 'LAWYER') {
        filters.role = 'CLIENT';
        // In this simple model, we assume access to all clients or filter by relation if needed
        // For now, consistent with requirements: "rol abogado puede crear clientes"
      }

      const users = await prisma.user.findMany({
        where: filters,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          documentType: true,
          documentNumber: true,
          businessName: true,
          phone: true,
          isConfirmed: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      });
      res.json(users);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async create(req: any, res: any) {
    try {
      const { 
        email, name, role, documentType, documentNumber, businessName, 
        phone, phoneSecondary, landline, address, 
        contactName2, contactPhone2, contactEmail2 
      } = req.body;

      // 1. Role Authorization
      if (req.user.role === 'ADMIN') {
        if (role !== 'LAWYER' && role !== 'CLIENT') {
          return res.status(403).json({ error: 'Un administrador solo puede crear Abogados o Clientes' });
        }
      } else if (req.user.role === 'LAWYER') {
        if (role !== 'CLIENT') {
          return res.status(403).json({ error: 'Un abogado solo puede crear Clientes' });
        }
      } else {
        return res.status(403).json({ error: 'No tienes permisos para crear usuarios' });
      }

      // 2. Uniqueness Validation
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email },
            { documentNumber }
          ]
        }
      });

      if (existingUser) {
        const field = existingUser.email === email ? 'El correo electrónico' : 'El número de documento';
        return res.status(400).json({ error: `${field} ya está registrado en el sistema.` });
      }

      // 3. Business Name validation for NIT
      if (documentType === 'NIT' && !businessName) {
        return res.status(400).json({ error: 'La Razón Social es obligatoria para registros con NIT.' });
      }

      // 4. Generate Confirmation Token and Temporary Password
      const confirmationToken = crypto.randomBytes(32).toString('hex');
      const tempPassword = crypto.randomBytes(8).toString('hex');
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      // 5. Create User
      const newUser = await prisma.user.create({
        data: {
          email,
          name,
          role: role as Role,
          documentType: (documentType as DocumentType) || 'CC',
          documentNumber,
          businessName,
          phone,
          phoneSecondary,
          landline,
          address,
          contactName2,
          contactPhone2,
          contactEmail2,
          password: hashedPassword,
          confirmationToken,
          isConfirmed: false
        }
      });

      // 6. Send Email
      await emailProvider.sendConfirmationEmail(email, name, confirmationToken);

      res.status(201).json({ 
        message: 'Usuario creado exitosamente. Se ha enviado un correo de confirmación.',
        user: { id: newUser.id, email: newUser.email, name: newUser.name }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async update(req: any, res: any) {
    try {
      const { id } = req.params;
      const data = req.body;
      const isAdmin = req.user.role === 'ADMIN';

      // 1. Permission Check
      if (!isAdmin && req.user.id !== id) {
        return res.status(403).json({ error: 'No tienes permiso para actualizar este perfil' });
      }

      const currentUser = await prisma.user.findUnique({ where: { id } });
      if (!currentUser) return res.status(404).json({ error: 'Usuario no encontrado' });

      // 2. Uniqueness Check (if email or document changes)
      if (data.email || data.documentNumber) {
        const duplicate = await prisma.user.findFirst({
          where: {
            id: { not: id },
            OR: [
              { email: data.email || undefined },
              { documentNumber: data.documentNumber || undefined }
            ]
          }
        });
        if (duplicate) return res.status(400).json({ error: 'El email o número de documento ya está en uso por otro usuario.' });
      }

      // 3. Email Change Logic
      const updatePayload: any = { ...data };
      if (data.email && data.email !== currentUser.email) {
        const confirmationToken = crypto.randomBytes(32).toString('hex');
        updatePayload.isConfirmed = false;
        updatePayload.confirmationToken = confirmationToken;
        await emailProvider.sendConfirmationEmail(data.email, data.name || currentUser.name, confirmationToken);
      }

      const updated = await prisma.user.update({
        where: { id },
        data: updatePayload
      });

      const { password, ...safeUser } = updated;
      
      const message = data.email && data.email !== currentUser.email 
        ? 'Usuario actualizado. Se ha enviado un nuevo correo de confirmación a la dirección ingresada.'
        : 'Usuario actualizado correctamente.';
        
      res.json({ user: safeUser, message });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async resendConfirmation(req: any, res: any) {
    try {
      const { id } = req.params;
      
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Solo el administrador puede reenviar correos de activación' });
      }

      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
      if (user.isConfirmed) return res.status(400).json({ error: 'La cuenta ya ha sido confirmada' });

      const newToken = crypto.randomBytes(32).toString('hex');
      await prisma.user.update({
        where: { id },
        data: { confirmationToken: newToken }
      });

      await emailProvider.sendConfirmationEmail(user.email, user.name, newToken);

      res.json({ message: 'Correo de confirmación reenviado exitosamente.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async delete(req: any, res: any) {
    try {
      const { id } = req.params;
      const { reason } = req.body; // Deletion reason or confirmation code validation logic

      // Only ADMIN can delete
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Solo el administrador puede eliminar usuarios' });
      }

      await prisma.user.update({
        where: { id },
        data: { isActive: false }
      });

      res.sendStatus(204);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async getClients(req: any, res: any) {
    try {
      const clients = await prisma.user.findMany({
        where: { role: 'CLIENT', isActive: true },
        select: { id: true, name: true, documentNumber: true, email: true }
      });
      res.json(clients);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
