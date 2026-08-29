import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { SortOrder } from 'mongoose';
import { SearchService } from './search.service';
import { Product } from '../product/entities/product.schema';
import { Category } from '../category/entities/category.schema';
import { REDIS_CLIENT } from '../../redis/redis.module';
import { AppLoggerService } from '../../common/logger/app-logger.service';

const mockLogger = {
  setContext: jest.fn().mockReturnThis(),
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

const userId = 'user_123';

// ── Mock query-chain typing ──────────────────────────────────────
// Mirrors the Mongoose query chains SearchService actually calls:
//   find(...).select(...).sort(...).skip(...).limit(...).populate(...).lean()
//   find(...).select(...).limit(...).lean()
//   find(...).select(...).lean()

interface SearchLeanDoc {
  _id?: unknown;
  name?: string;
  slug?: string;
}

interface FacetAggResult {
  priceRange: { min: number; max: number }[];
  attributeValues: { key: string; values: string[] }[];
}

interface SearchFilterArg {
  status?: string;
  $or?: unknown[];
  $text?: { $search: string };
  totalStock?: { $gt: number };
  category?: { $in: unknown[] };
  'variants.attributes'?: { $all: unknown[] };
  minPrice?: { $gte?: number; $lte?: number };
  name?: RegExp;
  isActive?: boolean;
}

interface LeanStage<T> {
  lean: jest.Mock<Promise<T>, []>;
}

interface PopulateStage<T> {
  populate: jest.Mock<LeanStage<T>, [string, string?]>;
}

interface LimitAfterSkipStage<T> {
  limit: jest.Mock<PopulateStage<T>, [number]>;
}

interface SkipStage<T> {
  skip: jest.Mock<LimitAfterSkipStage<T>, [number]>;
}

interface SortStage<T> {
  sort: jest.Mock<SkipStage<T>, [Record<string, SortOrder>?]>;
}

interface LimitDirectStage<T> {
  limit: jest.Mock<LeanStage<T>, [number]>;
}

type SelectStage<T> = SortStage<T> & LimitDirectStage<T> & LeanStage<T>;

interface FindStage<T> {
  select: jest.Mock<SelectStage<T>, [(Record<string, unknown> | string)?]>;
}

interface MockProductModel {
  find: jest.Mock<
    FindStage<SearchLeanDoc[]>,
    [SearchFilterArg?, Record<string, unknown>?]
  >;
  countDocuments: jest.Mock<Promise<number>, [SearchFilterArg?]>;
  aggregate: jest.Mock<Promise<FacetAggResult[]>, [unknown[]?]>;
}

interface MockCategoryModel {
  find: jest.Mock<FindStage<SearchLeanDoc[]>, [SearchFilterArg?]>;
}

interface MockRedis {
  get: jest.Mock<Promise<string | null>, [string]>;
  setex: jest.Mock<Promise<unknown>, [string, number, string]>;
  lrange: jest.Mock<Promise<string[]>, [string, number, number]>;
  lpush: jest.Mock<Promise<unknown>, [string, string]>;
  lrem: jest.Mock<Promise<unknown>, [string, number, string]>;
  ltrim: jest.Mock<Promise<unknown>, [string, number, number]>;
  expire: jest.Mock<Promise<unknown>, [string, number]>;
  del: jest.Mock<Promise<unknown>, [string]>;
}

describe('SearchService', () => {
  let service: SearchService;
  let redis: MockRedis;
  let productModel: MockProductModel;
  let categoryModel: MockCategoryModel;

  const leanChain = (val: SearchLeanDoc[]): FindStage<SearchLeanDoc[]> => ({
    select: jest
      .fn<SelectStage<SearchLeanDoc[]>, [(Record<string, unknown> | string)?]>()
      .mockReturnValue({
        sort: jest
          .fn<SkipStage<SearchLeanDoc[]>, [Record<string, SortOrder>?]>()
          .mockReturnValue({
            skip: jest
              .fn<LimitAfterSkipStage<SearchLeanDoc[]>, [number]>()
              .mockReturnValue({
                limit: jest
                  .fn<PopulateStage<SearchLeanDoc[]>, [number]>()
                  .mockReturnValue({
                    populate: jest
                      .fn<LeanStage<SearchLeanDoc[]>, [string, string?]>()
                      .mockReturnValue({
                        lean: jest
                          .fn<Promise<SearchLeanDoc[]>, []>()
                          .mockResolvedValue(val),
                      }),
                  }),
              }),
          }),
        limit: jest.fn<LeanStage<SearchLeanDoc[]>, [number]>().mockReturnValue({
          lean: jest.fn<Promise<SearchLeanDoc[]>, []>().mockResolvedValue(val),
        }),
        lean: jest.fn<Promise<SearchLeanDoc[]>, []>().mockResolvedValue(val),
      }),
  });

  beforeEach(async () => {
    redis = {
      get: jest.fn<Promise<string | null>, [string]>().mockResolvedValue(null),
      setex: jest.fn<Promise<unknown>, [string, number, string]>(),
      lrange: jest
        .fn<Promise<string[]>, [string, number, number]>()
        .mockResolvedValue([]),
      lpush: jest.fn<Promise<unknown>, [string, string]>(),
      lrem: jest.fn<Promise<unknown>, [string, number, string]>(),
      ltrim: jest.fn<Promise<unknown>, [string, number, number]>(),
      expire: jest.fn<Promise<unknown>, [string, number]>(),
      del: jest.fn<Promise<unknown>, [string]>(),
    };

    productModel = {
      find: jest
        .fn<
          FindStage<SearchLeanDoc[]>,
          [SearchFilterArg?, Record<string, unknown>?]
        >()
        .mockReturnValue(leanChain([])),
      countDocuments: jest
        .fn<Promise<number>, [SearchFilterArg?]>()
        .mockResolvedValue(0),
      aggregate: jest
        .fn<Promise<FacetAggResult[]>, [unknown[]?]>()
        .mockResolvedValue([{ priceRange: [], attributeValues: [] }]),
    };

    categoryModel = {
      find: jest
        .fn<FindStage<SearchLeanDoc[]>, [SearchFilterArg?]>()
        .mockReturnValue(leanChain([])),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: getModelToken(Product.name), useValue: productModel },
        { provide: getModelToken(Category.name), useValue: categoryModel },
        { provide: REDIS_CLIENT, useValue: redis },
        { provide: AppLoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get(SearchService);
    jest.clearAllMocks();
  });

  describe('search', () => {
    it('returns paginated results with facets', async () => {
      const res = await service.search({ q: 'سامسونگ', page: 1, limit: 10 });
      expect(res).toHaveProperty('products');
      expect(res).toHaveProperty('facets');
      expect(res).toHaveProperty('total');
      expect(productModel.find).toHaveBeenCalled();
    });

    it('adds text match when q is provided', async () => {
      await service.search({ q: 'سامسونگ' });
      const callArg = productModel.find.mock.calls[0][0] as SearchFilterArg;
      expect(callArg.$text).toEqual({ $search: 'سامسونگ' });
    });

    it('filters by inStock', async () => {
      await service.search({ inStock: true });
      const callArg = productModel.find.mock.calls[0][0] as SearchFilterArg;
      expect(callArg.totalStock).toEqual({ $gt: 0 });
    });

    it('parses attrs filter correctly', async () => {
      await service.search({ attrs: 'رنگ:مشکی,حافظه:128GB' });
      const callArg = productModel.find.mock.calls[0][0] as SearchFilterArg;
      expect(callArg['variants.attributes']!.$all).toHaveLength(2);
    });

    it('sorts by viewCount descending when sort=mostViewed', async () => {
      await service.search({ sort: 'mostViewed' });
      const sortCall = productModel.find().select().sort.mock.calls[0][0];
      expect(sortCall).toEqual({ viewCount: -1, createdAt: -1 });
    });

    it('logs the search call with sort info', async () => {
      await service.search({ q: 'عینک', sort: 'mostViewed' });
      expect(mockLogger.log).toHaveBeenCalledWith(
        'search',
        expect.objectContaining({ sort: 'mostViewed' }),
      );
    });
  });

  describe('suggest', () => {
    it('returns cached result from Redis without hitting DB', async () => {
      const cached = {
        products: [{ name: 'سامسونگ A55', slug: 'samsung-a55' }],
        categories: [],
      };
      redis.get.mockResolvedValue(JSON.stringify(cached));
      const res = await service.suggest('سامسونگ');
      expect(res).toEqual(cached);
      expect(productModel.find).not.toHaveBeenCalled();
    });

    it('queries DB on cache miss, returns { products, categories } and caches result', async () => {
      redis.get.mockResolvedValue(null);
      productModel.find.mockReturnValue(
        leanChain([{ name: 'سامسونگ A55', slug: 'samsung-a55' }]),
      );
      categoryModel.find.mockReturnValue(
        leanChain([{ name: 'موبایل', slug: 'mobile' }]),
      );

      const res = await service.suggest('سامسونگ');
      expect(res.products).toEqual([
        { name: 'سامسونگ A55', slug: 'samsung-a55' },
      ]);
      expect(res.categories).toEqual([{ name: 'موبایل', slug: 'mobile' }]);
      expect(redis.setex).toHaveBeenCalled();
    });

    it('uses v2 cache key to avoid collisions with old string[] cache', async () => {
      redis.get.mockResolvedValue(null);
      await service.suggest('test');
      const cacheKey = redis.get.mock.calls[0][0];
      expect(cacheKey).toContain('v2');
    });

    it('returns empty products and categories when DB has no matches', async () => {
      redis.get.mockResolvedValue(null);
      const res = await service.suggest('xyz_no_match');
      expect(res.products).toEqual([]);
      expect(res.categories).toEqual([]);
    });

    it('falls back to DB when Redis get throws — search still works', async () => {
      redis.get.mockRejectedValue(new Error('Redis connection refused'));
      productModel.find.mockReturnValue(
        leanChain([{ name: 'عینک آفتابی', slug: 'sunglasses' }]),
      );
      categoryModel.find.mockReturnValue(leanChain([]));

      const res = await service.suggest('عینک');
      expect(res.products).toEqual([
        { name: 'عینک آفتابی', slug: 'sunglasses' },
      ]);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Redis get failed'),
      );
    });

    it('returns results even when Redis setex throws', async () => {
      redis.get.mockResolvedValue(null);
      redis.setex.mockRejectedValue(new Error('Redis write error'));
      productModel.find.mockReturnValue(
        leanChain([{ name: 'لنز', slug: 'lens' }]),
      );
      categoryModel.find.mockReturnValue(leanChain([]));

      const res = await service.suggest('لنز');
      expect(res.products).toEqual([{ name: 'لنز', slug: 'lens' }]);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Redis setex failed'),
      );
    });

    it('returns empty immediately for empty query without hitting DB or Redis', async () => {
      const res = await service.suggest('');
      expect(res).toEqual({ products: [], categories: [] });
      expect(redis.get).not.toHaveBeenCalled();
      expect(productModel.find).not.toHaveBeenCalled();
    });

    it('escapes regex special characters in query', async () => {
      redis.get.mockResolvedValue(null);
      await service.suggest('a+b');
      const callArg = productModel.find.mock.calls[0][0] as SearchFilterArg;
      const regexArg = callArg.name as RegExp;
      expect(regexArg.source).toBe('a\\+b');
    });
  });

  describe('search history', () => {
    it('saves to Redis list and deduplicates', async () => {
      await service.saveHistory(userId, 'سامسونگ');
      expect(redis.lrem).toHaveBeenCalledWith(
        HISTORY_KEY_TEST(userId),
        0,
        'سامسونگ',
      );
      expect(redis.lpush).toHaveBeenCalledWith(
        HISTORY_KEY_TEST(userId),
        'سامسونگ',
      );
    });

    it('returns history list', async () => {
      redis.lrange.mockResolvedValue(['سامسونگ', 'آیفون']);
      const res = await service.getHistory(userId);
      expect(res).toEqual(['سامسونگ', 'آیفون']);
    });

    it('clears history', async () => {
      await service.clearHistory(userId);
      expect(redis.del).toHaveBeenCalled();
    });
  });
});

function HISTORY_KEY_TEST(uid: string) {
  return `search:history:${uid}`;
}
