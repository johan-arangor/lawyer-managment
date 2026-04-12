const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  await prisma.user.create({
    data: {
      email: 'admin@enlace.com',
      name: 'Administrador Boss',
      password: hashedPassword,
      role: 'ADMIN'
    }
  });

  await prisma.user.create({
    data: {
      email: 'lawyer@enlace.com',
      name: 'Abogado Jr',
      password: hashedPassword,
      role: 'LAWYER'
    }
  });

  await prisma.user.create({
    data: {
      email: 'cliente@ejemplo.com',
      name: 'Cliente Juan',
      password: hashedPassword,
      role: 'CLIENT'
    }
  });

  console.log('Seed completed successfully');
}

main().catch(console.error).finally(() => prisma.$disconnect());
