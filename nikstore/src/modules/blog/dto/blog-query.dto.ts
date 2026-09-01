import { IsOptional, IsEnum, IsString, IsNumberString } from 'class-validator';
import { BlogStatus } from '../entities/blog.schema';

export class BlogQueryDto {
  @IsOptional() @IsNumberString() page?: string;
  @IsOptional() @IsNumberString() limit?: string;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsEnum(BlogStatus) status?: BlogStatus;
  @IsOptional() @IsString() tag?: string;
  @IsOptional() @IsEnum(['newest', 'oldest', 'popular']) sortBy?: string;
}
