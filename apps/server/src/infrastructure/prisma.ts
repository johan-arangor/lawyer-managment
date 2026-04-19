
import { PrismaClient } from '@prisma/client';

// Instancia única (Singleton) optimizada para el entorno
export const prisma = new PrismaClient({
  log: ['error', 'warn'],
});
