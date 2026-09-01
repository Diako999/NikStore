import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DiscountUsageDocument = DiscountUsage & Document;

@Schema({ timestamps: true })
export class DiscountUsage {
  @Prop({ type: Types.ObjectId, ref: 'Discount', required: true, index: true })
  discountId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  orderId: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  discountAmount: number;
}

export const DiscountUsageSchema = SchemaFactory.createForClass(DiscountUsage);
DiscountUsageSchema.index({ discountId: 1, userId: 1 });
