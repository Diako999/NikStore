import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { StorageProvider } from './storage/storage-provider.abstract';
import { LocalStorageProvider } from './storage/local-storage.provider';

@Module({
  controllers: [UploadController],
  providers: [
    UploadService,
    { provide: StorageProvider, useClass: LocalStorageProvider },
  ],
  exports: [UploadService],
})
export class UploadModule {}
