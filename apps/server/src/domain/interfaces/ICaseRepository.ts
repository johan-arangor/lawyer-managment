export interface ICaseRepository {
  save(caseData: any): Promise<any>;
  findById(id: string): Promise<any>;
  findByLawyerId(lawyerId: string): Promise<any[]>;
  findByClientId(clientId: string): Promise<any[]>;
  getAll(): Promise<any[]>;
  update(id: string, data: any): Promise<any>;
  delete(id: string): Promise<void>;
  getStats(): Promise<any>;
  findWithFinancials(id: string): Promise<any>;
  createFollowUpLink(caseId: string, title: string, url: string): Promise<any>;
  deleteFollowUpLink(id: string): Promise<void>;
  createFollowUpNote(caseId: string, authorId: string, title: string, content: string): Promise<any>;
  deleteFollowUpNote(id: string): Promise<void>;
  addPayment(caseId: string, amount: number, method: string, date: Date, comprobanteId?: string): Promise<any>;
}
