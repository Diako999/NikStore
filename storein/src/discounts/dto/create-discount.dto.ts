import {
  IsString, IsNotEmpty, IsEnum, IsNumber, IsOptional,
  IsDateString, IsArray, IsBoolean, Min, Matches, MaxLength,
  registerDecorator, ValidationOptions, ValidationArguments,
} from 'class-validator';
import { Type } from 'class-transformer';

export function IsAfterStartDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isAfterStartDate',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const obj = args.object as any;
          if (!obj.startDate || !value) return true;
          return new Date(value) > new Date(obj.startDate);
        },
        defaultMessage: () => 'endDate باید بعد از startDate باشد',
      },
    });
  };
}

export class CreateDiscountDto {
  // ── Core ─────────────────────────────────────────────────────
  @IsString() @IsNotEmpty() @MaxLength(200)
  title: string;

  @IsOptional() @IsString() @MaxLength(500)
  description?: string;

  @IsEnum(['percentage', 'fixed'])
  discountType: 'percentage' | 'fixed';

  @IsNumber() @Min(0) @Type(() => Number)
  value: number;

  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)
  maxDiscountAmount?: number;

  // ── Coupon (optional) ─────────────────────────────────────────
  // اگر code وجود داشت → کوپن؛ اگر null/undefined → auto-apply
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z0-9\-]{3,20}$/, {
    message: 'کد فقط شامل حروف انگلیسی بزرگ، اعداد و خط‌تیره باشد (۳ تا ۲۰ کاراکتر)',
  })
  code?: string;

  @IsOptional() @IsNumber() @Min(1) @Type(() => Number)
  perUserLimit?: number;

  // ── Time gate (optional) ─────────────────────────────────────
  @IsOptional() @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  @IsAfterStartDate({ message: 'endDate باید بعد از startDate باشد' })
  endDate?: string;

  // ── Target ───────────────────────────────────────────────────
  @IsEnum(['all', 'products', 'categories', 'brands', 'brand_category'])
  targetType: 'all' | 'products' | 'categories' | 'brands' | 'brand_category';

  @IsOptional() @IsArray() @IsString({ each: true })
  targetIds?: string[];

  @IsOptional() @IsArray() @IsString({ each: true })
  brandIds?: string[];

  // ── Conditions ───────────────────────────────────────────────
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)
  minOrderAmount?: number;

  @IsOptional() @IsNumber() @Min(1) @Type(() => Number)
  minQuantity?: number;

  @IsOptional() @IsNumber() @Min(1) @Type(() => Number)
  maxUsageCount?: number;

  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)
  priority?: number;

  @IsOptional() @IsBoolean()
  isActive?: boolean;
}
