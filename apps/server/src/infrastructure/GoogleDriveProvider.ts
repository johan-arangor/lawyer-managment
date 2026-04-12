import { google } from 'googleapis';
import { IStorageProvider } from '../domain/interfaces/IStorageProvider';

export class GoogleDriveProvider implements IStorageProvider {
  private drive;

  constructor() {
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    auth.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });

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
        await this.drive.files.create({
          requestBody: {
            name: subName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [rootFolderId],
          },
          fields: 'id',
          supportsAllDrives: true,
        });
      }

      return rootFolderId;
    } catch (error) {
      console.error('Google Drive Create Folder Error:', error);
      throw new Error('Storage service unavailable');
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
    } catch (error) {
      console.error('Google Drive Upload File Error:', error);
      throw new Error('Storage service unavailable');
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
}
