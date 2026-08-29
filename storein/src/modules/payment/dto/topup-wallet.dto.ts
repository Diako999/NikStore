import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class TopupWalletDto {
  @IsNumber()
  @Min(10_000)
  amount: number;

  @IsOptional()
  @IsString()
  callbackUrl?: string;
}
