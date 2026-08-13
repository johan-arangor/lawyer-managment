import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

async function main() {
  console.log('🧪 Iniciando prueba de conexión...');
  console.log('🔗 URL:', process.env.DATABASE_URL?.replace(/:([^:@]+)@/, ':****@'));
  
  try {
    const result = await prisma.$queryRaw`SELECT 1 as result`;
    console.log('✅ Conexión exitosa:', result);
  } catch (error: any) {
    console.error('❌ Error de conexión:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
