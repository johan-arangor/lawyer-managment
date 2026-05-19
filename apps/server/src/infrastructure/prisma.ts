import { PrismaClient } from '@prisma/client';

// Singleton para el cliente de Prisma
// Usamos engineType "library" en el esquema para estabilidad en Hostinger

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
});

export default prisma;
