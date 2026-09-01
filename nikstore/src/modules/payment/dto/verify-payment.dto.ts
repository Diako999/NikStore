import { IsString } from 'class-validator';

export class VerifyPaymentDto {
  @IsString()
  authority: string;

  @IsString()
  status: string;
}
