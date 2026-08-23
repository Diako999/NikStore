import { IsMongoId, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateOrderDto {
  @IsMongoId()
  addressId: string;

  @IsOptional() @IsString() @MaxLength(300)
  note?: string;

  @IsOptional() @IsString() @MaxLength(30)
  couponCode?: string;
}
