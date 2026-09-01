import { IsNumber, IsString, Min, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class ValidateDiscountDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  cartTotal: number;
}
