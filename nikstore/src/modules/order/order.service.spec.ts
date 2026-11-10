import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderService } from './order.service';
import { Order, OrderStatus, PaymentStatus } from './entities/order.schema';
import { User } from '../user/entities/user.schema';
import { CartService } from '../cart/cart.service';
import { ProductService } from '../product/product.service';
import { DiscountsService } from '../../discounts/discounts.service';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { NotificationsGateway } from '../../common/gateway/notifications.gateway';

const mockLogger = {
  setContext: jest.fn().mockReturnThis(),
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

const userId = new Types.ObjectId().toString();
const orderId = new Types.ObjectId().toString();
const addrId = new Types.ObjectId();
const prodId = new Types.ObjectId().toString();
const varId = new Types.ObjectId().toString();

const mockAddress = () => ({
  _id: { toString: () => addrId.toString() },
  recipientName: 'علی رضایی',
  recipientPhone: '09121111111',
  province: 'تهران',
  city: 'تهران',
  street: 'آزادی',
  detail: 'پ۱',
  postalCode: '1234567890',
});

const mockCartItem = () => ({
  productId: prodId,
  variantId: varId,
  sku: 'SKU-1',
  name: 'سامسونگ A55',
  thumbnail: null,
  price: 10_000_000,
  comparePrice: null,
  quantity: 2,
  stock: 5,
  attributes: [],
});

const mockProductVariant = () => ({
  _id: { toString: () => varId },
  sku: 'SKU-1',
  price: 10_000_000,
  stock: 5,
  isActive: true,
  attributes: [],
});

interface MockOrderItem {
  productId: Types.ObjectId;
  variantId: string;
  sku: string;
  name: string;
  price: number;
  quantity: number;
  attributes: unknown[];
}

interface MockOrder {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  orderNumber: string;
  status: OrderStatus;
  items: MockOrderItem[];
  subtotal: number;
  total: number;
  cancelReason?: string;
  save: jest.Mock;
  toObject: jest.Mock;
}

const mockOrder = (overrides: Partial<MockOrder> = {}): MockOrder => ({
  _id: new Types.ObjectId(orderId),
  userId: new Types.ObjectId(userId),
  orderNumber: 'ORD-123-TEST',
  status: OrderStatus.PENDING,
  items: [
    {
      productId: new Types.ObjectId(prodId),
      variantId: varId,
      sku: 'SKU-1',
      name: 'سامسونگ A55',
      price: 10_000_000,
      quantity: 2,
      attributes: [],
    },
  ],
  subtotal: 20_000_000,
  total: 20_000_000,
  save: jest.fn().mockResolvedValue(true),
  toObject: jest.fn().mockReturnThis(),
  ...overrides,
});

interface MockOrderModel {
  create: jest.Mock;
  find: jest.Mock;
  findOne: jest.Mock;
  findById: jest.Mock;
  findOneAndUpdate: jest.Mock;
  countDocuments: jest.Mock;
}

interface MockUserModel {
  findById: jest.Mock;
}

interface MockCartService {
  getRawCart: jest.Mock;
  clearCart: jest.Mock;
}

interface MockProductService {
  findById: jest.Mock;
  findManyByIds: jest.Mock;
  adjustStock: jest.Mock;
  bulkAdjustStock: jest.Mock;
  reserveStock: jest.Mock;
}

interface MockDiscountsService {
  validateCoupon: jest.Mock;
  claimCoupon: jest.Mock;
  attachCouponOrder: jest.Mock;
  releaseCoupon: jest.Mock;
  releaseCouponByOrder: jest.Mock;
  calculateDiscountedPrice: jest.Mock;
}

interface MockEventEmitter {
  emit: jest.Mock;
}

describe('OrderService', () => {
  let service: OrderService;
  let orderModel: MockOrderModel;
  let userModel: MockUserModel;
  let cartService: MockCartService;
  let productService: MockProductService;
  let discountService: MockDiscountsService;
  let eventEmitter: MockEventEmitter;

  beforeEach(async () => {
    orderModel = {
      create: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
      findOneAndUpdate: jest.fn(),
      countDocuments: jest.fn().mockResolvedValue(0),
    };
    userModel = {
      findById: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(null),
        }),
      }),
    };
    cartService = { getRawCart: jest.fn(), clearCart: jest.fn() };
    productService = {
      findById: jest.fn(),
      findManyByIds: jest.fn(),
      adjustStock: jest.fn().mockResolvedValue({}),
      bulkAdjustStock: jest.fn().mockResolvedValue(undefined),
      reserveStock: jest.fn().mockResolvedValue(undefined),
    };
    discountService = {
      validateCoupon: jest.fn(),
      claimCoupon: jest.fn().mockResolvedValue('usage1'),
      attachCouponOrder: jest.fn().mockResolvedValue(undefined),
      releaseCoupon: jest.fn().mockResolvedValue(undefined),
      releaseCouponByOrder: jest.fn().mockResolvedValue(undefined),
      // No active system discount: final price == original price.
      calculateDiscountedPrice: jest
        .fn()
        .mockResolvedValue({ discountAmount: 0, finalPrice: 0 }),
    };
    eventEmitter = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: getModelToken(Order.name), useValue: orderModel },
        { provide: getModelToken(User.name), useValue: userModel },
        { provide: CartService, useValue: cartService },
        { provide: ProductService, useValue: productService },
        { provide: DiscountsService, useValue: discountService },
        { provide: EventEmitter2, useValue: eventEmitter },
        { provide: AppLoggerService, useValue: mockLogger },
        {
          provide: NotificationsGateway,
          useValue: { emitNewOrder: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(OrderService);
    jest.clearAllMocks();
  });

  describe('createFromCart', () => {
    beforeEach(() => {
      cartService.getRawCart.mockResolvedValue({
        userId,
        updatedAt: '',
        items: [mockCartItem()],
      });
      userModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({ addresses: [mockAddress()] }),
        }),
      });
      productService.findManyByIds.mockResolvedValue([
        {
          _id: new Types.ObjectId(prodId),
          variants: [mockProductVariant()],
        },
      ]);
      orderModel.create.mockResolvedValue({
        ...mockOrder(),
        toObject: () => mockOrder(),
      });
    });

    it('creates order, decrements stock, clears cart', async () => {
      await service.createFromCart(userId, { addressId: addrId.toString() });

      expect(orderModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ total: 20_000_000 }),
      );
      expect(productService.reserveStock).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            productId: prodId,
            variantId: varId,
            quantity: 2,
          }),
        ]),
      );
      expect(cartService.clearCart).toHaveBeenCalledWith(userId);
    });

    it('throws when cart is empty', async () => {
      cartService.getRawCart.mockResolvedValue({
        userId,
        updatedAt: '',
        items: [],
      });
      await expect(
        service.createFromCart(userId, { addressId: addrId.toString() }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when address not found', async () => {
      userModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({ addresses: [] }),
        }),
      });
      await expect(
        service.createFromCart(userId, { addressId: addrId.toString() }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws when stock insufficient', async () => {
      productService.findManyByIds.mockResolvedValue([
        {
          _id: new Types.ObjectId(prodId),
          variants: [{ ...mockProductVariant(), stock: 1 }],
        },
      ]);
      await expect(
        service.createFromCart(userId, { addressId: addrId.toString() }),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates order when variant has empty SKU (regression for required:true bug)', async () => {
      const cartItemNoSku = { ...mockCartItem(), sku: '' };
      cartService.getRawCart.mockResolvedValue({
        userId,
        updatedAt: '',
        items: [cartItemNoSku],
      });

      await service.createFromCart(userId, { addressId: addrId.toString() });

      expect(orderModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({ sku: '' }),
          ]) as unknown,
        }),
      );
    });

    it('throws when variant is inactive', async () => {
      productService.findManyByIds.mockResolvedValue([
        {
          _id: new Types.ObjectId(prodId),
          variants: [{ ...mockProductVariant(), isActive: false }],
        },
      ]);
      await expect(
        service.createFromCart(userId, { addressId: addrId.toString() }),
      ).rejects.toThrow(BadRequestException);
    });

    it('applies coupon discount and records usage after order creation', async () => {
      const discountId = new Types.ObjectId().toString();
      discountService.validateCoupon.mockResolvedValue({
        isValid: true,
        discountAmount: 2_000_000,
        message: 'ok',
        discountId,
      });

      await service.createFromCart(userId, {
        addressId: addrId.toString(),
        couponCode: 'SAVE20',
      });

      expect(orderModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          discount: 2_000_000,
          total: 18_000_000, // 20_000_000 subtotal − 2_000_000
          couponCode: 'SAVE20',
        }),
      );
      expect(discountService.claimCoupon).toHaveBeenCalledWith(
        expect.any(String), // discountId
        userId,
        2_000_000,
      );
      expect(discountService.attachCouponOrder).toHaveBeenCalledWith(
        'usage1',
        expect.any(String), // orderId
      );
    });

    it('releases the coupon and the reserved stock when the order cannot be saved', async () => {
      discountService.validateCoupon.mockResolvedValue({
        isValid: true,
        discountAmount: 2_000_000,
        message: 'ok',
        discountId: new Types.ObjectId().toString(),
      });
      orderModel.create.mockRejectedValue(new Error('db down'));

      await expect(
        service.createFromCart(userId, {
          addressId: addrId.toString(),
          couponCode: 'SAVE20',
        }),
      ).rejects.toThrow('db down');

      expect(discountService.releaseCoupon).toHaveBeenCalledWith('usage1');
      expect(productService.bulkAdjustStock).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ delta: 2 })]),
      );
      expect(cartService.clearCart).not.toHaveBeenCalled();
    });

    it('rejects order when coupon is invalid', async () => {
      discountService.validateCoupon.mockResolvedValue({
        isValid: false,
        discountAmount: 0,
        message: 'کد تخفیف منقضی شده است',
      });

      await expect(
        service.createFromCart(userId, {
          addressId: addrId.toString(),
          couponCode: 'EXPIRED',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(orderModel.create).not.toHaveBeenCalled();
    });
  });

  describe('guest orders (no account)', () => {
    const shipping = {
      recipientName: 'مهمان',
      recipientPhone: '09121111111',
      province: 'تهران',
      city: 'تهران',
      street: 'آزادی',
      detail: 'پ۱',
      postalCode: '1234567890',
    };

    beforeEach(() => {
      productService.findManyByIds.mockResolvedValue([
        {
          _id: new Types.ObjectId(prodId),
          name: 'کت',
          slug: 'coat',
          variants: [mockProductVariant()],
        },
      ]);
      orderModel.create.mockResolvedValue({
        ...mockOrder(),
        toObject: () => mockOrder(),
      });
    });

    it('creates an order with no userId, server-side prices and a one-time token', async () => {
      const res = await service.createGuestOrder({
        // client-supplied price/name are not even accepted by the DTO
        items: [{ productId: prodId, variantId: varId, quantity: 2 }],
        shipping,
      });

      expect(res.accessToken).toMatch(/^[a-f0-9]{48}$/);
      const [created] = orderModel.create.mock.calls[0] as [
        {
          userId: unknown;
          isGuest: boolean;
          guestTokenHash: string;
          total: number;
        },
      ];
      expect(created.userId).toBeNull();
      expect(created.isGuest).toBe(true);
      expect(created.total).toBe(20_000_000); // 2 × DB price
      // only the hash is stored, never the raw token
      expect(created.guestTokenHash).toMatch(/^[a-f0-9]{64}$/);
      expect(created.guestTokenHash).not.toContain(res.accessToken);
      expect(productService.reserveStock).toHaveBeenCalled();
      expect(cartService.clearCart).not.toHaveBeenCalled();
      expect(discountService.claimCoupon).not.toHaveBeenCalled();
    });

    it('merges duplicate lines for the same variant', async () => {
      await service.createGuestOrder({
        items: [
          { productId: prodId, variantId: varId, quantity: 1 },
          { productId: prodId, variantId: varId, quantity: 2 },
        ],
        shipping,
      });
      expect(productService.reserveStock).toHaveBeenCalledWith([
        expect.objectContaining({ quantity: 3 }),
      ]);
    });

    it('rejects a variant that is unknown / out of stock', async () => {
      await expect(
        service.createGuestOrder({
          items: [{ productId: prodId, variantId: 'nope', quantity: 1 }],
          shipping,
        }),
      ).rejects.toThrow(BadRequestException);
      expect(orderModel.create).not.toHaveBeenCalled();
    });

    it('findGuestOrder looks up by id + token hash and 404s otherwise', async () => {
      orderModel.findOne.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(null),
        }),
      });
      await expect(
        service.findGuestOrder(orderId, 'a'.repeat(48)),
      ).rejects.toThrow(NotFoundException);
      const [q] = orderModel.findOne.mock.calls[0] as [
        {
          isGuest: boolean;
          guestTokenHash: string;
        },
      ];
      expect(q.isGuest).toBe(true);
      expect(q.guestTokenHash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('cancelMyOrder', () => {
    it('cancels and restores stock', async () => {
      const order = mockOrder({ status: OrderStatus.CANCELLED });
      orderModel.findOneAndUpdate.mockResolvedValue(order);
      orderModel.findOne.mockReturnValue({
        select: jest.fn().mockReturnValue({ lean: jest.fn() }),
      });

      await service.cancelMyOrder(userId, orderId);

      // Atomic claim: only a pending + unpaid order owned by the user matches
      expect(orderModel.findOneAndUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: OrderStatus.PENDING,
          paymentStatus: { $ne: PaymentStatus.PAID },
        }),
        expect.objectContaining({ status: OrderStatus.CANCELLED }),
        { new: true },
      );
      expect(productService.bulkAdjustStock).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            productId: prodId,
            variantId: varId,
            delta: 2,
          }),
        ]),
      );
    });

    const mockExisting = (value: unknown) =>
      orderModel.findOne.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(value),
        }),
      });

    it('throws when order not found', async () => {
      orderModel.findOneAndUpdate.mockResolvedValue(null);
      mockExisting(null);
      await expect(service.cancelMyOrder(userId, orderId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws when the order is no longer pending', async () => {
      orderModel.findOneAndUpdate.mockResolvedValue(null);
      mockExisting({
        status: OrderStatus.DELIVERED,
        paymentStatus: PaymentStatus.UNPAID,
      });
      await expect(service.cancelMyOrder(userId, orderId)).rejects.toThrow(
        BadRequestException,
      );
      expect(productService.bulkAdjustStock).not.toHaveBeenCalled();
    });

    it('refuses to cancel a paid order (refund is manual)', async () => {
      orderModel.findOneAndUpdate.mockResolvedValue(null);
      mockExisting({
        status: OrderStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PAID,
      });
      await expect(service.cancelMyOrder(userId, orderId)).rejects.toThrow(
        /پرداخت شده/,
      );
      expect(productService.bulkAdjustStock).not.toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('transitions pending → confirmed', async () => {
      orderModel.findById.mockResolvedValue(mockOrder());
      const updated = mockOrder({ status: OrderStatus.CONFIRMED });
      orderModel.findOneAndUpdate.mockResolvedValue(updated);

      const result = await service.updateStatus(orderId, {
        status: OrderStatus.CONFIRMED,
      });
      expect(orderModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: orderId, status: OrderStatus.PENDING },
        { status: OrderStatus.CONFIRMED },
        { new: true },
      );
      expect(result.status).toBe(OrderStatus.CONFIRMED);
    });

    it('throws on illegal transition delivered → cancelled', async () => {
      orderModel.findById.mockResolvedValue(
        mockOrder({ status: OrderStatus.DELIVERED }),
      );
      await expect(
        service.updateStatus(orderId, { status: OrderStatus.CANCELLED }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws a conflict when another request already moved the order', async () => {
      orderModel.findById.mockResolvedValue(mockOrder());
      orderModel.findOneAndUpdate.mockResolvedValue(null);
      await expect(
        service.updateStatus(orderId, { status: OrderStatus.CONFIRMED }),
      ).rejects.toThrow(ConflictException);
      expect(productService.bulkAdjustStock).not.toHaveBeenCalled();
    });

    it('restores stock when admin cancels', async () => {
      orderModel.findById.mockResolvedValue(
        mockOrder({ status: OrderStatus.CONFIRMED }),
      );
      orderModel.findOneAndUpdate.mockResolvedValue(
        mockOrder({
          status: OrderStatus.CANCELLED,
          cancelReason: 'موجود نیست',
        }),
      );

      await service.updateStatus(orderId, {
        status: OrderStatus.CANCELLED,
        cancelReason: 'موجود نیست',
      });

      expect(orderModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: orderId, status: OrderStatus.CONFIRMED },
        { status: OrderStatus.CANCELLED, cancelReason: 'موجود نیست' },
        { new: true },
      );
      expect(productService.bulkAdjustStock).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            productId: prodId,
            variantId: varId,
            delta: 2,
          }),
        ]),
      );
    });
  });

  describe('cancelExpiredUnpaid', () => {
    it('cancels each stale pending order through the normal cancel path', async () => {
      orderModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest
              .fn()
              .mockResolvedValue([{ _id: new Types.ObjectId(orderId) }]),
          }),
        }),
      });
      orderModel.findById.mockResolvedValue(mockOrder());
      orderModel.findOneAndUpdate.mockResolvedValue(
        mockOrder({ status: OrderStatus.CANCELLED }),
      );

      const n = await service.cancelExpiredUnpaid(new Date());

      expect(n).toBe(1);
      expect(orderModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          status: OrderStatus.PENDING,
          paymentStatus: { $ne: PaymentStatus.PAID },
        }),
      );
      expect(productService.bulkAdjustStock).toHaveBeenCalled(); // stock restored
    });

    it('skips an order that was paid/changed concurrently', async () => {
      orderModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest
              .fn()
              .mockResolvedValue([{ _id: new Types.ObjectId(orderId) }]),
          }),
        }),
      });
      orderModel.findById.mockResolvedValue(mockOrder());
      orderModel.findOneAndUpdate.mockResolvedValue(null); // lost the race → 409

      await expect(service.cancelExpiredUnpaid(new Date())).resolves.toBe(0);
      expect(productService.bulkAdjustStock).not.toHaveBeenCalled();
    });
  });

  describe('updatePaymentStatus', () => {
    it('marks an unpaid pending order paid and confirms it', async () => {
      orderModel.findOneAndUpdate
        .mockResolvedValueOnce(mockOrder({ status: OrderStatus.PENDING }))
        .mockResolvedValueOnce(mockOrder({ status: OrderStatus.CONFIRMED }));
      orderModel.findById.mockResolvedValue(mockOrder());

      const result = await service.updatePaymentStatus(orderId, {
        paymentStatus: PaymentStatus.PAID,
      });

      expect(orderModel.findOneAndUpdate).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          paymentStatus: { $ne: PaymentStatus.PAID },
          status: { $ne: OrderStatus.CANCELLED },
        }),
        expect.objectContaining({ paymentStatus: PaymentStatus.PAID }),
        { new: true },
      );
      expect(result.status).toBe(OrderStatus.CONFIRMED);
    });

    it('refuses to mark a cancelled order paid', async () => {
      orderModel.findOneAndUpdate.mockResolvedValue(null);
      orderModel.findById.mockResolvedValue(
        mockOrder({ status: OrderStatus.CANCELLED }),
      );
      await expect(
        service.updatePaymentStatus(orderId, {
          paymentStatus: PaymentStatus.PAID,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('is idempotent when the order is already paid', async () => {
      orderModel.findOneAndUpdate.mockResolvedValue(null);
      orderModel.findById.mockResolvedValue(
        mockOrder({ status: OrderStatus.CONFIRMED }),
      );
      await expect(
        service.updatePaymentStatus(orderId, {
          paymentStatus: PaymentStatus.PAID,
        }),
      ).resolves.toBeDefined();
    });

    it('refuses to revert payment once the order has shipped', async () => {
      orderModel.findOneAndUpdate.mockResolvedValue(null);
      await expect(
        service.updatePaymentStatus(orderId, {
          paymentStatus: PaymentStatus.UNPAID,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findMyOrderById', () => {
    it('returns order when found', async () => {
      const order = mockOrder();
      orderModel.findOne.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(order),
        }),
      });

      const result = await service.findMyOrderById(userId, orderId);
      expect(result).toEqual(order);
    });

    it('throws NotFoundException when order not found', async () => {
      orderModel.findOne.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(service.findMyOrderById(userId, orderId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('adminFindById', () => {
    it('returns order when found', async () => {
      const order = mockOrder();
      orderModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(order),
          }),
        }),
      });

      const result = await service.adminFindById(orderId);
      expect(result).toEqual(order);
    });

    it('throws NotFoundException when order not found', async () => {
      orderModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(null),
          }),
        }),
      });

      await expect(service.adminFindById(orderId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findMyOrders', () => {
    it('returns paginated orders for user', async () => {
      const orders = [mockOrder()];
      orderModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(orders),
              }),
            }),
          }),
        }),
      });
      orderModel.countDocuments.mockResolvedValue(1);

      const result = await service.findMyOrders(userId, 1, 10);
      expect(result.orders).toEqual(orders);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
    });
  });

  describe('adminFindAll', () => {
    it('returns paginated orders with populated user', async () => {
      const orders = [mockOrder()];
      orderModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                  lean: jest.fn().mockResolvedValue(orders),
                }),
              }),
            }),
          }),
        }),
      });
      orderModel.countDocuments.mockResolvedValue(1);

      const result = await service.adminFindAll(1, 20);
      expect(result.items).toEqual(orders);
      expect(result.total).toBe(1);
    });
  });
});
