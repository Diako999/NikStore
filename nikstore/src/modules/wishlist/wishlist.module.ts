import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WishlistController } from './wishlist.controller';
import { CompareController } from './compare.controller';
import { WishlistService } from './wishlist.service';
import { Wishlist, WishlistSchema } from './entities/wishlist.schema';
import { ProductModule } from '../product/product.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Wishlist.name, schema: WishlistSchema },
    ]),
    ProductModule,
  ],
  controllers: [WishlistController, CompareController],
  providers: [WishlistService],
  exports: [WishlistService],
})
export class WishlistModule {}
