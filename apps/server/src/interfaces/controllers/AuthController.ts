import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '../../infrastructure/prisma';
import { EmailProvider } from '../../infrastructure/EmailProvider';

const emailProvider = new EmailProvider();

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user || !user.isActive) {
        return res.status(401).json({ error: 'Credenciales inválidas o cuenta desactivada' });
      }

      if (!user.isConfirmed) {
        return res.status(403).json({ error: 'Debes confirmar tu cuenta por correo antes de ingresar' });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      const token = jwt.sign(
        { id: user.id, role: user.role, email: user.email },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '24h' }
      );

      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, token });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async confirmAccount(req: Request, res: Response) {
    try {
      const { token, password } = req.body;
      const user = await prisma.user.findUnique({ where: { confirmationToken: token } });

      if (!user) {
        return res.status(400).json({ error: 'Enlace de confirmación inválido o expirado' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: {
          isConfirmed: true,
          confirmationToken: null,
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
      const { email } = req.body;
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        // Obfuscate if user exists for security
        return res.json({ message: 'Si el correo está registrado, recibirás un enlace de recuperación.' });
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      const tokenExpires = new Date(Date.now() + 3600000); // 1 hour

      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken, tokenExpires }
      });

      await emailProvider.sendResetPasswordEmail(email, user.name, resetToken);

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
