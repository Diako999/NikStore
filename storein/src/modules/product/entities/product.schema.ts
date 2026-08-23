import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Variant, VariantSchema } from './variant.schema';

export type ProductDocument = Product & Document;

export enum ProductStatus {
  DRAFT    = 'draft',
  ACTIVE   = 'active',
  INACTIVE = 'inactive',
}

@Schema({ _id: false })
class SpecAttribute {
  @Prop({ required: true }) key: string;
  @Prop({ required: true }) value: string;
  @Prop() unit?: string;
}
const SpecAttributeSchema = SchemaFactory.createForClass(SpecAttribute);

@Schema({ _id: false })
class Dimensions {
  @Prop() length?: number;
  @Prop() width?: number;
  @Prop() height?: number;
}
const DimensionsSchema = SchemaFactory.createForClass(Dimensions);

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Category', index: true })
  category: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Brand', index: true })
  brand?: Types.ObjectId;

  @Prop({ trim: true })
  shortDescription?: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop()
  thumbnail?: string;

  @Prop({ type: [SpecAttributeSchema], default: [] })
  specs: SpecAttribute[];

  @Prop({ type: [VariantSchema], default: [] })
  variants: Variant[];

  @Prop({ default: 0, index: true })
  minPrice: number;

  @Prop({ default: 0 })
  maxPrice: number;

  @Prop({ default: 0, index: true })
  totalStock: number;

  @Prop({ default: 0 })
  maxComparePrice: number;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ default: 0, min: 0 })
  weight: number;

  @Prop({ type: DimensionsSchema })
  dimensions?: Dimensions;

  @Prop({ enum: ProductStatus, default: ProductStatus.DRAFT, index: true })
  status: ProductStatus;

  @Prop({ default: 0 })
  viewCount: number;

  @Prop({ default: 0 })
  soldCount: number;

  @Prop({ default: 0, min: 0, max: 5 })
  avgRating: number;

  @Prop({ default: 0, min: 0 })
  reviewCount: number;

  @Prop({ trim: true, maxlength: 70 })
  metaTitle?: string;

  @Prop({ trim: true, maxlength: 160 })
  metaDescription?: string;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.index(
  { name: 'text', description: 'text', tags: 'text', shortDescription: 'text' },
  {
    default_language: 'none',
    weights: { name: 10, tags: 5, shortDescription: 3, description: 1 },
    name: 'product_text_search',
  }
);
ProductSchema.index({ category: 1, status: 1, minPrice: 1 });
ProductSchema.index({ status: 1, totalStock: 1 });
ProductSchema.index({ status: 1, maxComparePrice: -1, minPrice: 1 });
