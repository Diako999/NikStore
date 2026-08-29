import {
  BadRequestException,
  Injectable,
  Logger,
  PayloadTooLargeException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';
import { randomUUID } from 'crypto';
import {
  StorageProvider,
  StorageResult,
  UploadFolder,
} from './storage/storage-provider.abstract';

const ALLOWED_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const MAX_DIMENSION = 1920;
const THUMB_SIZE = 300;

export interface UploadResult {
  original: StorageResult;
  thumbnail: StorageResult | null;
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly maxFileSize: number;

  constructor(
    private storage: StorageProvider,
    private configService: ConfigService,
  ) {
    this.maxFileSize = this.configService.get<number>('upload.maxFileSize')!;
  }

  // ── Single image upload ───────────────────────────────────────
  async uploadImage(
    file: Express.Multer.File,
    folder: UploadFolder,
    generateThumb = true,
  ): Promise<UploadResult> {
    this.validate(file);

    const id = randomUUID();

    const originalBuffer = await sharp(file.buffer)
      .resize(MAX_DIMENSION, MAX_DIMENSION, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toBuffer();

    const originalResult = await this.storage.save(
      {
        buffer: originalBuffer,
        mimeType: 'image/webp',
        size: originalBuffer.length,
        filename: `${id}.webp`,
      },
      folder,
    );

    let thumbnailResult: StorageResult | null = null;
    if (generateThumb) {
      const thumbBuffer = await sharp(file.buffer)
        .resize(THUMB_SIZE, THUMB_SIZE, { fit: 'cover' })
        .webp({ quality: 75 })
        .toBuffer();

      thumbnailResult = await this.storage.save(
        {
          buffer: thumbBuffer,
          mimeType: 'image/webp',
          size: thumbBuffer.length,
          filename: `${id}_thumb.webp`,
        },
        folder,
      );
    }

    this.logger.log(`Uploaded: ${originalResult.key}`);
    return { original: originalResult, thumbnail: thumbnailResult };
  }

  // ── Multiple images ───────────────────────────────────────────
  async uploadImages(
    files: Express.Multer.File[],
    folder: UploadFolder,
    generateThumb = true,
  ): Promise<UploadResult[]> {
    if (!files?.length)
      throw new BadRequestException('هیچ فایلی ارسال نشده است');

    if (files.length > 10)
      throw new BadRequestException('حداکثر ۱۰ فایل در یک درخواست مجاز است');

    return Promise.all(
      files.map((f) => this.uploadImage(f, folder, generateThumb)),
    );
  }

  // ── Delete ────────────────────────────────────────────────────
  async deleteFile(key: string): Promise<void> {
    await this.storage.delete(key);

    const thumbKey = key.replace(/(\.[^.]+)$/, '_thumb$1');
    await this.storage.delete(thumbKey).catch(() => {
      // Thumbnail may not exist — ignore
    });
  }

  // ── Validation ────────────────────────────────────────────────
  private validate(file: Express.Multer.File): void {
    if (!file) throw new BadRequestException('فایل ارسال نشده است');

    if (!ALLOWED_MIMES.has(file.mimetype))
      throw new BadRequestException(
        `فرمت فایل مجاز نیست. فرمت‌های قابل قبول: ${[...ALLOWED_MIMES].join(', ')}`,
      );

    if (file.size > this.maxFileSize)
      throw new PayloadTooLargeException(
        `حجم فایل بیش از حد مجاز است. حداکثر: ${this.maxFileSize / 1024 / 1024} مگابایت`,
      );
  }
}
