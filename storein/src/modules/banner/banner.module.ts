import { Module } from '@nestjs/common';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { MongooseModule } from '@nestjs/mongoose';
import { BannerController } from './banner.controller';
import { BannerService } from './banner.service';
import { Banner, BannerSchema } from './entities/banner.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Banner.name, schema: BannerSchema }]),
  ],
  controllers: [BannerController],
  providers: [BannerService, AppLoggerService],
  exports: [BannerService],
})
export class BannerModule {}
