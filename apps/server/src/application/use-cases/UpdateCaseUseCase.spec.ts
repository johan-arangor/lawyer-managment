import { UpdateCaseUseCase } from './UpdateCaseUseCase';
import { ICaseRepository } from '../../domain/interfaces/ICaseRepository';

describe('UpdateCaseUseCase', () => {
  let caseRepository: jest.Mocked<ICaseRepository>;
  let useCase: UpdateCaseUseCase;

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

    useCase = new UpdateCaseUseCase(caseRepository);
  });

  it('should successfully update a case when valid data is provided', async () => {
    const caseId = 'case-id-123';
    const updateData = { title: 'Título Actualizado', status: 'IN_PROGRESS' };

    caseRepository.findById.mockResolvedValue({ id: caseId, title: 'Old Title' } as any);
    caseRepository.update.mockResolvedValue({ id: caseId, ...updateData } as any);

    const result = await useCase.execute(caseId, updateData);

    expect(caseRepository.findById).toHaveBeenCalledWith(caseId);
    expect(caseRepository.update).toHaveBeenCalledWith(caseId, updateData);
    expect(result).toEqual({ id: caseId, ...updateData });
  });

  it('should throw an error when case is not found', async () => {
    const caseId = 'non-existent-id';
    caseRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(caseId, { title: 'New Title' })).rejects.toThrow('Case not found');
    expect(caseRepository.update).not.toHaveBeenCalled();
  });

  it('should throw an error when validation fails', async () => {
    const caseId = 'case-id-123';
    const invalidData = { fees: -500 }; // positive required

    await expect(useCase.execute(caseId, invalidData)).rejects.toThrow();
    expect(caseRepository.findById).not.toHaveBeenCalled();
    expect(caseRepository.update).not.toHaveBeenCalled();
  });
});
