import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BannerDocument = Banner & Document;

@Schema({ timestamps: true })
export class Banner {
  _id: Types.ObjectId;

  @Prop({ required: true, maxlength: 120 }) title: string;
  @Prop({ default: '' }) eyebrow: string;
  @Prop({ default: '' }) subtitle: string;
  @Prop({ default: 'مشاهده محصولات' }) cta: string;
  @Prop({ default: '/' }) ctaLink: string;

  @Prop({ default: '#0F3D73' }) bgFrom: string;
  @Prop({ default: '#1B4F8A' }) bgTo: string;
  @Prop({ default: '#FFD700' }) accent: string;

  // optional full-width background image (overrides gradient when set)
  @Prop({ default: '' }) imageUrl: string;
  // separate crop for mobile (≤767 px); falls back to imageUrl when empty
  @Prop({ default: '' }) mobileImageUrl: string;

  @Prop({ enum: ['sun', 'rx', 'lens', 'none'], default: 'sun' })
  glasses: string;

  // 'hero' = main hero slider  |  'promo' = two-column promotional cards
  @Prop({ enum: ['hero', 'promo'], default: 'hero' }) type: string;

  @Prop({ default: true }) isActive: boolean;
  @Prop({ default: 0 }) sortOrder: number;
}

export const BannerSchema = SchemaFactory.createForClass(Banner);
BannerSchema.index({ isActive: 1, type: 1, sortOrder: 1 });
