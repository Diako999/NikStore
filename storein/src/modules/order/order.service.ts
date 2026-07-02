import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Order, OrderDocument, OrderStatus,
  ORDER_TRANSITIONS,
} from './entities/order.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CartService } from '../cart/cart.service';
import { ProductService } from '../product/product.service';
import {
  EVENTS,
  OrderStatusChangedEvent,
} from '../notification/notification.listener';
import type { UserDocument } from '../user/entities/user.schema';
import { User } from '../user/entities/user.schema';
import { AppLoggerService }      from '../../common/logger/app-logger.service';
import { NotificationsGateway }  from '../../common/gateway/notifications.gateway';
import { DiscountsService }      from '../../discounts/discounts.service';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(User.name)  private userModel: Model<UserDocument>,
    private cartService: CartService,
    private productService: ProductService,
    private eventEmitter: EventEmitter2,
    private readonly logger: AppLoggerService,
    private readonly gateway: NotificationsGateway,
    private readonly discountsService: DiscountsService,
  ) {
    this.logger.setContext('OrderService');
  }

  async createFromCart(userId: string, dto: CreateOrderDto): Promise<OrderDocument> {
    const cart = await this.cartService.getRawCart(userId);
    if (!cart.items.length)
      throw new BadRequestException('سبد خرید خالی است');

    const isWholesaleOrder = dto.orderType === 'wholesale';
    const itemsToOrder = isWholesaleOrder
      ? cart.items.filter(i => (i as any).isWholesalePrice)
      : cart.items.filter(i => !(i as any).isWholesalePrice);

    if (!itemsToOrder.length)
      throw new BadRequestException('هیچ آیتم مناسبی برای این نوع سفارش یافت نشد');

    const user = await this.userModel
      .findById(userId)
      .select('addresses firstName lastName phone role')
      .lean<UserDocument>();
    if (!user) throw new NotFoundException('کاربر یافت نشد');

    const address = user.addresses.find(
      (a) => a._id.toString() === dto.addressId,
    );
    if (!address) throw new NotFoundException('آدرس یافت نشد');

    // Batch fetch all products in one query (eliminates N+1)
    const productIds = [...new Set(cart.items.map(i => new Types.ObjectId(i.productId)))];
    const products   = await this.productService.findManyByIds(productIds.map(id => id.toString()));
    const productMap = new Map(products.map(p => [(p._id as Types.ObjectId).toString(), p]));

    // Full stock validation pass before any write
    for (const item of itemsToOrder) {
      const product = productMap.get(item.productId);
      if (!product) throw new BadRequestException(`محصول "${item.name}" یافت نشد`);
      const variant  = product.variants.find(
        (v: any) => v._id.toString() === item.variantId,
      );
      if (!variant?.isActive) {
        this.logger.warn('Order blocked: variant inactive', {
          userId, productId: item.productId, variantId: item.variantId, name: item.name,
        });
        throw new BadRequestException(`ویریانت "${item.name}" موجود نیست`);
      }
      if (variant.stock < item.quantity) {
        this.logger.warn('Order blocked: insufficient stock', {
          userId, productId: item.productId, variantId: item.variantId,
          name: item.name, requested: item.quantity, available: variant.stock,
        });
        throw new BadRequestException(
          `موجودی "${item.name}" کافی نیست. موجود: ${variant.stock}`,
        );
      }
    }

    const subtotal = itemsToOrder.reduce((s, i) => s + i.price * i.quantity, 0);

    let discount   = 0;
    let couponCode: string | undefined;
    let couponId:   string | undefined;

    if (dto.couponCode) {
      const result = await this.discountsService.validateCoupon(
        userId,
        dto.couponCode,
        subtotal,
      );
      if (!result.isValid) {
        throw new BadRequestException(result.message);
      }
      discount   = result.discountAmount;
      couponCode = dto.couponCode.toUpperCase().trim();
      couponId   = result.discountId;
    }

    const total = Math.max(0, subtotal - discount);

    const isWholesaleUser = (user as any).role === 'wholesale';

    const order = await this.orderModel.create({
      userId:      new Types.ObjectId(userId),
      isWholesale: isWholesaleUser,
      orderType:   dto.orderType ?? 'retail',
      orderNumber: this.genOrderNumber(),
      items: itemsToOrder.map((i) => ({
        productId:    new Types.ObjectId(i.productId),
        variantId:    i.variantId,
        sku:          i.sku,
        name:         i.name,
        thumbnail:    i.thumbnail ?? '',
        price:        i.price,
        comparePrice: i.comparePrice ?? null,
        quantity:     i.quantity,
        attributes:   i.attributes ?? [],
      })),
      shippingAddress: {
        recipientName:  address.recipientName,
        recipientPhone: address.recipientPhone,
        province:       address.province,
        city:           address.city,
        street:         address.street,
        detail:         address.detail,
        postalCode:     address.postalCode,
      },
      subtotal,
      discount,
      total,
      couponCode,
      note: dto.note,
    });

    await this.productService.bulkAdjustStock(
      itemsToOrder.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        delta: -item.quantity,
      })),
    );
    await this.cartService.clearCart(userId);

    if (couponId) {
      await this.discountsService.recordCouponUsage(
        couponId,
        userId,
        (order._id as any).toString(),
        discount,
      );
    }

    this.logger.log('Order created', {
      orderId:     (order._id as any).toString(),
      orderNumber: order.orderNumber,
      userId,
      total,
      itemCount:   itemsToOrder.length,
    });

    const customerName =
      `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() ||
      (user.phone ?? '').slice(0, -4) + '****';

    const orderPayload = {
      orderId:      (order._id as any).toString(),
      orderNumber:  order.orderNumber,
      total:        order.total,
      customerName,
      createdAt:    (order as any).createdAt?.toISOString() ?? new Date().toISOString(),
    };

    this.gateway.emitNewOrder(orderPayload);
    if (isWholesaleUser) {
      this.gateway.emitNewWholesaleOrder(orderPayload);
    }

    return order.toObject();
  }

  async findMyOrders(userId: string, page = 1, limit = 10, status?: OrderStatus) {
    const filter: Record<string, any> = { userId: new Types.ObjectId(userId) };
    if (status) filter.status = status;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      this.orderModel
        .find(filter)
        .select('-__v')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<OrderDocument[]>(),
      this.orderModel.countDocuments(filter),
    ]);

    return { orders, total, page, totalPages: Math.ceil(total / limit) };
  }

  async findMyOrderById(userId: string, orderId: string): Promise<OrderDocument> {
    this.assertId(orderId);
    const order = await this.orderModel
      .findOne({ _id: orderId, userId: new Types.ObjectId(userId) })
      .select('-__v')
      .lean<OrderDocument>();
    if (!order) throw new NotFoundException('سفارش یافت نشد');
    return order;
  }

  async cancelMyOrder(userId: string, orderId: string): Promise<OrderDocument> {
    this.assertId(orderId);
    const order = await this.orderModel.findOne({
      _id: orderId, userId: new Types.ObjectId(userId),
    });
    if (!order) throw new NotFoundException('سفارش یافت نشد');

    this.assertTransition(order.status, OrderStatus.CANCELLED);

    await this.productService.bulkAdjustStock(
      order.items.map((item) => ({
        productId: item.productId.toString(),
        variantId: item.variantId,
        delta: item.quantity,
      })),
    );

    const previousStatus = order.status;
    order.status         = OrderStatus.CANCELLED;
    order.cancelReason   = 'لغو توسط خریدار';
    await order.save();

    this.logger.log('Order cancelled by user', {
      orderId:        (order._id as any).toString(),
      orderNumber:    order.orderNumber,
      userId,
      previousStatus,
    });

    const userForEvent = await this.userModel
      .findById(order.userId).select('phone').lean<UserDocument>();
    if (userForEvent) {
      const event: OrderStatusChangedEvent = {
        orderId:        (order._id as any).toString(),
        orderNumber:    order.orderNumber,
        userId:         order.userId.toString(),
        phone:          (userForEvent as any).phone,
        status:         order.status,
        previousStatus: previousStatus,
      };
      this.eventEmitter.emit(EVENTS.ORDER_STATUS_CHANGED, event);
    }

    return order.toObject();
  }

  async adminFindAll(
    page  = 1,
    limit = 20,
    filters: {
      status?:    OrderStatus;
      search?:    string;
      startDate?: string;
      endDate?:   string;
    } = {},
  ) {
    const filter: Record<string, any> = {};

    if (filters.status)    filter.status = filters.status;
    if (filters.startDate || filters.endDate) {
      filter.createdAt = {};
      if (filters.startDate) filter.createdAt.$gte = new Date(filters.startDate);
      if (filters.endDate)   filter.createdAt.$lte = new Date(filters.endDate + 'T23:59:59');
    }
    if (filters.search) {
      const s = filters.search.trim();
      filter.$or = [
        { orderNumber: { $regex: s, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    let query = this.orderModel
      .find(filter)
      .select('-__v')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'phone firstName lastName');

    // When searching by phone we need to match populated user — do a two-step query
    if (filters.search && /^[\d\+]/.test(filters.search.trim())) {
      const matchedUsers = await this.userModel
        .find({ phone: { $regex: filters.search.trim(), $options: 'i' } })
        .select('_id')
        .lean<{ _id: Types.ObjectId }[]>();
      if (matchedUsers.length) {
        const userIds = matchedUsers.map(u => u._id);
        filter.$or = [
          ...(filter.$or ?? []),
          { userId: { $in: userIds } },
        ];
        query = this.orderModel
          .find(filter)
          .select('-__v')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('userId', 'phone firstName lastName');
      }
    }

    const [orders, total] = await Promise.all([
      query.lean<OrderDocument[]>(),
      this.orderModel.countDocuments(filter),
    ]);

    return { items: orders, total, page, totalPages: Math.ceil(total / limit) };
  }

  async adminFindById(orderId: string): Promise<OrderDocument> {
    this.assertId(orderId);
    const order = await this.orderModel
      .findById(orderId)
      .select('-__v')
      .populate('userId', 'phone firstName lastName')
      .lean<OrderDocument>();
    if (!order) throw new NotFoundException('سفارش یافت نشد');
    return order;
  }

  async updateStatus(orderId: string, dto: UpdateOrderStatusDto): Promise<OrderDocument> {
    this.assertId(orderId);
    const order = await this.orderModel.findById(orderId);
    if (!order) throw new NotFoundException('سفارش یافت نشد');

    this.assertTransition(order.status, dto.status);

    if (dto.status === OrderStatus.CANCELLED) {
      await this.productService.bulkAdjustStock(
        order.items.map((item) => ({
          productId: item.productId.toString(),
          variantId: item.variantId,
          delta: item.quantity,
        })),
      );
      if (dto.cancelReason) order.cancelReason = dto.cancelReason;
    }

    const previousStatus = order.status;
    order.status         = dto.status;
    await order.save();

    this.logger.log('Order status updated by admin', {
      orderId:        (order._id as any).toString(),
      orderNumber:    order.orderNumber,
      previousStatus,
      newStatus:      dto.status,
    });

    const userForEvent = await this.userModel
      .findById(order.userId).select('phone').lean<UserDocument>();
    if (userForEvent) {
      const event: OrderStatusChangedEvent = {
        orderId:        (order._id as any).toString(),
        orderNumber:    order.orderNumber,
        userId:         order.userId.toString(),
        phone:          (userForEvent as any).phone,
        status:         order.status,
        previousStatus: previousStatus,
      };
      this.eventEmitter.emit(EVENTS.ORDER_STATUS_CHANGED, event);
    }

    return order.toObject();
  }

  private genOrderNumber(): string {
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${Date.now()}-${rand}`;
  }

  private assertId(id: string): void {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('شناسه معتبر نیست');
  }

  private assertTransition(current: OrderStatus, next: OrderStatus): void {
    if (!ORDER_TRANSITIONS[current].includes(next))
      throw new BadRequestException(
        `تغییر از "${current}" به "${next}" مجاز نیست`,
      );
  }
}
