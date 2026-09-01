import {
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

const multerOptions = {
  storage: memoryStorage(),
};

@UseGuards(JwtAuthGuard)
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder: UploadFolder = 'products',
  ): Promise<UploadResult> {
    return this.uploadService.uploadImage(file, folder);
  }

  @Post('images')
  @UseInterceptors(FilesInterceptor('files', 10, multerOptions))
  uploadImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Query('folder') folder: UploadFolder = 'products',
  ): Promise<UploadResult[]> {
    return this.uploadService.uploadImages(files, folder);
  }

  @UseGuards(AdminGuard)
  @Delete('*key')
  deleteFile(@Param('key') key: string): Promise<void> {
    return this.uploadService.deleteFile(key);
  }
}
