import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateAddressDto {
  @IsString() @MaxLength(30) title: string;
  @IsString() @MaxLength(50) province: string;
  @IsString() @MaxLength(50) city: string;
  @IsString() @MaxLength(100) street: string;
  @IsString() @MaxLength(200) detail: string;

  @IsString()
  @Matches(/^\d{10}$/, { message: 'کد پستی باید ۱۰ رقم باشد' })
  postalCode: string;

  @IsString() @MaxLength(60) recipientName: string;

  @IsString()
  @Matches(/^(\+98|0)?9\d{9}$/, { message: 'شماره تلفن معتبر نیست' })
  recipientPhone: string;

  @IsOptional() @IsBoolean() isDefault?: boolean;
}
