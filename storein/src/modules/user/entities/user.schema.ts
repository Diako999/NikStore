import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Address, AddressSchema } from './address.schema';

export enum UserRole {
  USER      = 'user',
  MANAGER   = 'manager',
  ADMIN     = 'admin',
}

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, index: true })
  phone: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ trim: true }) firstName?: string;
  @Prop({ trim: true }) lastName?: string;
  @Prop({ trim: true, lowercase: true }) email?: string;
  @Prop() avatar?: string;
  @Prop({ default: false }) isAdmin: boolean;

  // select:false — never returned by default; use .select('+password') explicitly
  @Prop({ select: false })
  password?: string;

  @Prop({ enum: Object.values(UserRole), default: UserRole.USER })
  role: string;

  @Prop({ type: [String], default: [] })
  permissions: string[];

  @Prop({ type: [AddressSchema], default: [] })
  addresses: Address[];
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.virtual('fullName').get(function () {
  return [this.firstName, this.lastName].filter(Boolean).join(' ') || null;
});
