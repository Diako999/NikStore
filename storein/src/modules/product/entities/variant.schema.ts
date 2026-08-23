import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type VariantDocument = Variant & Document;

@Schema({ _id: true, timestamps: false })
export class VariantAttribute {
  @Prop({ required: true }) key: string;
  @Prop({ required: true }) value: string;
}
export const VariantAttributeSchema = SchemaFactory.createForClass(VariantAttribute);

@Schema({ _id: true, timestamps: false })
export class Variant {
  _id: Types.ObjectId;

  @Prop({ trim: true, default: '' })
  sku: string;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ type: Number, min: 0, default: null })
  comparePrice: number | null;

  @Prop({ required: true, min: 0, default: 0 })
  stock: number;

  @Prop({ type: [VariantAttributeSchema], default: [] })
  attributes: VariantAttribute[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Number, min: 0, default: null })
  costPrice: number | null;

  @Prop({ type: [String], default: [] })
  images: string[];
}

export const VariantSchema = SchemaFactory.createForClass(Variant);
