import { IsEnum, IsMongoId, IsNumber, IsOptional, Min } from 'class-validator';
import { PaymentMethod } from '../entities/transaction.schema';

export class PayOrderDto {
  @IsMongoId()
  orderId: string;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsOptional()
  @IsNumber()
  @Min(1)
  walletAmount?: number;

  @IsOptional()
  callbackUrl?: string;
}
