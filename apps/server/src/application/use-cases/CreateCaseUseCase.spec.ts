import { CreateCaseUseCase } from './CreateCaseUseCase';
import { ICaseRepository } from '../../domain/interfaces/ICaseRepository';
import { IStorageProvider } from '../../domain/interfaces/IStorageProvider';

describe('CreateCaseUseCase', () => {
  let caseRepository: jest.Mocked<ICaseRepository>;
  let storageProvider: jest.Mocked<IStorageProvider>;
  let userRepository: any;
  let useCase: CreateCaseUseCase;

  beforeEach(() => {
    caseRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByLawyerId: jest.fn(),
      findByClientId: jest.fn(),
      getAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<ICaseRepository>;

    storageProvider = {
      createFolder: jest.fn(),
      shareFolder: jest.fn(),
      uploadFile: jest.fn(),
      ensureSubfolder: jest.fn(),
      moveFile: jest.fn(),
    } as unknown as jest.Mocked<IStorageProvider>;

    userRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    };

    useCase = new CreateCaseUseCase(caseRepository, storageProvider, userRepository);
  });

  it('should successfully create a case when valid data is provided', async () => {
    const validData = {
      title: 'Caso de Prueba',
      caseNumber: 'CASE-123',
      fees: 5000,
      lawyerId: '123e4567-e89b-12d3-a456-426614174000',
      clientId: '123e4567-e89b-12d3-a456-426614174001',
      description: 'Descripción del caso',
    };

    storageProvider.createFolder.mockResolvedValue('folder-id-123');
    caseRepository.save.mockResolvedValue({
      id: 'case-id-1',
      ...validData,
      driveFolderId: 'folder-id-123',
      status: 'PENDING',
    } as any);

    const result = await useCase.execute(validData);

    expect(storageProvider.createFolder).toHaveBeenCalledWith('CASE-123');
    expect(caseRepository.save).toHaveBeenCalledWith({
      ...validData,
      driveFolderId: 'folder-id-123',
      status: 'PENDING',
    });
    expect(result).toHaveProperty('id', 'case-id-1');
    expect(result).toHaveProperty('status', 'PENDING');
  });

  it('should throw an error when validation fails', async () => {
    const invalidData = {
      title: 'Ca', // min 3
      caseNumber: 'CASE-123',
      fees: -100, // positive required
      lawyerId: 'invalid-uuid',
      clientId: 'invalid-uuid',
    };

    await expect(useCase.execute(invalidData)).rejects.toThrow();
    expect(storageProvider.createFolder).not.toHaveBeenCalled();
    expect(caseRepository.save).not.toHaveBeenCalled();
  });
});
