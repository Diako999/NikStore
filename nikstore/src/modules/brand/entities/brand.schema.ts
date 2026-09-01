import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BrandDocument = Brand & Document;

@Schema({ timestamps: true })
export class Brand {
  @Prop({ required: true, trim: true, maxlength: 80 })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ trim: true })
  logo?: string;

  @Prop({ trim: true, maxlength: 300 })
  description?: string;

  @Prop({ default: true, index: true })
  isActive: boolean;

  @Prop({ default: 0, min: 0 })
  sortOrder: number;
}

export const BrandSchema = SchemaFactory.createForClass(Brand);
