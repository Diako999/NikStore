import { IsMongoId, IsNumber, IsString, Min } from 'class-validator';

export class AddToCartDto {
  @IsMongoId()
  productId: string;

  @IsString()
  variantId: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}
