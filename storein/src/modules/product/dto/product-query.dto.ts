import { IsEnum, IsMongoId, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ProductStatus } from '../entities/product.schema';

export class ProductQueryDto {
  @IsOptional() @IsString()
  category?: string;

  @IsOptional() @IsMongoId()
  brand?: string;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  minPrice?: number;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  maxPrice?: number;

  @IsOptional() @Transform(({ value }) => value === 'true')
  inStock?: boolean;

  @IsOptional() @Transform(({ value }) => value === 'true')
  hasDiscount?: boolean;

  @IsOptional() @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional() @IsString()
  sort?: string;

  @IsOptional() @IsString()
  search?: string;

  // Comma-separated tag filters (stored in product.tags)
  @IsOptional() @IsString()
  gender?: string;

  @IsOptional() @IsString()
  frameShape?: string;

  @IsOptional() @IsString()
  frameMaterial?: string;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(1)
  page?: number = 1;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(1)
  limit?: number = 20;
}
