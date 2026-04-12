import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- DIAGNÓSTICO DE CLIENTES Y CASOS ---');
  
  const clients = await prisma.user.findMany({
    where: { role: 'CLIENT' },
    select: { id: true, name: true, email: true }
  });

  console.log(`Clientes encontrados: ${clients.length}`);

  for (const client of clients) {
    const casesCount = await prisma.case.count({
      where: { clientId: client.id }
    });
    console.log(`Cliente: ${client.name} (${client.email}) - ID: ${client.id} - Casos: ${casesCount}`);
    
    if (casesCount > 0) {
      const cases = await prisma.case.findMany({
        where: { clientId: client.id },
        select: { title: true, status: true, caseNumber: true }
      });
      cases.forEach(c => console.log(`  -> [${c.status}] ${c.caseNumber}: ${c.title}`));
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
