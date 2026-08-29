import {
  IsString,
  IsBoolean,
  IsOptional,
  IsNumber,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateColorDto {
  @IsString()
  @MaxLength(50)
  name: string;

  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'hex باید فرمت #RRGGBB داشته باشد' })
  hex: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}
