import { IsString, Matches, Length } from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  @Matches(/^(\+98|0)?9\d{9}$/, { message: 'شماره موبایل معتبر نیست' })
  phone: string;

  @IsString()
  @Length(6, 6, { message: 'کد تایید باید ۶ رقم باشد' })
  code: string;
}
