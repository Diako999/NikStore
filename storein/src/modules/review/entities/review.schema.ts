import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReviewDocument = Review & Document;

export enum ReviewStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Schema({ timestamps: true })
export class Review {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Product', required: true, index: true })
  productId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Order', default: null })
  orderId: Types.ObjectId | null;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop({ trim: true, minlength: 2, maxlength: 100, default: '' })
  title: string;

  @Prop({ required: true, trim: true, minlength: 20, maxlength: 1000 })
  body: string;

  @Prop({ type: [String], default: [] })
  pros: string[];

  @Prop({ type: [String], default: [] })
  cons: string[];

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ enum: ReviewStatus, default: ReviewStatus.PENDING, index: true })
  status: ReviewStatus;

  @Prop({ default: false })
  isVerifiedPurchase: boolean;

  @Prop({ default: 0, min: 0 })
  helpfulCount: number;

  @Prop()
  adminNote?: string;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

ReviewSchema.index({ userId: 1, productId: 1 }, { unique: true });
ReviewSchema.index({ productId: 1, status: 1, createdAt: -1 });
