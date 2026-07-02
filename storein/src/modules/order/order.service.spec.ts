import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderService } from './order.service';
import { Order, OrderStatus } from './entities/order.schema';
import { User } from '../user/entities/user.schema';
import { CartService } from '../cart/cart.service';
import { ProductService } from '../product/product.service';
import { DiscountsService } from '../../discounts/discounts.service';
import { AppLoggerService }    from '../../common/logger/app-logger.service';
import { NotificationsGateway } from '../../common/gateway/notifications.gateway';

const mockLogger = {
  setContext: jest.fn().mockReturnThis(),
  log: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn(),
};

const userId  = new Types.ObjectId().toString();
const orderId = new Types.ObjectId().toString();
const addrId  = new Types.ObjectId();
const prodId  = new Types.ObjectId().toString();
const varId   = new Types.ObjectId().toString();

const mockAddress = () => ({
  _id:            { toString: () => addrId.toString() },
  recipientName:  'علی رضایی',
  recipientPhone: '09121111111',
  province: 'تهران', city: 'تهران',
  street: 'آزادی', detail: 'پ۱', postalCode: '1234567890',
});

const mockCartItem = () => ({
  productId: prodId, variantId: varId, sku: 'SKU-1',
  name: 'سامسونگ A55', thumbnail: null,
  price: 10_000_000, comparePrice: null,
  quantity: 2, stock: 5, attributes: [],
});

const mockProductVariant = () => ({
  _id: { toString: () => varId },
  sku: 'SKU-1', price: 10_000_000,
  stock: 5, isActive: true, attributes: [],
});

const mockOrder = (overrides: any = {}) => ({
  _id:         new Types.ObjectId(orderId),
  userId:      new Types.ObjectId(userId),
  orderNumber: 'ORD-123-TEST',
  status:      OrderStatus.PENDING,
  items: [{
    productId: new Types.ObjectId(prodId),
    variantId: varId, sku: 'SKU-1', name: 'سامسونگ A55',
    price: 10_000_000, quantity: 2, attributes: [],
  }],
  subtotal: 20_000_000, total: 20_000_000,
  save:     jest.fn().mockResolvedValue(true),
  toObject: jest.fn().mockReturnThis(),
  ...overrides,
});

describe('OrderService', () => {
  let service: OrderService;
  let orderModel: any;
  let userModel: any;
  let cartService: jest.Mocked<any>;
  let productService: jest.Mocked<any>;
  let discountService: jest.Mocked<any>;
  let eventEmitter: jest.Mocked<any>;

  beforeEach(async () => {
    orderModel = {
      create:         jest.fn(),
      find:           jest.fn(),
      findOne:        jest.fn(),
      findById:       jest.fn(),
      countDocuments: jest.fn().mockResolvedValue(0),
    };
    userModel        = {
      findById: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(null),
        }),
      }),
    };
    cartService      = { getRawCart: jest.fn(), clearCart: jest.fn() };
    productService   = { findById: jest.fn(), findManyByIds: jest.fn(), adjustStock: jest.fn().mockResolvedValue({}), bulkAdjustStock: jest.fn().mockResolvedValue(undefined) };
    discountService  = { validateCoupon: jest.fn(), recordCouponUsage: jest.fn().mockResolvedValue(undefined) };
    eventEmitter     = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: getModelToken(Order.name), useValue: orderModel },
        { provide: getModelToken(User.name),  useValue: userModel },
        { provide: CartService,               useValue: cartService },
        { provide: ProductService,            useValue: productService },
        { provide: DiscountsService,           useValue: discountService },
        { provide: EventEmitter2,             useValue: eventEmitter },
        { provide: AppLoggerService,          useValue: mockLogger },
        { provide: NotificationsGateway,      useValue: { emitNewOrder: jest.fn() } },
      ],
    }).compile();

    service = module.get(OrderService);
    jest.clearAllMocks();
  });

  describe('createFromCart', () => {
    beforeEach(() => {
      cartService.getRawCart.mockResolvedValue({
        userId, updatedAt: '', items: [mockCartItem()],
      });
      userModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({ addresses: [mockAddress()] }),
        }),
      });
      productService.findManyByIds.mockResolvedValue([{
        _id: new Types.ObjectId(prodId), variants: [mockProductVariant()],
      }]);
      orderModel.create.mockResolvedValue({
        ...mockOrder(), toObject: () => mockOrder(),
      });
    });

    it('creates order, decrements stock, clears cart', async () => {
      await service.createFromCart(userId, { addressId: addrId.toString() });

      expect(orderModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ total: 20_000_000 }),
      );
      expect(productService.bulkAdjustStock).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ productId: prodId, variantId: varId, delta: -2 })]),
      );
      expect(cartService.clearCart).toHaveBeenCalledWith(userId);
    });

    it('throws when cart is empty', async () => {
      cartService.getRawCart.mockResolvedValue({ userId, updatedAt: '', items: [] });
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
      productService.findManyByIds.mockResolvedValue([{
        _id: new Types.ObjectId(prodId), variants: [{ ...mockProductVariant(), stock: 1 }],
      }]);
      await expect(
        service.createFromCart(userId, { addressId: addrId.toString() }),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates order when variant has empty SKU (regression for required:true bug)', async () => {
      const cartItemNoSku = { ...mockCartItem(), sku: '' };
      cartService.getRawCart.mockResolvedValue({
        userId, updatedAt: '', items: [cartItemNoSku],
      });

      await service.createFromCart(userId, { addressId: addrId.toString() });

      expect(orderModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({ sku: '' }),
          ]),
        }),
      );
    });

    it('throws when variant is inactive', async () => {
      productService.findManyByIds.mockResolvedValue([{
        _id: new Types.ObjectId(prodId), variants: [{ ...mockProductVariant(), isActive: false }],
      }]);
      await expect(
        service.createFromCart(userId, { addressId: addrId.toString() }),
      ).rejects.toThrow(BadRequestException);
    });

    it('applies coupon discount and records usage after order creation', async () => {
      const discountId = new Types.ObjectId().toString();
      discountService.validateCoupon.mockResolvedValue({
        isValid:        true,
        discountAmount: 2_000_000,
        message:        'ok',
        discountId,
      });

      await service.createFromCart(userId, {
        addressId:  addrId.toString(),
        couponCode: 'SAVE20',
      });

      expect(orderModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          discount:   2_000_000,
          total:      18_000_000,    // 20_000_000 subtotal − 2_000_000
          couponCode: 'SAVE20',
        }),
      );
      expect(discountService.recordCouponUsage).toHaveBeenCalledWith(
        expect.any(String),   // discountId
        userId,
        expect.any(String),   // orderId
        2_000_000,
      );
    });

    it('rejects order when coupon is invalid', async () => {
      discountService.validateCoupon.mockResolvedValue({
        isValid: false, discountAmount: 0, message: 'کد تخفیف منقضی شده است',
      });

      await expect(
        service.createFromCart(userId, { addressId: addrId.toString(), couponCode: 'EXPIRED' }),
      ).rejects.toThrow(BadRequestException);
      expect(orderModel.create).not.toHaveBeenCalled();
    });
  });

  describe('cancelMyOrder', () => {
    it('cancels and restores stock', async () => {
      const order = mockOrder();
      orderModel.findOne.mockResolvedValue(order);

      await service.cancelMyOrder(userId, orderId);

      expect(order.status).toBe(OrderStatus.CANCELLED);
      expect(productService.bulkAdjustStock).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ productId: prodId, variantId: varId, delta: 2 })]),
      );
      expect(order.save).toHaveBeenCalled();
    });

    it('throws when order not found', async () => {
      orderModel.findOne.mockResolvedValue(null);
      await expect(service.cancelMyOrder(userId, orderId))
        .rejects.toThrow(NotFoundException);
    });

    it('throws when cancelling a delivered order', async () => {
      orderModel.findOne.mockResolvedValue(
        mockOrder({ status: OrderStatus.DELIVERED }),
      );
      await expect(service.cancelMyOrder(userId, orderId))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('updateStatus', () => {
    it('transitions pending → confirmed', async () => {
      const order = mockOrder();
      orderModel.findById.mockResolvedValue(order);

      await service.updateStatus(orderId, { status: OrderStatus.CONFIRMED });
      expect(order.status).toBe(OrderStatus.CONFIRMED);
    });

    it('throws on illegal transition delivered → cancelled', async () => {
      orderModel.findById.mockResolvedValue(
        mockOrder({ status: OrderStatus.DELIVERED }),
      );
      await expect(
        service.updateStatus(orderId, { status: OrderStatus.CANCELLED }),
      ).rejects.toThrow(BadRequestException);
    });

    it('restores stock when admin cancels', async () => {
      const order = mockOrder({ status: OrderStatus.CONFIRMED });
      orderModel.findById.mockResolvedValue(order);

      await service.updateStatus(orderId, {
        status: OrderStatus.CANCELLED,
        cancelReason: 'موجود نیست',
      });

      expect(productService.bulkAdjustStock).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ productId: prodId, variantId: varId, delta: 2 })]),
      );
      expect(order.cancelReason).toBe('موجود نیست');
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

      await expect(service.findMyOrderById(userId, orderId))
        .rejects.toThrow(NotFoundException);
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

      await expect(service.adminFindById(orderId))
        .rejects.toThrow(NotFoundException);
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
