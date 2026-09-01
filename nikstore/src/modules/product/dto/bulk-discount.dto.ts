import {
  IsArray,
  IsDateString,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { IsEndDateAfterStartDate } from '../../../discounts/validators/date-range.validator';

export class BulkDiscountDto {
  @IsArray()
  @IsMongoId({ each: true })
  productIds: string[];

  @IsNumber()
  @Min(0)
  @Max(90)
  discountPct: number;

  // ── Timed-mode fields (all optional; when startDate+endDate provided, a TimeDiscount is created) ──

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  @ValidateIf((o: BulkDiscountDto) => !!o.startDate)
  @IsEndDateAfterStartDate('startDate', {
    message: 'تاریخ پایان باید بعد از تاریخ شروع باشد',
  })
  endDate?: string;
}
