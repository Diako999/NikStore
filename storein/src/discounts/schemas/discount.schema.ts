import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DiscountDocument = Discount & Document;

@Schema({ timestamps: true })
export class Discount {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ trim: true })
  description?: string;

  // ── deprecated: نگه داشته‌شده برای backward compat با داده‌های قدیمی ──
  @Prop({ type: String, default: null, enum: ['time_limited', null] })
  kind?: string | null;

  @Prop({ required: true, enum: ['percentage', 'fixed'] })
  discountType: 'percentage' | 'fixed';

  @Prop({ required: true, min: 0 })
  value: number;

  @Prop({ type: Number, default: null })
  maxDiscountAmount: number | null;

  // ── Coupon (optional) ────────────────────────────────────────
  // null = auto-apply; string = user must enter at checkout
  @Prop({
    type: String,
    uppercase: true,
    trim: true,
    sparse: true,
    default: null,
  })
  code?: string | null;

  @Prop({ type: Number, default: 1, min: 1 })
  perUserLimit: number;

  // ── Time gate (optional) ─────────────────────────────────────
  @Prop({ type: Date, default: null })
  startDate: Date | null;

  @Prop({ type: Date, default: null })
  endDate: Date | null;

  // ── Target ───────────────────────────────────────────────────
  @Prop({
    required: true,
    enum: ['all', 'products', 'categories', 'brands', 'brand_category'],
  })
  targetType: 'all' | 'products' | 'categories' | 'brands' | 'brand_category';

  @Prop({ type: [{ type: Types.ObjectId }], default: [] })
  targetIds: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId }], default: [] })
  brandIds: Types.ObjectId[];

  // ── Conditions ───────────────────────────────────────────────
  @Prop({ type: Number, default: null })
  minOrderAmount: number | null;

  @Prop({ type: Number, default: null })
  minQuantity: number | null;

  @Prop({ type: Number, default: null })
  maxUsageCount: number | null;

  @Prop({ default: 0 })
  usageCount: number;

  // ── Meta ─────────────────────────────────────────────────────
  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  priority: number;
}

export const DiscountSchema = SchemaFactory.createForClass(Discount);

DiscountSchema.index({ isActive: 1, startDate: 1, endDate: 1 });
DiscountSchema.index({ targetType: 1, targetIds: 1 });
DiscountSchema.index({ code: 1 }, { sparse: true, unique: true });
DiscountSchema.index({ isActive: 1, code: 1 });
