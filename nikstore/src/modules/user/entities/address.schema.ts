import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AddressDocument = Address & Document;

@Schema({ _id: true, timestamps: false })
export class Address {
  _id: Types.ObjectId;

  @Prop({ required: true }) title: string;
  @Prop({ required: true }) province: string;
  @Prop({ required: true }) city: string;
  @Prop({ required: true }) street: string;
  @Prop({ required: true }) detail: string;
  @Prop({ required: true }) postalCode: string;
  @Prop({ required: true }) recipientName: string;
  @Prop({ required: true }) recipientPhone: string;
  @Prop({ default: false }) isDefault: boolean;
}

export const AddressSchema = SchemaFactory.createForClass(Address);
