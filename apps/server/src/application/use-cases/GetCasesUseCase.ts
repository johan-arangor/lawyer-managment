import { ICaseRepository } from '../../domain/interfaces/ICaseRepository';

export class GetCasesUseCase {
  constructor(private caseRepository: ICaseRepository) {}

  async execute(user: { id: string; role: string }) {
    if (user.role === 'ADMIN') {
      return this.caseRepository.getAll();
    }

    if (user.role === 'LAWYER') {
      return this.caseRepository.findByLawyerId(user.id);
    }

    if (user.role === 'CLIENT') {
      return this.caseRepository.findByClientId(user.id);
    }

    return [];
  }
}
