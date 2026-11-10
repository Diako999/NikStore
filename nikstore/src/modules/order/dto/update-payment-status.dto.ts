import { IsEnum } from 'class-validator';
import { PaymentStatus } from '../entities/order.schema';

export class UpdatePaymentStatusDto {
  @IsEnum(PaymentStatus)
  paymentStatus: PaymentStatus;
}
