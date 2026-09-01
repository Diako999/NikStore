import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import {
  ProcessedFile,
  StorageProvider,
  StorageResult,
  UploadFolder,
} from './storage-provider.abstract';

@Injectable()
export class LocalStorageProvider extends StorageProvider {
  private readonly logger = new Logger(LocalStorageProvider.name);
  private readonly dest: string;
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    super();
    this.dest = this.configService.get<string>('upload.dest')!;
    this.baseUrl = this.configService.get<string>('upload.baseUrl')!;
  }

  save(file: ProcessedFile, folder: UploadFolder): Promise<StorageResult> {
    const dir = path.join(this.dest, folder);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const filePath = path.join(dir, file.filename);
    fs.writeFileSync(filePath, file.buffer);

    const key = `${folder}/${file.filename}`;
    this.logger.debug(`Saved file: ${key}`);

    return Promise.resolve({
      key,
      url: this.getUrl(key),
      filename: file.filename,
      size: file.size,
      mimeType: file.mimeType,
    });
  }

  delete(key: string): Promise<void> {
    const filePath = path.join(this.dest, key);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      this.logger.debug(`Deleted file: ${key}`);
    }
    return Promise.resolve();
  }

  getUrl(key: string): string {
    // Return a root-relative path so DB records are environment-independent.
    // Both server.js files proxy /uploads → backend; Vite dev configs do the same.
    return `/uploads/${key}`;
  }
}
