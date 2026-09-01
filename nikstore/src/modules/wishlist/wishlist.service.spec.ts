import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { WishlistService } from './wishlist.service';
import { Wishlist } from './entities/wishlist.schema';
import { Product } from '../product/entities/product.schema';
import { REDIS_CLIENT } from '../../redis/redis.module';

const userId = new Types.ObjectId().toString();
const productId = new Types.ObjectId().toString();
const prodId2 = new Types.ObjectId().toString();

const mockProduct = (id = productId) => ({
  _id: { toString: () => id },
  name: 'سامسونگ A55',
  slug: 'samsung-a55',
  thumbnail: null,
  minPrice: 10_000_000,
  maxPrice: 10_000_000,
  totalStock: 5,
  avgRating: 4.5,
  specs: [
    { key: 'رم', value: '8GB' },
    { key: 'حافظه', value: '128GB' },
  ],
});

const mockWishlist = (ids: string[] = [productId]) => ({
  userId: new Types.ObjectId(userId),
  productIds: ids.map((id) => new Types.ObjectId(id)),
});

interface MockWishlistModel {
  findOne: jest.Mock;
  findOneAndUpdate: jest.Mock;
  exists: jest.Mock;
}

interface MockProductModel {
  exists: jest.Mock;
  find: jest.Mock;
}

interface MockRedis {
  get: jest.Mock;
  setex: jest.Mock;
  del: jest.Mock;
}

describe('WishlistService', () => {
  let service: WishlistService;
  let wishlistModel: MockWishlistModel;
  let productModel: MockProductModel;
  let redis: MockRedis;

  beforeEach(async () => {
    wishlistModel = {
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
      exists: jest.fn(),
    };

    productModel = {
      exists: jest.fn(),
      find: jest.fn(),
    };

    redis = {
      get: jest.fn().mockResolvedValue(null),
      setex: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WishlistService,
        { provide: getModelToken(Wishlist.name), useValue: wishlistModel },
        { provide: getModelToken(Product.name), useValue: productModel },
        { provide: REDIS_CLIENT, useValue: redis },
      ],
    }).compile();

    service = module.get(WishlistService);
    jest.clearAllMocks();
  });

  // ── toggle ────────────────────────────────────────────────────
  describe('toggle', () => {
    it('adds product to wishlist when not present', async () => {
      productModel.exists.mockResolvedValue({ _id: productId });
      wishlistModel.findOneAndUpdate
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ productIds: [new Types.ObjectId(productId)] });

      const res = await service.toggle(userId, productId);
      expect(res.added).toBe(true);
      expect(res.wishlistCount).toBe(1);
    });

    it('removes product from wishlist when present', async () => {
      productModel.exists.mockResolvedValue({ _id: productId });
      wishlistModel.findOneAndUpdate.mockResolvedValueOnce({ productIds: [] });

      const res = await service.toggle(userId, productId);
      expect(res.added).toBe(false);
      expect(res.wishlistCount).toBe(0);
    });

    it('throws when product not found', async () => {
      productModel.exists.mockResolvedValue(null);
      await expect(service.toggle(userId, productId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── getWishlist ───────────────────────────────────────────────
  describe('getWishlist', () => {
    it('returns empty when no wishlist exists', async () => {
      wishlistModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });
      const res = await service.getWishlist(userId);
      expect(res.products).toHaveLength(0);
      expect(res.total).toBe(0);
    });

    it('returns paginated products in wishlist order', async () => {
      wishlistModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockWishlist([productId, prodId2])),
      });
      productModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest
            .fn()
            .mockResolvedValue([mockProduct(productId), mockProduct(prodId2)]),
        }),
      });

      const res = await service.getWishlist(userId, 1, 20);
      expect(res.total).toBe(2);
      expect(res.products).toHaveLength(2);
    });
  });

  // ── isInWishlist ──────────────────────────────────────────────
  describe('isInWishlist', () => {
    it('returns true when product is in wishlist', async () => {
      wishlistModel.exists.mockResolvedValue({ _id: 'wid' });
      const res = await service.isInWishlist(userId, productId);
      expect(res.inWishlist).toBe(true);
    });

    it('returns false when product is not in wishlist', async () => {
      wishlistModel.exists.mockResolvedValue(null);
      const res = await service.isInWishlist(userId, productId);
      expect(res.inWishlist).toBe(false);
    });
  });

  // ── addToCompare ──────────────────────────────────────────────
  describe('addToCompare', () => {
    it('adds product to compare list', async () => {
      productModel.exists.mockResolvedValue({ _id: productId });
      redis.get.mockResolvedValue(null);

      const res = await service.addToCompare(userId, productId);
      expect(res.productIds).toContain(productId);
      expect(res.count).toBe(1);
      expect(redis.setex).toHaveBeenCalled();
    });

    it('does not duplicate existing product', async () => {
      productModel.exists.mockResolvedValue({ _id: productId });
      redis.get.mockResolvedValue(JSON.stringify([productId]));

      const res = await service.addToCompare(userId, productId);
      expect(res.count).toBe(1);
    });

    it('throws when compare list is full (4 products)', async () => {
      productModel.exists.mockResolvedValue({ _id: productId });
      redis.get.mockResolvedValue(
        JSON.stringify([
          new Types.ObjectId().toString(),
          new Types.ObjectId().toString(),
          new Types.ObjectId().toString(),
          new Types.ObjectId().toString(),
        ]),
      );
      await expect(service.addToCompare(userId, productId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws when product not found', async () => {
      productModel.exists.mockResolvedValue(null);
      await expect(service.addToCompare(userId, productId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── getCompare ────────────────────────────────────────────────
  describe('getCompare', () => {
    it('returns empty when compare list is empty', async () => {
      redis.get.mockResolvedValue(null);
      const res = await service.getCompare(userId);
      expect(res.products).toHaveLength(0);
      expect(res.specKeys).toHaveLength(0);
    });

    it('returns products with merged spec keys', async () => {
      redis.get.mockResolvedValue(JSON.stringify([productId, prodId2]));
      productModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([
              mockProduct(productId),
              {
                ...mockProduct(prodId2),
                specs: [
                  { key: 'رم', value: '12GB' },
                  { key: 'باتری', value: '5000mAh' },
                ],
              },
            ]),
          }),
        }),
      });

      const res = await service.getCompare(userId);
      expect(res.products).toHaveLength(2);
      expect(res.specKeys).toContain('رم');
      expect(res.specKeys).toContain('حافظه');
      expect(res.specKeys).toContain('باتری');
    });
  });

  // ── removeFromCompare ─────────────────────────────────────────
  describe('removeFromCompare', () => {
    it('removes product from compare list', async () => {
      redis.get.mockResolvedValue(JSON.stringify([productId, prodId2]));

      const res = await service.removeFromCompare(userId, productId);
      expect(res.productIds).not.toContain(productId);
      expect(res.count).toBe(1);
    });
  });

  // ── clearCompare ──────────────────────────────────────────────
  describe('clearCompare', () => {
    it('deletes compare key from redis', async () => {
      await service.clearCompare(userId);
      expect(redis.del).toHaveBeenCalledWith(`compare:${userId}`);
    });
  });
});
