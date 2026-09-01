import { IsString, Matches, MinLength, MaxLength } from 'class-validator';

export class AdminSetupDto {
  @IsString()
  @Matches(/^(\+98|0)?9\d{9}$/, { message: 'شماره موبایل معتبر نیست' })
  phone: string;

  @IsString()
  @MinLength(6, { message: 'رمز عبور حداقل ۶ کاراکتر است' })
  @MaxLength(72, { message: 'رمز عبور حداکثر ۷۲ کاراکتر است' })
  password: string;

  @IsString()
  secret: string;
}
