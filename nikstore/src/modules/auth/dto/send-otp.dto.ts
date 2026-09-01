import { IsString, Matches } from 'class-validator';

export class SendOtpDto {
  @IsString()
  @Matches(/^(\+98|0)?9\d{9}$/, { message: 'شماره موبایل معتبر نیست' })
  phone: string;
}
