import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Popup, PopupSchema } from './entities/popup.schema';
import { PopupService } from './popup.service';
import { PopupController } from './popup.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Popup.name, schema: PopupSchema }]),
  ],
  controllers: [PopupController],
  providers: [PopupService],
  exports: [PopupService],
})
export class PopupModule {}
