import { IsOptional, IsString, MinLength, MaxLength } from 'class-validator';

export class ChangePasswordDto {
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'رمز عبور فعلی حداقل ۶ کاراکتر است' })
  @MaxLength(72, { message: 'رمز عبور فعلی حداکثر ۷۲ کاراکتر است' })
  currentPassword?: string;

  @IsString()
  @MinLength(8, { message: 'رمز عبور جدید حداقل ۸ کاراکتر است' })
  @MaxLength(72, { message: 'رمز عبور جدید حداکثر ۷۲ کاراکتر است' })
  newPassword: string;
}
