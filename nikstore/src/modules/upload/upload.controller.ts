import {
  BadRequestException,
  Controller,
  Delete,
  Param,
  Post,
  Query,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadService, UploadResult } from './upload.service';
import type { UploadFolder } from './storage/storage-provider.abstract';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';

// Read directly from process.env (mirrors config/upload.config.ts's own default) —
// this object is built at module load, before Nest's DI container exists.
const MAX_FILE_SIZE = parseInt(
  process.env.UPLOAD_MAX_FILE_SIZE || '5242880',
  10,
);

const multerOptions = {
  storage: memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
};

const ALLOWED_FOLDERS: readonly UploadFolder[] = [
  'products',
  'avatars',
  'reviews',
  'categories',
  'banners',
  'logos',
];

/** `?folder=` comes straight from the query string — the `UploadFolder` type is compile-time only. */
function assertFolder(folder: string): UploadFolder {
  if (!ALLOWED_FOLDERS.includes(folder as UploadFolder))
    throw new BadRequestException('پوشه نامعتبر است');
  return folder as UploadFolder;
}

// Uploads are admin-only: customers never upload images anywhere in the storefront.
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder: UploadFolder = 'products',
  ): Promise<UploadResult> {
    return this.uploadService.uploadImage(file, assertFolder(folder));
  }

  @Post('images')
  @UseInterceptors(FilesInterceptor('files', 10, multerOptions))
  uploadImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Query('folder') folder: UploadFolder = 'products',
  ): Promise<UploadResult[]> {
    return this.uploadService.uploadImages(files, assertFolder(folder));
  }

  @Delete('*key')
  deleteFile(@Param('key') key: string): Promise<void> {
    return this.uploadService.deleteFile(key);
  }
}
