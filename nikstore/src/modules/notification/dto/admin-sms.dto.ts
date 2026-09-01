import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class AdminSmsDto {
  @IsOptional()
  @IsString()
  @Matches(/^(\+98|0)?9\d{9}$/, { message: 'شماره موبایل معتبر نیست' })
  phone?: string;

  @IsString()
  @MinLength(2, { message: 'متن پیامک حداقل ۲ کاراکتر است' })
  @MaxLength(500, { message: 'متن پیامک حداکثر ۵۰۰ کاراکتر است' })
  message: string;
}
