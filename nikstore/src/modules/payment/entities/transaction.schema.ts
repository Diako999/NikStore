import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TransactionDocument = Transaction & Document;

export enum TransactionType {
  CREDIT = 'credit',
  DEBIT = 'debit',
}

export enum TransactionStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
}

export enum PaymentMethod {
  WALLET = 'wallet',
  GATEWAY = 'gateway',
  MIXED = 'mixed',
}

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Order', default: null })
  orderId: Types.ObjectId | null;

  @Prop({ enum: TransactionType, required: true })
  type: TransactionType;

  @Prop({ required: true, min: 1 })
  amount: number;

  @Prop({ enum: TransactionStatus, default: TransactionStatus.PENDING })
  status: TransactionStatus;

  @Prop({ enum: PaymentMethod, required: true })
  method: PaymentMethod;

  @Prop({ required: true })
  description: string;

  @Prop() authority?: string;
  @Prop() gatewayUrl?: string;
  @Prop() refId?: string;

  @Prop({ default: 0 }) walletAmount: number;
  @Prop({ default: 0 }) gatewayAmount: number;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
TransactionSchema.index({ userId: 1, createdAt: -1 });
TransactionSchema.index({ authority: 1 }, { sparse: true });
