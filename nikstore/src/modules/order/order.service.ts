import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Order,
  OrderDocument,
  OrderStatus,
  ORDER_TRANSITIONS,
  PaymentStatus,
} from './entities/order.schema';
import { escapeRegex } from '../../common/utils/escape-regex';
import { clampPagination } from '../../common/utils/pagination';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CreateGuestOrderDto } from './dto/create-guest-order.dto';
import { CartItem } from '../cart/cart.interface';
import { createHash, randomBytes } from 'crypto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CartService } from '../cart/cart.service';
import { ProductService } from '../product/product.service';
import {
  EVENTS,
  OrderStatusChangedEvent,
} from '../notification/notification.listener';
import type { UserDocument } from '../user/entities/user.schema';
import { User } from '../user/entities/user.schema';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { NotificationsGateway } from '../../common/gateway/notifications.gateway';
import { DiscountsService } from '../../discounts/discounts.service';

interface ShippingAddressInput {
  recipientName: string;
  recipientPhone: string;
  province: string;
  city: string;
  street: string;
  detail: string;
  postalCode: string;
}

/** `@Schema({ timestamps: true })` adds these at runtime; not reflected on the Order class. */
interface OrderWithTimestamps {
  createdAt?: Date;
  updatedAt?: Date;
}

interface OrderAdminFilter {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus | { $ne: PaymentStatus };
  createdAt?: { $gte?: Date; $lte?: Date };
  $or?: Record<string, unknown>[];
}

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private cartService: CartService,
    private productService: ProductService,
    private eventEmitter: EventEmitter2,
    private readonly logger: AppLoggerService,
    private readonly gateway: NotificationsGateway,
    private readonly discountsService: DiscountsService,
  ) {
    this.logger.setContext('OrderService');
  }

  async createFromCart(
    userId: string,
    dto: CreateOrderDto,
  ): Promise<OrderDocument> {
    const cart = await this.cartService.getRawCart(userId);
    if (!cart.items.length) throw new BadRequestException('سبد خرید خالی است');

    const user = await this.userModel
      .findById(userId)
      .select('addresses firstName lastName phone role')
      .lean<UserDocument>();
    if (!user) throw new NotFoundException('کاربر یافت نشد');

    const address = user.addresses.find(
      (a) => a._id.toString() === dto.addressId,
    );
    if (!address) throw new NotFoundException('آدرس یافت نشد');

    return this.placeOrder({
      userId,
      items: cart.items,
      shipping: {
        recipientName: address.recipientName,
        recipientPhone: address.recipientPhone,
        province: address.province,
        city: address.city,
        street: address.street,
        detail: address.detail,
        postalCode: address.postalCode,
      },
      note: dto.note,
      couponCode: dto.couponCode,
      customerName:
        `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() ||
        (user.phone ?? '').slice(0, -4) + '****',
    });
  }

  /**
   * Order without an account. The cart lives in the customer's browser, so only
   * product/variant/quantity are accepted — names, SKUs and prices are rebuilt
   * from the database. The returned `accessToken` is shown once; only its hash
   * is stored, and it is the customer's key to look the order up later.
   */
  async createGuestOrder(
    dto: CreateGuestOrderDto,
  ): Promise<{ order: OrderDocument; accessToken: string }> {
    const merged = new Map<
      string,
      { productId: string; variantId: string; quantity: number }
    >();
    for (const line of dto.items) {
      const key = `${line.productId}::${line.variantId}`;
      const prev = merged.get(key);
      if (prev) prev.quantity += line.quantity;
      else merged.set(key, { ...line });
    }
    const lines = [...merged.values()];

    const products = await this.productService.findManyByIds([
      ...new Set(lines.map((l) => l.productId)),
    ]);
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    const items = lines.map((l) => {
      const product = productMap.get(l.productId);
      const variant = product?.variants.find(
        (v) => v._id.toString() === l.variantId,
      );
      return {
        productId: l.productId,
        variantId: l.variantId,
        sku: variant?.sku ?? '',
        name: product?.name ?? 'کالا',
        slug: product?.slug ?? '',
        thumbnail: product?.thumbnail ?? null,
        price: variant?.price ?? 0,
        comparePrice: variant?.comparePrice ?? null,
        quantity: l.quantity,
        stock: variant?.stock ?? 0,
        attributes: variant?.attributes ?? [],
      };
    });

    const accessToken = randomBytes(24).toString('hex');
    const order = await this.placeOrder({
      userId: null,
      items,
      shipping: dto.shipping,
      note: dto.note,
      customerName: `${dto.shipping.recipientName} (مهمان)`,
      guestTokenHash: this.hashGuestToken(accessToken),
    });
    return { order, accessToken };
  }

  /** Returns the guest's own order, or 404 for any wrong id/token (no oracle). */
  async findGuestOrder(orderId: string, token: string): Promise<OrderDocument> {
    this.assertId(orderId);
    const order = await this.orderModel
      .findOne({
        _id: orderId,
        isGuest: true,
        guestTokenHash: this.hashGuestToken(token),
      })
      .select('-__v')
      .lean<OrderDocument>();
    if (!order) throw new NotFoundException('سفارش یافت نشد');
    return order;
  }

  private hashGuestToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async placeOrder(params: {
    userId: string | null;
    items: CartItem[];
    shipping: ShippingAddressInput;
    note?: string;
    couponCode?: string;
    customerName: string;
    guestTokenHash?: string;
  }): Promise<OrderDocument> {
    const { userId, items: itemsToOrder } = params;
    const address = params.shipping;
    if (!itemsToOrder.length)
      throw new BadRequestException('سبد خرید خالی است');

    // Batch fetch all products in one query (eliminates N+1)
    const productIds = [
      ...new Set(itemsToOrder.map((i) => new Types.ObjectId(i.productId))),
    ];
    const products = await this.productService.findManyByIds(
      productIds.map((id) => id.toString()),
    );
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    // Validate every line and re-price it from the database. The cart (Redis) only
    // remembers the price from the moment the item was added, which can be days
    // old — expired discounts or price changes must never be honoured at checkout.
    const pricedItems: (typeof itemsToOrder)[number][] = [];
    for (const item of itemsToOrder) {
      const product = productMap.get(item.productId);
      if (!product)
        throw new BadRequestException(`محصول "${item.name}" یافت نشد`);
      const variant = product.variants.find(
        (v) => v._id.toString() === item.variantId,
      );
      if (!variant?.isActive) {
        this.logger.warn('Order blocked: variant inactive', {
          userId,
          productId: item.productId,
          variantId: item.variantId,
          name: item.name,
        });
        throw new BadRequestException(`ویریانت "${item.name}" موجود نیست`);
      }
      if (variant.stock < item.quantity) {
        this.logger.warn('Order blocked: insufficient stock', {
          userId,
          productId: item.productId,
          variantId: item.variantId,
          name: item.name,
          requested: item.quantity,
          available: variant.stock,
        });
        throw new BadRequestException(
          `موجودی "${item.name}" کافی نیست. موجود: ${variant.stock}`,
        );
      }

      const priceInfo = await this.discountsService.calculateDiscountedPrice({
        originalPrice: variant.price,
        productId: item.productId,
        categoryId: product.category?.toString() ?? '',
        brandId: product.brand?.toString() ?? '',
      });
      const hasDiscount = priceInfo.discountAmount > 0;
      pricedItems.push({
        ...item,
        price: hasDiscount ? priceInfo.finalPrice : variant.price,
        comparePrice: hasDiscount
          ? variant.price
          : (variant.comparePrice ?? null),
      });
    }

    const subtotal = pricedItems.reduce((s, i) => s + i.price * i.quantity, 0);

    let discount = 0;
    let couponCode: string | undefined;
    let couponId: string | undefined;

    if (params.couponCode) {
      if (!userId)
        throw new BadRequestException(
          'کد تخفیف فقط برای کاربران دارای حساب قابل استفاده است',
        );
      const result = await this.discountsService.validateCoupon(
        userId,
        params.couponCode,
        subtotal,
      );
      if (!result.isValid) {
        throw new BadRequestException(result.message);
      }
      discount = result.discountAmount;
      couponCode = params.couponCode.toUpperCase().trim();
      couponId = result.discountId;
    }

    const total = Math.max(0, subtotal - discount);

    // Atomic reservation (stock >= qty per line) — prevents overselling under
    // concurrent checkouts. Released below if the order document can't be saved.
    await this.productService.reserveStock(
      pricedItems.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        quantity: i.quantity,
      })),
    );

    // Claim the coupon atomically (per-user + global caps) before the order exists.
    let couponUsageId: string | undefined;
    if (couponId && userId) {
      try {
        couponUsageId = await this.discountsService.claimCoupon(
          couponId,
          userId,
          discount,
        );
      } catch (err) {
        await this.productService.bulkAdjustStock(
          pricedItems.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            delta: i.quantity,
          })),
        );
        throw err;
      }
    }

    let order: OrderDocument;
    try {
      order = await this.orderModel.create({
        userId: userId ? new Types.ObjectId(userId) : null,
        isGuest: !userId,
        guestTokenHash: params.guestTokenHash,
        orderNumber: this.genOrderNumber(),
        items: pricedItems.map((i) => ({
          productId: new Types.ObjectId(i.productId),
          variantId: i.variantId,
          sku: i.sku,
          name: i.name,
          thumbnail: i.thumbnail ?? '',
          price: i.price,
          comparePrice: i.comparePrice ?? null,
          quantity: i.quantity,
          attributes: i.attributes ?? [],
        })),
        shippingAddress: address,
        subtotal,
        discount,
        total,
        couponCode,
        note: params.note,
      });
    } catch (err) {
      if (couponUsageId)
        await this.discountsService.releaseCoupon(couponUsageId);
      await this.productService.bulkAdjustStock(
        pricedItems.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          delta: i.quantity,
        })),
      );
      throw err;
    }

    if (userId) await this.cartService.clearCart(userId);

    if (couponUsageId)
      await this.discountsService.attachCouponOrder(
        couponUsageId,
        order._id.toString(),
      );

    this.logger.log('Order created', {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      userId,
      total,
      itemCount: pricedItems.length,
    });

    const customerName = params.customerName;

    const orderPayload = {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      total: order.total,
      customerName,
      createdAt:
        (order as unknown as OrderWithTimestamps).createdAt?.toISOString() ??
        new Date().toISOString(),
    };

    this.gateway.emitNewOrder(orderPayload);

    return order.toObject() as OrderDocument;
  }

  async findMyOrders(
    userId: string,
    page = 1,
    limit = 10,
    status?: OrderStatus,
  ) {
    ({ page, limit } = clampPagination(page, limit, { defaultLimit: 10 }));
    const filter: Record<string, any> = { userId: new Types.ObjectId(userId) };
    if (status && Object.values(OrderStatus).includes(status))
      filter.status = status;
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

  async findMyOrderById(
    userId: string,
    orderId: string,
  ): Promise<OrderDocument> {
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

    // Customers may only cancel an order that is still pending AND unpaid. Once the
    // admin has recorded a payment the refund is handled manually, so the customer
    // has to contact the shop. The status guard in the filter makes the claim
    // atomic: two concurrent cancels can't both restore stock.
    const order = await this.orderModel.findOneAndUpdate(
      {
        _id: orderId,
        userId: new Types.ObjectId(userId),
        status: OrderStatus.PENDING,
        // `$ne: PAID` (not `= UNPAID`): orders created before the field existed have none.
        paymentStatus: { $ne: PaymentStatus.PAID },
      },
      { status: OrderStatus.CANCELLED, cancelReason: 'لغو توسط خریدار' },
      { new: true },
    );
    if (!order) {
      const existing = await this.orderModel
        .findOne({ _id: orderId, userId: new Types.ObjectId(userId) })
        .select('status paymentStatus')
        .lean<OrderDocument>();
      if (!existing) throw new NotFoundException('سفارش یافت نشد');
      if (existing.paymentStatus === PaymentStatus.PAID)
        throw new BadRequestException(
          'این سفارش پرداخت شده است. برای لغو با پشتیبانی تماس بگیرید',
        );
      throw new BadRequestException('این سفارش قابل لغو نیست');
    }

    await this.productService.bulkAdjustStock(
      order.items.map((item) => ({
        productId: item.productId.toString(),
        variantId: item.variantId,
        delta: item.quantity,
      })),
    );

    if (order.couponCode)
      await this.discountsService.releaseCouponByOrder(order._id.toString());

    const previousStatus = OrderStatus.PENDING;

    this.logger.log('Order cancelled by user', {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      userId,
      previousStatus,
    });

    // Guest orders have no account → no in-app/SMS notification to send.
    const userForEvent = order.userId
      ? await this.userModel
          .findById(order.userId)
          .select('phone')
          .lean<UserDocument>()
      : null;
    if (userForEvent) {
      const event: OrderStatusChangedEvent = {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        userId: order.userId?.toString() ?? '',
        phone: userForEvent.phone,
        status: order.status,
        previousStatus: previousStatus,
      };
      this.eventEmitter.emit(EVENTS.ORDER_STATUS_CHANGED, event);
    }

    return order.toObject();
  }

  async adminFindAll(
    page = 1,
    limit = 20,
    filters: {
      status?: OrderStatus;
      paymentStatus?: PaymentStatus;
      search?: string;
      startDate?: string;
      endDate?: string;
    } = {},
  ) {
    ({ page, limit } = clampPagination(page, limit));
    const filter: OrderAdminFilter = {};

    if (filters.status && Object.values(OrderStatus).includes(filters.status))
      filter.status = filters.status;
    if (
      filters.paymentStatus &&
      Object.values(PaymentStatus).includes(filters.paymentStatus)
    )
      filter.paymentStatus =
        filters.paymentStatus === PaymentStatus.UNPAID
          ? { $ne: PaymentStatus.PAID } // includes legacy orders with no field
          : filters.paymentStatus;
    if (filters.startDate || filters.endDate) {
      filter.createdAt = {};
      if (filters.startDate) {
        const d = new Date(filters.startDate);
        if (isNaN(d.getTime()))
          throw new BadRequestException('تاریخ شروع نامعتبر است');
        filter.createdAt.$gte = d;
      }
      if (filters.endDate) {
        const d = new Date(filters.endDate + 'T23:59:59');
        if (isNaN(d.getTime()))
          throw new BadRequestException('تاریخ پایان نامعتبر است');
        filter.createdAt.$lte = d;
      }
    }
    if (filters.search) {
      const s = escapeRegex(filters.search.trim());
      filter.$or = [
        { orderNumber: { $regex: s, $options: 'i' } },
        { 'shippingAddress.recipientPhone': { $regex: s, $options: 'i' } },
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
    if (filters.search && /^[\d+]/.test(filters.search.trim())) {
      const matchedUsers = await this.userModel
        .find({
          phone: { $regex: escapeRegex(filters.search.trim()), $options: 'i' },
        })
        .select('_id')
        .lean<{ _id: Types.ObjectId }[]>();
      if (matchedUsers.length) {
        const userIds = matchedUsers.map((u) => u._id);
        filter.$or = [...(filter.$or ?? []), { userId: { $in: userIds } }];
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

  async updateStatus(
    orderId: string,
    dto: UpdateOrderStatusDto,
  ): Promise<OrderDocument> {
    this.assertId(orderId);
    const current = await this.orderModel.findById(orderId);
    if (!current) throw new NotFoundException('سفارش یافت نشد');

    this.assertTransition(current.status, dto.status);

    // Claim the transition atomically — if another request already moved the order
    // on, this matches nothing and we bail out instead of double-restoring stock.
    const update: Record<string, unknown> = { status: dto.status };
    if (dto.status === OrderStatus.CANCELLED && dto.cancelReason)
      update.cancelReason = dto.cancelReason;
    const order = await this.orderModel.findOneAndUpdate(
      { _id: orderId, status: current.status },
      update,
      { new: true },
    );
    if (!order)
      throw new ConflictException(
        'وضعیت سفارش همزمان تغییر کرد. صفحه را تازه‌سازی کنید',
      );

    if (dto.status === OrderStatus.CANCELLED) {
      await this.productService.bulkAdjustStock(
        order.items.map((item) => ({
          productId: item.productId.toString(),
          variantId: item.variantId,
          delta: item.quantity,
        })),
      );
    }

    if (dto.status === OrderStatus.CANCELLED && order.couponCode)
      await this.discountsService.releaseCouponByOrder(order._id.toString());

    const previousStatus = current.status;

    this.logger.log('Order status updated by admin', {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      previousStatus,
      newStatus: dto.status,
    });

    // Guest orders have no account → no in-app/SMS notification to send.
    const userForEvent = order.userId
      ? await this.userModel
          .findById(order.userId)
          .select('phone')
          .lean<UserDocument>()
      : null;
    if (userForEvent) {
      const event: OrderStatusChangedEvent = {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        userId: order.userId?.toString() ?? '',
        phone: userForEvent.phone,
        status: order.status,
        previousStatus: previousStatus,
      };
      this.eventEmitter.emit(EVENTS.ORDER_STATUS_CHANGED, event);
    }

    return order.toObject();
  }

  /**
   * Cancels pending, unpaid orders created before `cutoff` (restores stock and
   * gives coupons back via the normal cancel path). Returns how many were cancelled.
   */
  async cancelExpiredUnpaid(cutoff: Date, batch = 100): Promise<number> {
    const stale = await this.orderModel
      .find({
        status: OrderStatus.PENDING,
        paymentStatus: { $ne: PaymentStatus.PAID },
        createdAt: { $lt: cutoff },
      })
      .select('_id')
      .limit(batch)
      .lean<{ _id: Types.ObjectId }[]>();

    let cancelled = 0;
    for (const { _id } of stale) {
      try {
        await this.updateStatus(_id.toString(), {
          status: OrderStatus.CANCELLED,
          cancelReason: 'لغو خودکار: پرداخت در مهلت مقرر انجام نشد',
        });
        cancelled++;
      } catch (err) {
        // Paid/changed concurrently (409/400) — leave it alone.
        if (
          !(
            err instanceof ConflictException ||
            err instanceof BadRequestException
          )
        )
          throw err;
      }
    }
    return cancelled;
  }

  /**
   * Manual payment confirmation: the customer pays through the shop's Telegram /
   * Rubika chat and an admin records it here. Marking an order paid also moves it
   * from "pending" to "confirmed" so it enters the fulfilment flow.
   */
  async updatePaymentStatus(
    orderId: string,
    dto: UpdatePaymentStatusDto,
  ): Promise<OrderDocument> {
    this.assertId(orderId);

    if (dto.paymentStatus === PaymentStatus.PAID) {
      const order = await this.orderModel.findOneAndUpdate(
        {
          _id: orderId,
          // `$ne: PAID` (not `= UNPAID`): orders created before the field existed have none.
          paymentStatus: { $ne: PaymentStatus.PAID },
          status: { $ne: OrderStatus.CANCELLED },
        },
        { paymentStatus: PaymentStatus.PAID, paidAt: new Date() },
        { new: true },
      );
      if (!order) {
        const existing = await this.orderModel.findById(orderId);
        if (!existing) throw new NotFoundException('سفارش یافت نشد');
        if (existing.status === OrderStatus.CANCELLED)
          throw new BadRequestException('سفارش لغو شده قابل پرداخت نیست');
        return existing.toObject(); // already paid — idempotent
      }

      this.logger.log('Order marked as paid by admin', {
        orderId,
        orderNumber: order.orderNumber,
      });

      if (order.status === OrderStatus.PENDING)
        return this.updateStatus(orderId, { status: OrderStatus.CONFIRMED });
      return order.toObject();
    }

    // Reverting is only safe before the order ships.
    const reverted = await this.orderModel.findOneAndUpdate(
      {
        _id: orderId,
        paymentStatus: PaymentStatus.PAID,
        status: { $in: [OrderStatus.PENDING, OrderStatus.CONFIRMED] },
      },
      { paymentStatus: PaymentStatus.UNPAID, paidAt: null },
      { new: true },
    );
    if (!reverted)
      throw new BadRequestException(
        'امکان بازگرداندن وضعیت پرداخت برای این سفارش وجود ندارد',
      );
    this.logger.log('Order payment reverted to unpaid by admin', { orderId });
    return reverted.toObject();
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
