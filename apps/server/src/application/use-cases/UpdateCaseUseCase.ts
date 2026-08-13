import { z } from 'zod';
import { ICaseRepository } from '../../domain/interfaces/ICaseRepository';

const updateCaseSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'CLOSED']).optional(),
  fees: z.number().positive().optional(),
  paidBalance: z.number().optional(),
});

export class UpdateCaseUseCase {
  constructor(private caseRepository: ICaseRepository) {}

  async execute(id: string, data: any) {
    const validatedData = updateCaseSchema.parse(data);
    
    const existingCase = await this.caseRepository.findById(id);
    if (!existingCase) {
      throw new Error('Case not found');
    }

    return this.caseRepository.update(id, validatedData);
  }
}
