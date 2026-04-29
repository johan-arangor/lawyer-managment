import { google } from 'googleapis';
import { IStorageProvider } from '../domain/interfaces/IStorageProvider';

export class GoogleDriveProvider implements IStorageProvider {
  private drive;

  constructor() {
    let auth;

    if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      try {
        const key = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
        auth = new google.auth.JWT(
          key.client_email,
          undefined,
          key.private_key,
          ['https://www.googleapis.com/auth/drive']
        );
      } catch (err) {
        console.error('Error parsing GOOGLE_SERVICE_ACCOUNT_KEY, falling back to OAuth2');
      }
    }

    if (!auth) {
      auth = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );

      auth.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
      });
    }

    this.drive = google.drive({ version: 'v3', auth });
  }

  async createFolder(caseName: string): Promise<string> {
    try {
      const fileMetadata = {
        name: caseName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID!],
      };

      const folder = await this.drive.files.create({
        requestBody: fileMetadata,
        fields: 'id',
        supportsAllDrives: true,
      });

      const rootFolderId = folder.data.id;
      if (!rootFolderId) {
        throw new Error('Failed to create root folder in Google Drive');
      }

      // Create subfolders: EVIDENCIAS, DOCUMENTOS, PAGOS, OTROS, CLIENTE
      const subfolders = ['EVIDENCIAS', 'DOCUMENTOS', 'PAGOS', 'OTROS', 'CLIENTE'];
      for (const subName of subfolders) {
        const sub = await this.drive.files.create({
          requestBody: {
            name: subName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [rootFolderId],
          },
          fields: 'id',
          supportsAllDrives: true,
        });

        // Make "CLIENTE" and "PAGOS" folders public automatically (KISS for all clients)
        if ((subName === 'DOCUMENTOS' || subName === 'EVIDENCIAS' || subName === 'OTROS' || subName === 'CLIENTE' || subName === 'PAGOS') && sub.data.id) {
          await this.shareFolder(sub.data.id, 'anyone', 'reader');
        }
      }

      return rootFolderId;
    } catch (error: any) {
      console.error('Google Drive Create Folder Error:', error?.response?.data || error);
      throw new Error(`Storage service unavailable: ${error?.message || 'Unknown error'}`);
    }
  }

  async uploadFile(fileStream: any, folderId: string, fileName: string, mimeType: string = 'application/octet-stream', subfolderName?: string): Promise<string> {
    try {
      let targetFolderId = folderId;

      if (subfolderName) {
        let subId = await this.findSubfolderId(folderId, subfolderName);

        if (!subId) {
          // Si no existe, la creamos on-demand
          const subFolder = await this.drive.files.create({
            requestBody: {
              name: subfolderName,
              mimeType: 'application/vnd.google-apps.folder',
              parents: [folderId],
            },
            fields: 'id',
            supportsAllDrives: true,
          });
          subId = subFolder.data.id || null;
        }

        if (subId) targetFolderId = subId;
      }

      const fileMetadata = {
        name: fileName,
        parents: [targetFolderId],
      };

      const media = {
        mimeType: mimeType,
        body: fileStream,
      };

      const file = await this.drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id',
        supportsAllDrives: true,
      });

      if (!file.data.id) {
        throw new Error('Failed to upload file to Google Drive');
      }

      return file.data.id;
    } catch (error: any) {
      console.error('Google Drive Upload File Error:', error?.response?.data || error);
      throw new Error(`Storage service unavailable: ${error?.message || 'Unknown error'}`);
    }
  }

  public async findSubfolderId(parentFolderId: string, name: string): Promise<string | null> {
    try {
      const response = await this.drive.files.list({
        q: `'${parentFolderId}' in parents and name = '${name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
        fields: 'files(id, name)',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });

      const files = response.data.files;
      if (files && files.length > 0) {
        return files[0].id!;
      }
      return null;
    } catch (error) {
      console.error('Error finding subfolder:', error);
      return null;
    }
  }

  async shareFolder(folderId: string, email: string, role: 'reader' | 'writer' = 'reader'): Promise<void> {
    try {
      const isPublic = email === 'anyone';

      await this.drive.permissions.create({
        fileId: folderId,
        requestBody: {
          role: role === 'reader' ? 'reader' : 'writer',
          type: isPublic ? 'anyone' : 'user',
          ...(isPublic ? {} : { emailAddress: email }),
        },
        supportsAllDrives: true,
      });
    } catch (error) {
      console.error(`Error sharing folder ${folderId} with ${email}:`, error);
    }
  }

  async ensureSubfolder(parentFolderId: string, name: string): Promise<string | null> {
    try {
      let subId = await this.findSubfolderId(parentFolderId, name);
      if (subId) return subId;

      const subFolder = await this.drive.files.create({
        requestBody: {
          name,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [parentFolderId],
        },
        fields: 'id',
        supportsAllDrives: true,
      });

      const newId = subFolder.data.id || null;
      
      // Auto-share public folders if created on-demand
      const publicFolders = ['EVIDENCIAS', 'DOCUMENTOS', 'PAGOS', 'OTROS', 'CLIENTE'];
      if (newId && publicFolders.includes(name)) {
        await this.shareFolder(newId, 'anyone', 'reader');
      }

      return newId;
    } catch (error) {
      console.error('Error ensuring subfolder:', error);
      return null;
    }
  }

  async moveFile(fileId: string, targetFolderId: string): Promise<void> {
    try {
      // 1. Get current parents to remove them
      const file = await this.drive.files.get({
        fileId: fileId,
        fields: 'parents',
        supportsAllDrives: true,
      });
      const previousParents = file.data.parents?.join(',') || '';

      // 2. Update file parents
      await this.drive.files.update({
        fileId: fileId,
        addParents: targetFolderId,
        removeParents: previousParents,
        fields: 'id, parents',
        supportsAllDrives: true,
      });
    } catch (error) {
      console.error('Google Drive Move File Error:', error);
      throw new Error('Failed to move file in storage');
    }
  }
}
