import { GetCasesUseCase } from './GetCasesUseCase';
import { ICaseRepository } from '../../domain/interfaces/ICaseRepository';

describe('GetCasesUseCase', () => {
  let caseRepository: jest.Mocked<ICaseRepository>;
  let useCase: GetCasesUseCase;

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

    useCase = new GetCasesUseCase(caseRepository);
  });

  it('should return all cases for ADMIN role', async () => {
    const mockCases = [{ id: '1', title: 'Case 1' }];
    caseRepository.getAll.mockResolvedValue(mockCases as any);

    const result = await useCase.execute({ id: 'admin-1', role: 'ADMIN' });

    expect(caseRepository.getAll).toHaveBeenCalled();
    expect(result).toEqual(mockCases);
  });

  it('should return lawyer cases for LAWYER role', async () => {
    const mockCases = [{ id: '2', title: 'Lawyer Case' }];
    caseRepository.findByLawyerId.mockResolvedValue(mockCases as any);

    const result = await useCase.execute({ id: 'lawyer-1', role: 'LAWYER' });

    expect(caseRepository.findByLawyerId).toHaveBeenCalledWith('lawyer-1');
    expect(result).toEqual(mockCases);
  });

  it('should return client cases for CLIENT role', async () => {
    const mockCases = [{ id: '3', title: 'Client Case' }];
    caseRepository.findByClientId.mockResolvedValue(mockCases as any);

    const result = await useCase.execute({ id: 'client-1', role: 'CLIENT' });

    expect(caseRepository.findByClientId).toHaveBeenCalledWith('client-1');
    expect(result).toEqual(mockCases);
  });

  it('should return empty array for unknown role', async () => {
    const result = await useCase.execute({ id: 'guest-1', role: 'GUEST' });

    expect(result).toEqual([]);
    expect(caseRepository.getAll).not.toHaveBeenCalled();
    expect(caseRepository.findByLawyerId).not.toHaveBeenCalled();
    expect(caseRepository.findByClientId).not.toHaveBeenCalled();
  });
});
