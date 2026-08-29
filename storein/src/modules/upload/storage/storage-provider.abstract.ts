export type UploadFolder =
  | 'products'
  | 'avatars'
  | 'reviews'
  | 'categories'
  | 'banners'
  | 'logos';

export interface StorageResult {
  key: string;
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

export interface ProcessedFile {
  buffer: Buffer;
  mimeType: string;
  size: number;
  filename: string;
}

export abstract class StorageProvider {
  abstract save(
    file: ProcessedFile,
    folder: UploadFolder,
  ): Promise<StorageResult>;
  abstract delete(key: string): Promise<void>;
  abstract getUrl(key: string): string;
}
