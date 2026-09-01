import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { Wallet, WalletSchema } from './entities/wallet.schema';
import { Transaction, TransactionSchema } from './entities/transaction.schema';
import { PaymentGateway } from './gateway/payment-gateway.abstract';
import { MockPaymentGateway } from './gateway/mock-payment-gateway.service';
import { ZarinpalGateway } from './gateway/zarinpal-gateway.service';
import { DynamicGateway } from './gateway/dynamic-gateway.service';
import { OrderModule } from '../order/order.module';
import { SettingsModule } from '../settings/settings.module';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { User, UserSchema } from '../user/entities/user.schema';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: Wallet.name, schema: WalletSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: User.name, schema: UserSchema },
    ]),
    OrderModule,
    SettingsModule,
  ],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    AppLoggerService,
    MockPaymentGateway,
    ZarinpalGateway,
    DynamicGateway,
    { provide: PaymentGateway, useExisting: DynamicGateway },
  ],
  exports: [PaymentService],
})
export class PaymentModule {}
