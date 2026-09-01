import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SmsLogDocument = SmsLog & Document;

@Schema({ timestamps: true, collection: 'sms_logs' })
export class SmsLog {
  @Prop({ enum: ['all', 'single'], required: true })
  target: 'all' | 'single';

  @Prop({ type: String, default: null })
  phone: string | null;

  @Prop({ required: true })
  message: string;

  @Prop({ default: 0 })
  sent: number;

  @Prop({ default: 0 })
  failed: number;
}

export const SmsLogSchema = SchemaFactory.createForClass(SmsLog);
SmsLogSchema.index({ createdAt: -1 });
