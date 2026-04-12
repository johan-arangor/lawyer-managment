import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export class UserController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await prisma.user.findMany({
        select: { id: true, name: true, role: true, email: true, createdAt: true }
      });
      res.status(200).json(users);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, name, role } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { email, password: hashedPassword, name, role }
      });
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { password, ...data } = req.body;
      if (password) {
        data.password = await bcrypt.hash(password, 10);
      }
      const user = await prisma.user.update({
        where: { id },
        data
      });
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await prisma.user.delete({ where: { id } });
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
