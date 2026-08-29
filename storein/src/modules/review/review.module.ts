import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';
import { Review, ReviewSchema } from './entities/review.schema';
import { ProductModule } from '../product/product.module';
import { OrderModule } from '../order/order.module';
import { UserModule } from '../user/user.module';
import { GatewayModule } from '../../common/gateway/gateway.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Review.name, schema: ReviewSchema }]),
    ProductModule,
    OrderModule,
    UserModule,
    GatewayModule,
  ],
  controllers: [ReviewController],
  providers: [ReviewService],
  exports: [ReviewService],
})
export class ReviewModule {}
