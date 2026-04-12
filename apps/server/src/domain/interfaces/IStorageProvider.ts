import { Readable } from 'stream';

export interface IStorageProvider {
  createFolder(caseName: string): Promise<string>;
  uploadFile(fileStream: any, folderId: string, fileName: string, mimeType?: string, subfolderName?: string): Promise<string>;
  findSubfolderId(parentFolderId: string, name: string): Promise<string | null>;
}
