import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { CartService } from './cart.service';
import { Product } from '../product/entities/product.schema';
import { DiscountsService } from '../../discounts/discounts.service';
import { REDIS_CLIENT } from '../../redis/redis.module';
import type { Cart } from './cart.interface';

const userId = 'user_001';
const prodId = new Types.ObjectId().toString();
const varId  = new Types.ObjectId().toString();

const RETAIL_PRICE = 5_000_000;

const mockVariant = (overrides = {}) => ({
  _id:          { toString: () => varId },
  sku:          'SKU-1',
  price:        RETAIL_PRICE,
  comparePrice: 0,
  stock:        20,
  isActive:     true,
  attributes:   [{ key: 'رنگ', value: 'مشکی' }],
  ...overrides,
});

const mockProduct = (variantOverrides = {}) => ({
  _id:       { toString: () => prodId },
  name:      'پیراهن مردانه',
  slug:      'shirt-001',
  thumbnail: null,
  category:  new Types.ObjectId(),
  brand:     new Types.ObjectId(),
  variants:  [mockVariant(variantOverrides)],
});

const cartWithItem = (): Cart => ({
  userId,
  updatedAt: '',
  items: [{
    productId:    prodId,
    variantId:    varId,
    sku:          'SKU-1',
    name:         'پیراهن مردانه',
    slug:         'shirt-001',
    thumbnail:    null,
    price:        RETAIL_PRICE,
    comparePrice: 6_000_000,
    quantity:     2,
    stock:        20,
    attributes:   [],
  }],
});

const noDiscount = () => ({
  finalPrice: RETAIL_PRICE,
  discountAmount: 0,
  discountPercentage: 0,
  activeDiscount: null,
});

const withDiscount = (pct: number, base: number) => {
  const amount = Math.floor((base * pct) / 100);
  return {
    finalPrice:         base - amount,
    discountAmount:     amount,
    discountPercentage: pct,
    activeDiscount:     { id: 'discount-1', endDate: null as Date | null },
  };
};

describe('CartService', () => {
  let service: CartService;
  let redis: jest.Mocked<any>;
  let productModel: any;
  let discountsService: jest.Mocked<Pick<DiscountsService, 'calculateDiscountedPrice'>>;

  const mockProductFind = (overrides = {}) => {
    productModel.findById.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockProduct(overrides)),
      }),
    });
  };

  beforeEach(async () => {
    redis = {
      get:   jest.fn().mockResolvedValue(null),
      setex: jest.fn(),
      del:   jest.fn(),
    };
    productModel = {
      findById: jest.fn(),
      find:     jest.fn(),
    };
    discountsService = {
      calculateDiscountedPrice: jest.fn().mockResolvedValue(noDiscount()),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        { provide: getModelToken(Product.name),  useValue: productModel },
        { provide: REDIS_CLIENT,                 useValue: redis },
        { provide: DiscountsService,             useValue: discountsService },
      ],
    }).compile();

    service = module.get(CartService);
    jest.clearAllMocks();
    // Re-attach mocks after clearAllMocks
    discountsService.calculateDiscountedPrice.mockResolvedValue(noDiscount());
  });

  // ─── getCart ────────────────────────────────────────────────────

  describe('getCart', () => {
    it('returns empty summary for new user', async () => {
      const res = await service.getCart(userId);
      expect(res.items).toHaveLength(0);
      expect(res.subtotal).toBe(0);
      expect(res.totalItems).toBe(0);
      expect(res.savings).toBe(0);
    });

    it('auto-removes items whose product was deleted', async () => {
      redis.get.mockResolvedValue(JSON.stringify(cartWithItem()));
      productModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([]),
        }),
      });

      const res = await service.getCart(userId);
      expect(res.items).toHaveLength(0);
    });

    it('refreshes stock from DB on getCart', async () => {
      redis.get.mockResolvedValue(JSON.stringify(cartWithItem()));
      productModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([{
            _id:      { toString: () => prodId },
            variants: [mockVariant({ stock: 3 })],
          }]),
        }),
      });

      const res = await service.getCart(userId);
      expect(res.items[0].stock).toBe(3);
    });
  });

  // ─── addItem ──────────────────────────────────────────────────────

  describe('addItem', () => {
    beforeEach(() => {
      mockProductFind();
    });

    it('adds new item to empty cart', async () => {
      const res = await service.addItem(userId, { productId: prodId, variantId: varId, quantity: 2 });
      expect(res.items).toHaveLength(1);
      expect(res.items[0].quantity).toBe(2);
      expect(res.items[0].price).toBe(RETAIL_PRICE);
      expect(redis.setex).toHaveBeenCalled();
    });

    it('increments quantity for existing item', async () => {
      redis.get.mockResolvedValue(JSON.stringify(cartWithItem()));
      const res = await service.addItem(userId, { productId: prodId, variantId: varId, quantity: 1 });
      expect(res.items[0].quantity).toBe(3);
    });

    it('throws when quantity exceeds stock', async () => {
      await expect(
        service.addItem(userId, { productId: prodId, variantId: varId, quantity: 100 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when product not found', async () => {
      productModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
      });
      await expect(
        service.addItem(userId, { productId: prodId, variantId: varId, quantity: 1 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('calls calculateDiscountedPrice with the variant price', async () => {
      await service.addItem(userId, { productId: prodId, variantId: varId, quantity: 1 });
      expect(discountsService.calculateDiscountedPrice).toHaveBeenCalledWith(
        expect.objectContaining({
          originalPrice: RETAIL_PRICE,
          productId:     prodId,
        }),
      );
    });
  });

  // ─── addItem — system discount ───────────────────────────────────

  describe('addItem — with system discount', () => {
    beforeEach(() => {
      mockProductFind();
    });

    it('applies system discount: price becomes discounted, comparePrice becomes original price', async () => {
      discountsService.calculateDiscountedPrice.mockResolvedValue(
        withDiscount(10, RETAIL_PRICE),
      );

      const res = await service.addItem(userId, { productId: prodId, variantId: varId, quantity: 10 });
      const item = res.items[0];
      const expectedPrice = RETAIL_PRICE - Math.floor((RETAIL_PRICE * 10) / 100);

      expect(item.price).toBe(expectedPrice);
      expect(item.comparePrice).toBe(RETAIL_PRICE); // original price → strikethrough
    });

    it('savings equals discount amount × quantity', async () => {
      discountsService.calculateDiscountedPrice.mockResolvedValue(
        withDiscount(10, RETAIL_PRICE),
      );

      const res = await service.addItem(userId, { productId: prodId, variantId: varId, quantity: 10 });
      const discountedPrice = RETAIL_PRICE - Math.floor((RETAIL_PRICE * 10) / 100);
      const expectedSavingsPerItem = RETAIL_PRICE - discountedPrice;

      expect(res.savings).toBe(expectedSavingsPerItem * 10);
    });

    it('leaves price/comparePrice unchanged when discount amount is 0', async () => {
      discountsService.calculateDiscountedPrice.mockResolvedValue(noDiscount());

      const res = await service.addItem(userId, { productId: prodId, variantId: varId, quantity: 10 });
      const item = res.items[0];

      expect(item.price).toBe(RETAIL_PRICE);
      expect(item.comparePrice).toBe(0); // variant.comparePrice (falsy passed through as-is)
    });

    it('total price reflects discounted price', async () => {
      discountsService.calculateDiscountedPrice.mockResolvedValue(
        withDiscount(10, RETAIL_PRICE),
      );

      const res = await service.addItem(userId, { productId: prodId, variantId: varId, quantity: 10 });
      const discountedPrice = RETAIL_PRICE - Math.floor((RETAIL_PRICE * 10) / 100);

      expect(res.subtotal).toBe(discountedPrice * 10);
    });
  });

  // ─── updateItem / removeItem ─────────────────────────────────────

  describe('updateItem', () => {
    it('updates quantity', async () => {
      redis.get.mockResolvedValue(JSON.stringify(cartWithItem()));
      const res = await service.updateItem(userId, prodId, { variantId: varId, quantity: 4 });
      expect(res.items[0].quantity).toBe(4);
    });

    it('removes item when quantity is 0', async () => {
      redis.get.mockResolvedValue(JSON.stringify(cartWithItem()));
      const res = await service.updateItem(userId, prodId, { variantId: varId, quantity: 0 });
      expect(res.items).toHaveLength(0);
    });

    it('throws when item not in cart', async () => {
      redis.get.mockResolvedValue(null);
      await expect(
        service.updateItem(userId, prodId, { variantId: varId, quantity: 1 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeItem', () => {
    it('removes item from cart', async () => {
      redis.get.mockResolvedValue(JSON.stringify(cartWithItem()));
      const res = await service.removeItem(userId, prodId, varId);
      expect(res.items).toHaveLength(0);
    });

    it('throws when item not in cart', async () => {
      redis.get.mockResolvedValue(null);
      await expect(service.removeItem(userId, prodId, varId)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── buildSummary ────────────────────────────────────────────────

  describe('buildSummary (savings)', () => {
    it('calculates savings from comparePrice vs price', async () => {
      redis.get.mockResolvedValue(JSON.stringify(cartWithItem()));
      productModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([{
            _id:      { toString: () => prodId },
            variants: [mockVariant()],
          }]),
        }),
      });

      const res = await service.getCart(userId);
      // item: price=5_000_000, comparePrice=6_000_000, qty=2
      expect(res.savings).toBe(2_000_000);
    });
  });
});
