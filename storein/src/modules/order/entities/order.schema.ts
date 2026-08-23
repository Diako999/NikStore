import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OrderDocument = Order & Document;

export enum OrderStatus {
  PENDING    = 'pending',
  CONFIRMED  = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED    = 'shipped',
  DELIVERED  = 'delivered',
  CANCELLED  = 'cancelled',
}

export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]:    [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]:  [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]:    [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]:  [],
  [OrderStatus.CANCELLED]:  [],
};

@Schema({ _id: false })
class OrderItemAttribute {
  @Prop() key: string;
  @Prop() value: string;
}
const OrderItemAttributeSchema = SchemaFactory.createForClass(OrderItemAttribute);

@Schema({ _id: false })
class OrderItem {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Product' })
  productId: Types.ObjectId;

  @Prop({ required: true }) variantId: string;
  @Prop({ default: '' })    sku: string;
  @Prop({ required: true }) name: string;
  @Prop()                   thumbnail: string;

  @Prop({ required: true })                     price: number;
  @Prop({ default: null, type: Number })        comparePrice: number | null;
  @Prop({ required: true, min: 1 })             quantity: number;

  @Prop({ type: [OrderItemAttributeSchema], default: [] })
  attributes: OrderItemAttribute[];
}
const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({ _id: false })
class ShippingAddress {
  @Prop({ required: true }) recipientName: string;
  @Prop({ required: true }) recipientPhone: string;
  @Prop({ required: true }) province: string;
  @Prop({ required: true }) city: string;
  @Prop({ required: true }) street: string;
  @Prop({ required: true }) detail: string;
  @Prop({ required: true }) postalCode: string;
}
const ShippingAddressSchema = SchemaFactory.createForClass(ShippingAddress);

@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, unique: true })
  orderNumber: string;

  @Prop({ type: [OrderItemSchema], required: true })
  items: OrderItem[];

  @Prop({ type: ShippingAddressSchema, required: true })
  shippingAddress: ShippingAddress;

  @Prop({ required: true, min: 0 }) subtotal: number;
  @Prop({ default: 0 })             discount: number;
  @Prop({ required: true, min: 0 }) total: number;

  @Prop({ enum: OrderStatus, default: OrderStatus.PENDING, index: true })
  status: OrderStatus;

  @Prop() cancelReason?: string;
  @Prop() note?: string;
  @Prop() couponCode?: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
OrderSchema.index({ userId: 1, createdAt: -1 });
