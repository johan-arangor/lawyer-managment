import { ICaseRepository } from '../../domain/interfaces/ICaseRepository';

export class DeleteCaseUseCase {
  constructor(private caseRepository: ICaseRepository) {}

  async execute(id: string) {
    const existingCase = await this.caseRepository.findById(id);
    if (!existingCase) {
      throw new Error('Case not found');
    }

    return this.caseRepository.delete(id);
  }
}
