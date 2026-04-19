import { User } from '@prisma/client';
import { prisma } from './prisma';
import { IUserRepository } from '../domain/interfaces/IUserRepository';

export class PrismaUserRepository implements IUserRepository {
  private prisma = prisma;

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async create(data: any): Promise<User> {
    return this.prisma.user.create({ data });
  }
}
