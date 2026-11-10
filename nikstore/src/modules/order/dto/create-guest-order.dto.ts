import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class GuestOrderItemDto {
  @IsMongoId()
  productId: string;

  @IsString()
  @MaxLength(40)
  variantId: string;

  @IsInt()
  @Min(1)
  @Max(20)
  quantity: number;
}

export class GuestShippingDto {
  @IsString() @MaxLength(60) recipientName: string;

  @IsString()
  @Matches(/^(\+98|0)?9\d{9}$/, { message: 'شماره تلفن معتبر نیست' })
  recipientPhone: string;

  @IsString() @MaxLength(50) province: string;
  @IsString() @MaxLength(50) city: string;
  @IsString() @MaxLength(100) street: string;
  @IsString() @MaxLength(200) detail: string;

  @IsString()
  @Matches(/^\d{10}$/, { message: 'کد پستی باید ۱۰ رقم باشد' })
  postalCode: string;
}

/** Order placed without an account. Prices are always recomputed server-side. */
export class CreateGuestOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => GuestOrderItemDto)
  items: GuestOrderItemDto[];

  @ValidateNested()
  @Type(() => GuestShippingDto)
  shipping: GuestShippingDto;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}

export class GuestLookupDto {
  @IsMongoId()
  orderId: string;

  @IsString()
  @Matches(/^[a-f0-9]{48}$/, { message: 'کد پیگیری نامعتبر است' })
  token: string;
}
