import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { ProductModule } from '../product/product.module';
import { UserModule } from '../user/user.module';
import { DiscountsModule } from '../../discounts/discounts.module';

@Module({
  imports: [ProductModule, UserModule, DiscountsModule],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
