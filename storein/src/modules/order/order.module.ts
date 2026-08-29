import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { Order, OrderSchema } from './entities/order.schema';
import { CartModule } from '../cart/cart.module';
import { ProductModule } from '../product/product.module';
import { UserModule } from '../user/user.module';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { GatewayModule } from '../../common/gateway/gateway.module';
import { DiscountsModule } from '../../discounts/discounts.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    CartModule,
    ProductModule,
    UserModule,
    GatewayModule,
    DiscountsModule,
  ],
  controllers: [OrderController],
  providers: [OrderService, AppLoggerService],
  exports: [OrderService, MongooseModule],
})
export class OrderModule {}
