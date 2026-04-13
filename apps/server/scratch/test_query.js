
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const id = 'f196db0c-e08c-4ea6-8189-cce655c6a5a1';
  try {
    const caseFound = await prisma.case.findUnique({
      where: { id },
      include: {
        lawyer: { select: { id: true, name: true, email: true } },
        client: { select: { id: true, name: true, email: true } },
        followUpNotes: { 
          include: { 
            author: { select: { name: true } },
            deletedBy: { select: { name: true } }
          },
          orderBy: { createdAt: 'desc' }
        },
        followUpLinks: true,
        statusHistory: { 
          include: { author: { select: { name: true } } },
          orderBy: { createdAt: 'desc' }
        },
        payments: { 
          include: { registeredBy: { select: { name: true } } },
          orderBy: { date: 'desc' } 
        },
        documents: {
          include: { 
            uploadedBy: { select: { name: true } },
            deletedBy: { select: { name: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    console.log('SUCCESS:', JSON.stringify(caseFound, null, 2));
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
