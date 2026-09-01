import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CategoryDocument = Category & Document;

@Schema({ timestamps: true })
export class Category {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ type: Types.ObjectId, ref: 'Category', default: null, index: true })
  parent: Types.ObjectId | null;

  // Full path of ancestor IDs — enables O(1) subtree fetch
  @Prop({ type: [Types.ObjectId], ref: 'Category', default: [] })
  ancestors: Types.ObjectId[];

  @Prop({ default: 0, index: true })
  depth: number;

  @Prop({ trim: true })
  description?: string;

  @Prop()
  icon?: string;

  @Prop()
  image?: string;

  @Prop({ default: 0 })
  sortOrder: number;

  @Prop({ enum: ['', 'men', 'women', 'kids', 'unisex'], default: '' })
  gender: string;

  @Prop({ default: true, index: true })
  isActive: boolean;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

CategorySchema.index({ parent: 1, sortOrder: 1 });
CategorySchema.index({ ancestors: 1 });
