const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando sembrado de base de datos...');

  const adminEmail = 'adminlawyer@mienlacejuridico.com';
  const hashedPassword = await bcrypt.hash('adminL4wyer*', 10);

  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingUser) {
    console.log('🔄 El usuario administrador ya existe. Actualizando credenciales...');
    await prisma.user.update({
      where: { email: adminEmail },
      data: {
        password: hashedPassword,
        isActive: true,
        isConfirmed: true,
        hasPrivateAreaAccess: true,
        role: 'ADMIN'
      }
    });
    console.log('✅ Credenciales actualizadas con éxito.');
    console.log('📧 Email:', adminEmail);
    return;
  }

  const adminUser = await prisma.user.create({
    data: {
      email: adminEmail,
      password: hashedPassword,
      name: 'Administrador Principal',
      role: 'ADMIN',
      documentType: 'CC',
      documentNumber: '123456789',
      phone: '3000000000',
      isConfirmed: true,
      isActive: true,
      hasPrivateAreaAccess: true,
    },
  });

  console.log('✅ Usuario administrador creado con éxito:', adminUser.email);
  console.log('📧 Email:', adminEmail);
  console.log('🔑 Password: adminL4wyer*');
}

main()
  .catch((e) => {
    console.error('❌ Error en el sembrado:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
