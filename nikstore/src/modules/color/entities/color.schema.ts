import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ColorDocument = Color & Document;

@Schema({ timestamps: true })
export class Color {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true, match: /^#[0-9A-Fa-f]{6}$/ })
  hex: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  sortOrder: number;
}

export const ColorSchema = SchemaFactory.createForClass(Color);
ColorSchema.index({ name: 1 }, { unique: true });
