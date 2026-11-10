import {
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ProductStatus } from '../entities/product.schema';

export class ProductQueryDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsMongoId()
  brand?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  inStock?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  hasDiscount?: boolean;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  // Comma-separated product ids (max 50) — lets the storefront load a guest's favorites,
  // which only exist as ids in the browser.
  @IsOptional()
  @IsString()
  @Matches(/^[a-f0-9]{24}(,[a-f0-9]{24}){0,49}$/i, {
    message: 'ids باید فهرستی از حداکثر ۵۰ شناسه معتبر باشد',
  })
  ids?: string;

  @IsOptional()
  @IsString()
  sort?: string;

  @IsOptional()
  @IsString()
  search?: string;

  // Comma-separated tag filters (stored in product.tags)
  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;
}
