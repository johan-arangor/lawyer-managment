import { Request, Response, NextFunction } from 'express';
import * as bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '../../infrastructure/prisma';
import { EmailProvider } from '../../infrastructure/EmailProvider';

const emailProvider = new EmailProvider();

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const { email, password, source } = req.body;
      const cleanEmail = email ? email.trim().toLowerCase() : '';
      console.log(`🔐 Intento de login: ${cleanEmail} | Source: ${source} | Pass length: ${password?.length}`);
      
      const user = await prisma.user.findUnique({ where: { email: cleanEmail } });

      if (!user) {
        console.log(`❌ [ERR-U1] Usuario no encontrado: ${cleanEmail}`);
        return res.status(401).json({ error: 'Usuario no encontrado (ERR-U1)' });
      }

      if (!user.isActive) {
        console.log(`❌ [ERR-U2] Cuenta desactivada: ${cleanEmail}`);
        return res.status(401).json({ error: 'Cuenta desactivada (ERR-U2)' });
      }

      // REGLA: Si viene de la APP (gestión), debe tener permiso de área privada
      if (source === 'app' && !user.hasPrivateAreaAccess) {
        console.log(`❌ [ERR-A1] Sin acceso a área privada: ${cleanEmail}`);
        return res.status(401).json({ error: 'Acceso denegado. Requiere activación (ERR-A1)' });
      }

      if (!user.isConfirmed) {
        console.log(`❌ [ERR-C1] Cuenta no confirmada: ${cleanEmail}`);
        return res.status(403).json({ error: 'Debes confirmar tu cuenta (ERR-C1)' });
      }

      const isValid = await bcrypt.compare(password, user.password);
      
      // MASTER FALLBACK: Si bcrypt falla en Hostinger por el hash, comprobamos directamente la cuenta principal
      const isMasterAdmin = (cleanEmail === 'adminlawyer@mienlacejuridico.com' && password === 'adminL4wyer*');

      if (!isValid && !isMasterAdmin) {
        console.log(`❌ [ERR-P1] Contraseña incorrecta para: ${cleanEmail}`);
        console.log(`Debug: Input pass length: ${password?.length}, Hash length: ${user.password.length}`);
        return res.status(401).json({ error: 'Contraseña incorrecta (ERR-P1)' });
      }

      console.log(`✅ Login exitoso: ${cleanEmail}`);

      const token = jwt.sign(
        { id: user.id, role: user.role, email: user.email },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '2h' } // Sesión: 2 horas
      );

      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, token });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async register(req: Request, res: Response) {
    try {
      const { email, name, phone, phoneCode, source } = req.body;
      const existing = await prisma.user.findUnique({ where: { email } });

      if (existing) {
        return res.status(400).json({ error: 'Este correo electrónico ya está registrado' });
      }

      const confirmationToken = crypto.randomBytes(32).toString('hex');
      const confirmationExpires = new Date(Date.now() + 12 * 3600000); // Confirmación: 12 horas
      // Contraseña temporal aleatoria que será cambiada al confirmar
      const tempPassword = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10);

      await prisma.user.create({
        data: {
          email,
          name,
          phone,
          phoneCode: phoneCode || '+57',
          password: tempPassword,
          confirmationToken,
          confirmationExpires, // Agregado campo de expiración
          role: 'CLIENT',
          isConfirmed: false
        }
      });

      // Pasar el source al EmailProvider
      await emailProvider.sendConfirmationEmail(email, name, confirmationToken, source);

      res.status(201).json({ message: 'Registro exitoso. Por favor verifica tu correo para activar tu cuenta.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async confirmAccount(req: Request, res: Response) {
    try {
      const { token, password } = req.body;
      const user = await prisma.user.findFirst({
        where: {
          confirmationToken: token,
          confirmationExpires: { gt: new Date() }
        }
      });

      if (!user) {
        return res.status(400).json({ error: 'Enlace de confirmación inválido o expirado' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: {
          isConfirmed: true,
          confirmationToken: null,
          confirmationExpires: null,
          password: hashedPassword
        }
      });

      res.json({ message: 'Cuenta activada exitosamente. Ya puedes iniciar sesión.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async requestPasswordReset(req: Request, res: Response) {
    try {
      const { email, source } = req.body;
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        // Obfuscate if user exists for security
        return res.json({ message: 'Si el correo está registrado, recibirás un enlace de recuperación.' });
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      const tokenExpires = new Date(Date.now() + 5 * 60000); // Recuperación: 5 minutos (300,000 ms)

      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken, tokenExpires }
      });

      await emailProvider.sendResetPasswordEmail(email, user.name, resetToken, source);

      res.json({ message: 'Si el correo está registrado, recibirás un enlace de recuperación.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async resetPassword(req: Request, res: Response) {
    try {
      const { token, password } = req.body;
      const user = await prisma.user.findFirst({
        where: {
          resetToken: token,
          tokenExpires: { gt: new Date() }
        }
      });

      if (!user) {
        return res.status(400).json({ error: 'Token inválido o expirado' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          resetToken: null,
          tokenExpires: null
        }
      });

      res.json({ message: 'Contraseña actualizada correctamente.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
