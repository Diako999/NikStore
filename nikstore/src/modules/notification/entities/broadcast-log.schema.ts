import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { NotificationType } from './notification.schema';

export type BroadcastLogDocument = BroadcastLog & Document;

@Schema({ timestamps: true, collection: 'broadcast_logs' })
export class BroadcastLog {
  @Prop({ type: String, enum: NotificationType, required: true, index: true })
  type: NotificationType;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  body: string;

  @Prop({ enum: ['all', 'single'], required: true })
  target: 'all' | 'single';

  @Prop({ type: String, default: null })
  targetUserId: string | null;

  @Prop({ default: 0 })
  sent: number;
}

export const BroadcastLogSchema = SchemaFactory.createForClass(BroadcastLog);
BroadcastLogSchema.index({ createdAt: -1 });
