import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsIn,
  MaxLength,
} from 'class-validator';

export class CreateBannerDto {
  @IsString()
  @MaxLength(120)
  title: string;

  @IsOptional() @IsString() @MaxLength(80) eyebrow?: string;
  @IsOptional() @IsString() @MaxLength(200) subtitle?: string;
  @IsOptional() @IsString() @MaxLength(40) cta?: string;
  @IsOptional() @IsString() @MaxLength(200) ctaLink?: string;

  @IsOptional() @IsString() @MaxLength(7) bgFrom?: string;
  @IsOptional() @IsString() @MaxLength(7) bgTo?: string;
  @IsOptional() @IsString() @MaxLength(7) accent?: string;

  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsString() mobileImageUrl?: string;

  @IsOptional() @IsIn(['sale', 'new', 'season', 'none']) badgeType?: string;
  @IsOptional() @IsIn(['hero', 'promo']) type?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsNumber() sortOrder?: number;
}
