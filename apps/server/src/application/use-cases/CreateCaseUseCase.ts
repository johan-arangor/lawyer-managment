import { z } from 'zod';
import { ICaseRepository } from '../../domain/interfaces/ICaseRepository';
import { IStorageProvider } from '../../domain/interfaces/IStorageProvider';

const createCaseSchema = z.object({
  title: z.string().min(3),
  caseNumber: z.string().min(3),
  fees: z.number().positive(),
  lawyerId: z.string().uuid(),
  clientId: z.string().uuid(),
  description: z.string().optional(),
  followUpLinks: z.array(z.object({
    title: z.string().optional(),
    url: z.string().url(),
  })).optional(),
});

type CreateCaseDTO = z.infer<typeof createCaseSchema>;

export class CreateCaseUseCase {
  constructor(
    private caseRepository: ICaseRepository,
    private storageProvider: IStorageProvider,
    private userRepository: any // Temporarily for client lookup
  ) {}

  async execute(data: any) {
    const validatedData = createCaseSchema.parse(data);

    // 1. Create root folder in Drive (Using caseNumber as requested)
    const folderId = await this.storageProvider.createFolder(validatedData.caseNumber);

    // 2. Share folder logic removed for root folder (Admin only)
    // Subfolders are made public inside storageProvider

    // 3. Persist case with the folder ID and internal links
    const newCase = await this.caseRepository.save({
      ...validatedData,
      driveFolderId: folderId,
      status: 'PENDING',
    });

    return newCase;
  }
}
