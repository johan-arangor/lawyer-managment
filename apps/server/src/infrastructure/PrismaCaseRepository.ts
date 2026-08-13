import { prisma } from './prisma';
import { ICaseRepository } from '../domain/interfaces/ICaseRepository';

export class PrismaCaseRepository implements ICaseRepository {
  private prisma = prisma;

  async save(caseData: any): Promise<any> {
    const { followUpLinks, lawyerId, clientId, ...rest } = caseData;
    return this.prisma.case.create({
      data: {
        ...rest,
        statusUpdatedAt: new Date(),
        lawyer: { connect: { id: lawyerId } },
        client: { connect: { id: clientId } },
        followUpLinks: followUpLinks ? {
          create: followUpLinks
        } : undefined
      },
      include: { 
        lawyer: true, 
        client: true, 
        followUpLinks: true, 
        followUpNotes: { include: { author: { select: { name: true } } } },
        statusHistory: { include: { author: { select: { name: true } } } },
        payments: true,
        closedBy: { select: { name: true } }
      }
    });
  }

  async findById(id: string): Promise<any> {
    return this.prisma.case.findUnique({
      where: { id },
      include: {
        lawyer: true,
        client: true,
        closedBy: { select: { name: true } },
        followUpNotes: {
          include: { author: { select: { name: true } } },
          orderBy: { createdAt: 'desc' }
        },
        followUpLinks: true,
        statusHistory: {
          include: { author: { select: { name: true } } },
          orderBy: { createdAt: 'desc' }
        },
        payments: true
      }
    });
  }

  async findByLawyerId(lawyerId: string): Promise<any[]> {
    return this.prisma.case.findMany({
      where: { lawyerId },
      include: { client: true, closedBy: { select: { name: true } } }
    });
  }

  async findByClientId(clientId: string): Promise<any[]> {
    return this.prisma.case.findMany({
      where: { clientId },
      include: { lawyer: true, closedBy: { select: { name: true } } }
    });
  }

  async getAll(): Promise<any[]> {
    return this.prisma.case.findMany({
      include: {
        lawyer: true,
        client: true,
        closedBy: { select: { name: true } }
      }
    });
  }

  async update(id: string, data: any): Promise<any> {
    const { lawyerId, clientId, closedById, ...rest } = data;
    return this.prisma.case.update({
      where: { id },
      data: {
        ...rest,
        lawyerId: lawyerId,
        clientId: clientId,
        closedById: closedById
      },
      include: { 
        lawyer: true, 
        client: true,
        closedBy: { select: { name: true } },
        followUpNotes: { include: { author: { select: { name: true } } } },
        followUpLinks: true,
        statusHistory: { include: { author: { select: { name: true } } } },
        payments: true
      }
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.case.delete({
      where: { id }
    });
  }

  async getStats(): Promise<any> {
    const [total, pending, inProgress, closed] = await Promise.all([
      this.prisma.case.count(),
      this.prisma.case.count({ where: { status: 'PENDING' } }),
      this.prisma.case.count({ where: { status: 'IN_PROGRESS' } }),
      this.prisma.case.count({ where: { status: 'CLOSED' } })
    ]);

    return { total, pending, inProgress, closed };
  }

  async findWithFinancials(id: string): Promise<any> {
    return this.prisma.case.findUnique({
      where: { id },
      include: {
        payments: true,
        lawyer: { select: { name: true } },
        client: { select: { name: true } }
      }
    });
  }

  async createFollowUpLink(caseId: string, title: string, url: string): Promise<any> {
    return this.prisma.followUpLink.create({
      data: { title, url, caseId },
      include: { case: { include: { followUpLinks: true } } }
    });
  }

  async deleteFollowUpLink(id: string): Promise<void> {
    await this.prisma.followUpLink.delete({ where: { id } });
  }

  async createFollowUpNote(caseId: string, authorId: string, title: string, content: string): Promise<any> {
    return this.prisma.followUpNote.create({
      data: { title, content, caseId, authorId },
      include: { author: { select: { name: true } } }
    });
  }

  async deleteFollowUpNote(id: string): Promise<void> {
    await this.prisma.followUpNote.delete({ where: { id } });
  }

  async addPayment(caseId: string, amount: number, method: string, date: Date, comprobanteId?: string): Promise<any> {
    return this.prisma.$transaction(async (tx) => {
      const p = await tx.payment.create({
        data: { amount, method, date, comprobanteId, caseId }
      });
      
      await tx.case.update({
        where: { id: caseId },
        data: { paidBalance: { increment: amount } }
      });

      return p;
    });
  }
}
