import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ReviewStatus } from '../entities/review.schema';

export class UpdateReviewStatusDto {
  @IsEnum([ReviewStatus.APPROVED, ReviewStatus.REJECTED])
  status: ReviewStatus.APPROVED | ReviewStatus.REJECTED;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  adminNote?: string;
}
