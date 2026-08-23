import {
  IsArray, IsBoolean, IsMongoId, IsNumber,
  IsOptional, IsString, Min, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class VariantAttributeDto {
  @IsOptional() @IsMongoId() _id?: string;
  @IsString() key: string;
  @IsString() value: string;
}

export class CreateVariantDto {
  @IsOptional() @IsMongoId()
  _id?: string;

  @IsOptional() @IsString()
  sku?: string;

  @IsNumber() @Min(0)
  price: number;

  @IsOptional() @IsNumber() @Min(0)
  comparePrice?: number;

  @IsOptional() @IsNumber() @Min(0)
  stock?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantAttributeDto)
  attributes?: VariantAttributeDto[];

  @IsOptional() @IsBoolean()
  isActive?: boolean;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  costPrice?: number | null;

  @IsOptional() @IsArray() @IsString({ each: true })
  images?: string[];
}
