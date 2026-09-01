import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PopupDocument = Popup & Document;

@Schema({ timestamps: true })
export class Popup {
  _id: Types.ObjectId;

  @Prop({ default: '' })
  title: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ default: '' })
  imageUrl: string;

  @Prop({ default: '' })
  buttonText: string;

  @Prop({ default: '' })
  buttonLink: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 2, min: 0, max: 30 })
  showDelay: number;

  @Prop({ enum: ['session', 'day', 'week', 'always'], default: 'day' })
  showOncePer: string;

  @Prop({ default: 0 })
  sortOrder: number;
}

export const PopupSchema = SchemaFactory.createForClass(Popup);
