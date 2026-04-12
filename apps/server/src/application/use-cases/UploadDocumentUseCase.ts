import { IStorageProvider } from '../../domain/interfaces/IStorageProvider';
import { PrismaClient } from '@prisma/client';
import { Readable } from 'stream';

export class UploadDocumentUseCase {
  private prisma = new PrismaClient();

  constructor(private storageProvider: IStorageProvider) {}

  async execute(caseId: string, file: { stream: Readable; name: string; mimeType: string }, subfolder?: string) {
    // 1. Get the case to find the folderId
    const existingCase = await this.prisma.case.findUnique({
      where: { id: caseId },
    });

    if (!existingCase || !existingCase.driveFolderId) {
      throw new Error('Case not found or Drive folder not initialized');
    }

    // 2. Upload to Drive (passing subfolder preference)
    const fileId = await this.storageProvider.uploadFile(
      file.stream,
      existingCase.driveFolderId,
      file.name,
      file.mimeType,
      subfolder
    );

    return {
      fileId,
      name: file.name,
      caseId: existingCase.id
    };
  }
}
