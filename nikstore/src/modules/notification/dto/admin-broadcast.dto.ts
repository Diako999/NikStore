import {
  IsEnum,
  IsMongoId,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { NotificationType } from '../entities/notification.schema';

export class AdminBroadcastDto {
  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  @MaxLength(100)
  title: string;

  @IsString()
  @MaxLength(500)
  body: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @IsOptional()
  @IsMongoId()
  targetUserId?: string;
}
