import { UploadDocumentUseCase } from './UploadDocumentUseCase';
import { IStorageProvider } from '../../domain/interfaces/IStorageProvider';
import { Readable } from 'stream';

describe('UploadDocumentUseCase', () => {
  let storageProvider: jest.Mocked<IStorageProvider>;
  let mockPrisma: any;
  let useCase: UploadDocumentUseCase;

  beforeEach(() => {
    storageProvider = {
      createFolder: jest.fn(),
      shareFolder: jest.fn(),
      uploadFile: jest.fn(),
      ensureSubfolder: jest.fn(),
      moveFile: jest.fn(),
    } as unknown as jest.Mocked<IStorageProvider>;

    mockPrisma = {
      case: {
        findUnique: jest.fn(),
      },
    };

    useCase = new UploadDocumentUseCase(storageProvider);
    (useCase as any).prisma = mockPrisma;
  });

  it('should successfully upload a document when case and driveFolderId exist', async () => {
    const caseId = 'case-id-123';
    const mockStream = new Readable({ read() {} });
    const fileData = { stream: mockStream, name: 'test-doc.pdf', mimeType: 'application/pdf' };

    mockPrisma.case.findUnique.mockResolvedValue({
      id: caseId,
      driveFolderId: 'drive-folder-123',
    });

    storageProvider.uploadFile.mockResolvedValue('file-id-456');

    const result = await useCase.execute(caseId, fileData, 'DOCS');

    expect(mockPrisma.case.findUnique).toHaveBeenCalledWith({ where: { id: caseId } });
    expect(storageProvider.uploadFile).toHaveBeenCalledWith(
      mockStream,
      'drive-folder-123',
      'test-doc.pdf',
      'application/pdf',
      'DOCS'
    );
    expect(result).toEqual({
      fileId: 'file-id-456',
      name: 'test-doc.pdf',
      caseId: caseId,
    });
  });

  it('should throw an error when case is not found', async () => {
    const caseId = 'non-existent-id';
    const mockStream = new Readable({ read() {} });
    const fileData = { stream: mockStream, name: 'test-doc.pdf', mimeType: 'application/pdf' };

    mockPrisma.case.findUnique.mockResolvedValue(null);

    await expect(useCase.execute(caseId, fileData)).rejects.toThrow('Case not found or Drive folder not initialized');
    expect(storageProvider.uploadFile).not.toHaveBeenCalled();
  });

  it('should throw an error when driveFolderId is missing', async () => {
    const caseId = 'case-id-no-folder';
    const mockStream = new Readable({ read() {} });
    const fileData = { stream: mockStream, name: 'test-doc.pdf', mimeType: 'application/pdf' };

    mockPrisma.case.findUnique.mockResolvedValue({
      id: caseId,
      driveFolderId: null,
    });

    await expect(useCase.execute(caseId, fileData)).rejects.toThrow('Case not found or Drive folder not initialized');
    expect(storageProvider.uploadFile).not.toHaveBeenCalled();
  });
});
