import { Readable } from 'stream';

export interface IStorageProvider {
  createFolder(caseName: string): Promise<string>;
  uploadFile(fileStream: any, folderId: string, fileName: string, mimeType?: string, subfolderName?: string): Promise<string>;
  findSubfolderId(parentFolderId: string, name: string): Promise<string | null>;
  shareFolder(folderId: string, email: string, role?: 'reader' | 'writer'): Promise<void>;
  ensureSubfolder(parentFolderId: string, name: string): Promise<string | null>;
  moveFile(fileId: string, targetFolderId: string): Promise<void>;
}
