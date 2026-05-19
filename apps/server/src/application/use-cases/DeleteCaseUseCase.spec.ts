import { DeleteCaseUseCase } from './DeleteCaseUseCase';
import { ICaseRepository } from '../../domain/interfaces/ICaseRepository';

describe('DeleteCaseUseCase', () => {
  let caseRepository: jest.Mocked<ICaseRepository>;
  let useCase: DeleteCaseUseCase;

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

    useCase = new DeleteCaseUseCase(caseRepository);
  });

  it('should delete a case when it exists', async () => {
    const caseId = 'case-id-123';
    caseRepository.findById.mockResolvedValue({ id: caseId, title: 'Test Case' } as any);
    caseRepository.delete.mockResolvedValue(true as any);

    const result = await useCase.execute(caseId);

    expect(caseRepository.findById).toHaveBeenCalledWith(caseId);
    expect(caseRepository.delete).toHaveBeenCalledWith(caseId);
    expect(result).toBe(true);
  });

  it('should throw an error when case does not exist', async () => {
    const caseId = 'non-existent-id';
    caseRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(caseId)).rejects.toThrow('Case not found');
    expect(caseRepository.findById).toHaveBeenCalledWith(caseId);
    expect(caseRepository.delete).not.toHaveBeenCalled();
  });
});
