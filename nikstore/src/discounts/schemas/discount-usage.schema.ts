import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DiscountUsageDocument = DiscountUsage & Document;

@Schema({ timestamps: true })
export class DiscountUsage {
  @Prop({ type: Types.ObjectId, ref: 'Discount', required: true, index: true })
  discountId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  // Set once the order exists (usage is claimed *before* the order is created).
  @Prop({ type: Types.ObjectId, ref: 'Order', default: null, index: true })
  orderId: Types.ObjectId | null;

  // 1-based use number for this (coupon, user). The unique index below makes two
  // concurrent redemptions pick the same number and collide, so a per-user limit
  // can't be beaten by parallel requests. Legacy rows without `seq` are ignored by it.
  @Prop()
  seq?: number;

  @Prop({ required: true, min: 0 })
  discountAmount: number;
}

export const DiscountUsageSchema = SchemaFactory.createForClass(DiscountUsage);
DiscountUsageSchema.index({ discountId: 1, userId: 1 });
DiscountUsageSchema.index(
  { discountId: 1, userId: 1, seq: 1 },
  { unique: true, partialFilterExpression: { seq: { $exists: true } } },
);
