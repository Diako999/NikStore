import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Page, PageSchema } from './entities/page.schema';
import { PageService } from './page.service';
import { PageController } from './page.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Page.name, schema: PageSchema }]),
  ],
  providers: [PageService],
  controllers: [PageController],
  exports: [PageService],
})
export class PageModule {}
