import { IsNumber, IsString, Min } from 'class-validator';

export class UpdateCartItemDto {
  @IsString()
  variantId: string;

  @IsNumber()
  @Min(0)
  quantity: number;
}
