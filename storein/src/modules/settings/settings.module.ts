import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import {
  SiteSettings,
  SiteSettingsSchema,
} from './entities/site-settings.schema';
import { AppLoggerService } from '../../common/logger/app-logger.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SiteSettings.name, schema: SiteSettingsSchema },
    ]),
  ],
  controllers: [SettingsController],
  providers: [SettingsService, AppLoggerService],
  exports: [SettingsService],
})
export class SettingsModule {}
