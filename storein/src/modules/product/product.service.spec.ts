import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ProductService } from './product.service';
import { Product, ProductStatus } from './entities/product.schema';
import { Category } from '../category/entities/category.schema';
import { Color } from '../color/entities/color.schema';
import { Brand } from '../brand/entities/brand.schema';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { DiscountsService } from '../../discounts/discounts.service';
import { UploadService } from '../upload/upload.service';

const mockLogger = {
  setContext: jest.fn().mockReturnThis(),
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

const mockUploadService = {
  deleteFile: jest.fn().mockResolvedValue(undefined),
};

const mockDiscountsService = {
  create: jest.fn(),
  calculateDiscountedPrice: jest.fn().mockResolvedValue({
    finalPrice: 0,
    discountAmount: 0,
    discountPercentage: 0,
    activeDiscount: null,
  }),
  getActiveDiscounts: jest.fn().mockResolvedValue([]),
  invalidateCache: jest.fn(),
};

const catId = new Types.ObjectId().toString();
const prodId = new Types.ObjectId().toString();
const varId = new Types.ObjectId();

// ── Typed fixtures ───────────────────────────────────────────────
interface ProductVariantLike {
  _id: Types.ObjectId;
  sku: string;
  price: number;
  comparePrice: number | null;
  stock: number;
  isActive: boolean;
  attributes: unknown[];
  images?: string[];
  costPrice?: number | null;
}

const mockVariant = (
  overrides: Partial<ProductVariantLike> = {},
): ProductVariantLike => ({
  _id: varId,
  sku: 'SKU-001',
  price: 10_000_000,
  comparePrice: null,
  stock: 5,
  isActive: true,
  attributes: [],
  ...overrides,
});

interface ProductLike {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  category: Types.ObjectId;
  status: ProductStatus | string;
  variants: ProductVariantLike[];
  minPrice: number;
  maxPrice: number;
  totalStock: number;
  images: string[];
  specs: unknown[];
  tags: unknown[];
}

interface ProductDocLike extends ProductLike {
  save: () => Promise<boolean>;
  toObject: () => ProductLike;
  markModified: (path: string) => void;
}

const mockProduct = (
  overrides: Partial<ProductDocLike> = {},
): ProductDocLike => ({
  _id: new Types.ObjectId(prodId),
  name: 'سامسونگ گلکسی A55',
  slug: 'samsung-galaxy-a55',
  category: new Types.ObjectId(catId),
  status: ProductStatus.ACTIVE,
  variants: [mockVariant()],
  minPrice: 10_000_000,
  maxPrice: 10_000_000,
  totalStock: 5,
  images: [],
  specs: [],
  tags: [],
  save: jest.fn().mockResolvedValue(true),
  toObject: jest.fn().mockReturnThis(),
  markModified: jest.fn(),
  ...overrides,
});

// ── Mongoose chain mock helpers (typed) ──────────────────────────
interface LeanChain<T> {
  lean: jest.Mock<Promise<T>, [unknown?]>;
}

interface SelectLeanChain<T> {
  select: jest.Mock<LeanChain<T>, [unknown?]>;
}

interface SkipLimitChain<T> {
  limit: jest.Mock<LeanChain<T>, [number?]>;
}

interface SortChain<T> {
  skip: jest.Mock<SkipLimitChain<T>, [number?]>;
}

interface SelectSortChain<T> {
  sort: jest.Mock<SortChain<T>, [unknown?]>;
  populate: jest.Mock<LeanChain<T>, [unknown?]>;
}

interface FindChain<T> {
  select: jest.Mock<SelectSortChain<T>, [unknown?]>;
}

interface ExecChainShape<T> {
  exec: jest.Mock<Promise<T>, []>;
}

const lean = <T>(v: T): LeanChain<T> => ({
  lean: jest.fn<Promise<T>, [unknown?]>().mockResolvedValue(v),
});

const selectLean = <T>(v: T): SelectLeanChain<T> => ({
  select: jest.fn<LeanChain<T>, [unknown?]>().mockReturnValue(lean(v)),
});

const execResolve = <T>(v: T): ExecChainShape<T> => ({
  exec: jest.fn<Promise<T>, []>().mockResolvedValue(v),
});

const findChain = <T>(v: T): FindChain<T> => {
  const leanResult = lean(v);
  const skipLimit: SkipLimitChain<T> = {
    limit: jest.fn<LeanChain<T>, [number?]>().mockReturnValue(leanResult),
  };
  const sortChain: SortChain<T> = {
    skip: jest.fn<SkipLimitChain<T>, [number?]>().mockReturnValue(skipLimit),
  };
  const selectSort: SelectSortChain<T> = {
    sort: jest.fn<SortChain<T>, [unknown?]>().mockReturnValue(sortChain),
    populate: jest.fn<LeanChain<T>, [unknown?]>().mockReturnValue(leanResult),
  };
  return {
    select: jest
      .fn<SelectSortChain<T>, [unknown?]>()
      .mockReturnValue(selectSort),
  };
};

type SlugCheckResult = { _id: Types.ObjectId } | null;

interface CreateVariantDocLike {
  sku?: string;
  price?: number;
  stock?: number;
  images?: string[];
  costPrice?: number;
}

interface CreateDocLike {
  name?: string;
  slug?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  totalStock?: number;
  variants: CreateVariantDocLike[];
}

interface MockProductModel {
  find: jest.Mock<
    FindChain<ProductLike[]> | ExecChainShape<ProductDocLike[]>,
    [unknown?]
  >;
  findOne: jest.Mock<LeanChain<SlugCheckResult>, [unknown?]>;
  findById: jest.Mock<
    | Promise<ProductDocLike | null>
    | SelectLeanChain<ProductDocLike | null>
    | LeanChain<ProductDocLike | null>,
    [string]
  >;
  findByIdAndUpdate: jest.Mock<SelectLeanChain<ProductLike>, unknown[]>;
  findByIdAndDelete: jest.Mock<Promise<null>, [string]>;
  countDocuments: jest.Mock<Promise<number>, [unknown?]>;
  create: jest.Mock<Promise<ProductDocLike>, [CreateDocLike]>;
}

describe('ProductService', () => {
  let service: ProductService;
  let model: MockProductModel;

  beforeEach(async () => {
    model = {
      find: jest.fn<
        FindChain<ProductLike[]> | ExecChainShape<ProductDocLike[]>,
        [unknown?]
      >(),
      findOne: jest.fn<LeanChain<SlugCheckResult>, [unknown?]>(),
      findById: jest.fn<
        | Promise<ProductDocLike | null>
        | SelectLeanChain<ProductDocLike | null>
        | LeanChain<ProductDocLike | null>,
        [string]
      >(),
      findByIdAndUpdate: jest.fn<SelectLeanChain<ProductLike>, unknown[]>(),
      findByIdAndDelete: jest.fn<Promise<null>, [string]>(),
      countDocuments: jest
        .fn<Promise<number>, [unknown?]>()
        .mockResolvedValue(0),
      create: jest.fn<Promise<ProductDocLike>, [CreateDocLike]>(),
    };
    model.find.mockReturnValue(findChain<ProductLike[]>([]));
    model.findOne.mockReturnValue(lean<SlugCheckResult>(null));

    const catModel = {
      findOne: jest.fn().mockReturnValue({
        select: jest
          .fn()
          .mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
      }),
      find: jest.fn().mockReturnValue({
        select: jest
          .fn()
          .mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }),
      }),
      distinct: jest.fn().mockResolvedValue([]),
    };
    const colorModel = {
      findOne: jest.fn().mockReturnValue({
        select: jest
          .fn()
          .mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
      }),
    };
    const brandModel = {
      find: jest.fn().mockReturnValue({
        sort: jest
          .fn()
          .mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        { provide: getModelToken(Product.name), useValue: model },
        { provide: getModelToken(Category.name), useValue: catModel },
        { provide: getModelToken(Color.name), useValue: colorModel },
        { provide: getModelToken(Brand.name), useValue: brandModel },
        { provide: AppLoggerService, useValue: mockLogger },
        { provide: DiscountsService, useValue: mockDiscountsService },
        { provide: UploadService, useValue: mockUploadService },
      ],
    }).compile();

    service = module.get(ProductService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates product and calculates denormalized fields', async () => {
      model.findOne.mockReturnValue(lean<SlugCheckResult>(null));
      model.create.mockResolvedValue({
        ...mockProduct(),
        toObject: () => mockProduct(),
      });

      await service.create({
        name: 'سامسونگ گلکسی A55',
        category: catId,
        variants: [{ sku: 'SKU-001', price: 10_000_000, stock: 5 }],
      });

      expect(model.create).toHaveBeenCalledWith(
        expect.objectContaining({ minPrice: 10_000_000, totalStock: 5 }),
      );
    });
  });

  describe('addVariant', () => {
    it('adds variant and updates denormalized fields', async () => {
      const prod = mockProduct({ variants: [] });
      model.findById.mockResolvedValue(prod);

      await service.addVariant(prodId, {
        sku: 'SKU-002',
        price: 12_000_000,
        stock: 3,
      });

      expect(prod.variants.length).toBe(1);
      expect(prod.save).toHaveBeenCalled();
    });

    it('throws on duplicate SKU', async () => {
      const prod = mockProduct();
      model.findById.mockResolvedValue(prod);

      await expect(
        service.addVariant(prodId, { sku: 'SKU-001', price: 1000, stock: 1 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('adjustStock', () => {
    it('increases stock', async () => {
      const prod = mockProduct();
      model.findById.mockResolvedValue(prod);

      await service.adjustStock(prodId, varId.toString(), 10);
      expect(prod.variants[0].stock).toBe(15);
    });

    it('throws when stock goes negative', async () => {
      const prod = mockProduct();
      model.findById.mockResolvedValue(prod);

      await expect(
        service.adjustStock(prodId, varId.toString(), -100),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('removeVariant', () => {
    it('removes variant and recalculates denormalized', async () => {
      const prod = mockProduct();
      model.findById.mockResolvedValue(prod);

      await service.removeVariant(prodId, varId.toString());
      expect(prod.variants.length).toBe(0);
      expect(prod.totalStock).toBe(0);
    });
  });

  describe('remove', () => {
    const removeSelectLean = (v: ProductDocLike | null) =>
      selectLean<ProductDocLike | null>(v);

    it('throws NotFoundException when product not found', async () => {
      model.findById.mockReturnValue(removeSelectLean(null));
      await expect(service.remove(prodId)).rejects.toThrow(NotFoundException);
      expect(model.findByIdAndDelete).not.toHaveBeenCalled();
    });

    it('throws BadRequestException for invalid id', async () => {
      await expect(service.remove('not-valid-id')).rejects.toThrow(
        BadRequestException,
      );
      expect(model.findById).not.toHaveBeenCalled();
    });

    it('deletes product from DB when found', async () => {
      model.findById.mockReturnValue(
        removeSelectLean(mockProduct({ images: [] })),
      );
      model.findByIdAndDelete.mockResolvedValue(null);

      await service.remove(prodId);

      expect(model.findByIdAndDelete).toHaveBeenCalledWith(prodId);
    });

    it('calls deleteFile for each image URL', async () => {
      const images = [
        '/uploads/products/img1.webp',
        '/uploads/products/img2.webp',
      ];
      model.findById.mockReturnValue(removeSelectLean(mockProduct({ images })));
      model.findByIdAndDelete.mockResolvedValue(null);

      await service.remove(prodId);

      // Give fire-and-forget microtasks a tick to run
      await Promise.resolve();

      expect(mockUploadService.deleteFile).toHaveBeenCalledTimes(2);
      expect(mockUploadService.deleteFile).toHaveBeenCalledWith(
        'products/img1.webp',
      );
      expect(mockUploadService.deleteFile).toHaveBeenCalledWith(
        'products/img2.webp',
      );
    });

    it('skips deleteFile when product has no images', async () => {
      model.findById.mockReturnValue(
        removeSelectLean(mockProduct({ images: [] })),
      );
      model.findByIdAndDelete.mockResolvedValue(null);

      await service.remove(prodId);
      await Promise.resolve();

      expect(mockUploadService.deleteFile).not.toHaveBeenCalled();
    });

    it('logs warn and continues when deleteFile rejects (fire-and-forget)', async () => {
      model.findById.mockReturnValue(
        removeSelectLean(
          mockProduct({ images: ['/uploads/products/bad.webp'] }),
        ),
      );
      model.findByIdAndDelete.mockResolvedValue(null);
      mockUploadService.deleteFile.mockRejectedValueOnce(
        new Error('disk full'),
      );

      await service.remove(prodId);
      await Promise.resolve();

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Failed to delete product image',
        expect.objectContaining({
          key: 'products/bad.webp',
          error: 'disk full',
        }),
      );
    });

    it('ignores image URLs that are not under /uploads/', async () => {
      const images = [
        'https://external.cdn.com/img.jpg',
        '/uploads/products/local.webp',
      ];
      model.findById.mockReturnValue(removeSelectLean(mockProduct({ images })));
      model.findByIdAndDelete.mockResolvedValue(null);

      await service.remove(prodId);
      await Promise.resolve();

      // Only the local /uploads/ image should trigger a deleteFile call
      expect(mockUploadService.deleteFile).toHaveBeenCalledTimes(1);
      expect(mockUploadService.deleteFile).toHaveBeenCalledWith(
        'products/local.webp',
      );
    });

    it('logs product removal', async () => {
      model.findById.mockReturnValue(
        removeSelectLean(mockProduct({ images: [] })),
      );
      model.findByIdAndDelete.mockResolvedValue(null);

      await service.remove(prodId);

      expect(mockLogger.log).toHaveBeenCalledWith(
        'Product removed',
        expect.objectContaining({ productId: prodId }),
      );
    });
  });

  describe('update', () => {
    it('updates product and returns updated doc', async () => {
      const existing = mockProduct();
      const updated = mockProduct({ name: 'سامسونگ A55 جدید' });
      model.findById.mockResolvedValue(existing);
      model.findByIdAndUpdate.mockReturnValue(selectLean<ProductLike>(updated));

      const result = await service.update(prodId, { name: 'سامسونگ A55 جدید' });
      expect(result.name).toBe('سامسونگ A55 جدید');
    });

    it('throws NotFoundException when product not found', async () => {
      model.findById.mockResolvedValue(null);
      await expect(service.update(prodId, { name: 'x' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateVariant', () => {
    it('updates variant fields', async () => {
      const prod = mockProduct();
      model.findById.mockResolvedValue(prod);

      await service.updateVariant(prodId, varId.toString(), {
        price: 15_000_000,
      });

      expect(prod.variants[0].price).toBe(15_000_000);
      expect(prod.save).toHaveBeenCalled();
    });

    it('throws on duplicate SKU when updating', async () => {
      const varId2 = new Types.ObjectId();
      const prod = mockProduct({
        variants: [
          mockVariant({ _id: varId, sku: 'SKU-001' }),
          mockVariant({ _id: varId2, sku: 'SKU-002' }),
        ],
      });
      model.findById.mockResolvedValue(prod);

      await expect(
        service.updateVariant(prodId, varId.toString(), { sku: 'SKU-002' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('bulkDiscount', () => {
    it('applies discount from original price and saves with markModified', async () => {
      const prod = mockProduct({
        variants: [mockVariant({ price: 10_000_000, comparePrice: 0 })],
        markModified: jest.fn(),
      });
      model.find.mockReturnValue(execResolve<ProductDocLike[]>([prod]));

      const result = await service.bulkDiscount({
        productIds: [prodId],
        discountPct: 20,
      });

      expect(result.updated).toBe(1);
      expect(prod.variants[0].comparePrice).toBe(10_000_000);
      expect(prod.variants[0].price).toBe(8_000_000);
      expect(prod.markModified).toHaveBeenCalledWith('variants');
      expect(prod.save).toHaveBeenCalled();
    });

    it('always discounts from the original comparePrice, not the already-discounted price', async () => {
      // Product had 25% discount before (comparePrice=10M, price=7.5M)
      // Applying 19% should give 19% off 10M = 8.1M, NOT 19% off 7.5M
      const prod = mockProduct({
        variants: [mockVariant({ price: 7_500_000, comparePrice: 10_000_000 })],
        markModified: jest.fn(),
      });
      model.find.mockReturnValue(execResolve<ProductDocLike[]>([prod]));

      await service.bulkDiscount({ productIds: [prodId], discountPct: 19 });

      expect(prod.variants[0].comparePrice).toBe(10_000_000);
      expect(prod.variants[0].price).toBe(8_100_000); // 10M * 0.81
    });

    it('applies same discount across multiple variants correctly', async () => {
      const prod = mockProduct({
        variants: [
          mockVariant({
            _id: new Types.ObjectId(),
            sku: 'A',
            price: 5_000_000,
            comparePrice: 0,
          }),
          mockVariant({
            _id: new Types.ObjectId(),
            sku: 'B',
            price: 8_000_000,
            comparePrice: 0,
          }),
        ],
        markModified: jest.fn(),
      });
      model.find.mockReturnValue(execResolve<ProductDocLike[]>([prod]));

      await service.bulkDiscount({ productIds: [prodId], discountPct: 10 });

      expect(prod.variants[0].price).toBe(4_500_000);
      expect(prod.variants[0].comparePrice).toBe(5_000_000);
      expect(prod.variants[1].price).toBe(7_200_000);
      expect(prod.variants[1].comparePrice).toBe(8_000_000);
    });

    it('restores original price and clears comparePrice when discountPct is 0', async () => {
      const prod = mockProduct({
        variants: [mockVariant({ price: 8_000_000, comparePrice: 10_000_000 })],
        markModified: jest.fn(),
      });
      model.find.mockReturnValue(execResolve<ProductDocLike[]>([prod]));

      await service.bulkDiscount({ productIds: [prodId], discountPct: 0 });

      expect(prod.variants[0].price).toBe(10_000_000);
      expect(prod.variants[0].comparePrice).toBe(0);
      expect(prod.markModified).toHaveBeenCalledWith('variants');
    });

    it('does not change variant price when discountPct is 0 and no comparePrice exists', async () => {
      const prod = mockProduct({
        variants: [mockVariant({ price: 5_000_000, comparePrice: 0 })],
        markModified: jest.fn(),
      });
      model.find.mockReturnValue(execResolve<ProductDocLike[]>([prod]));

      await service.bulkDiscount({ productIds: [prodId], discountPct: 0 });

      expect(prod.variants[0].price).toBe(5_000_000);
      expect(prod.variants[0].comparePrice).toBe(0);
    });

    it('updates multiple products and returns correct updated count', async () => {
      const prod1 = mockProduct({
        variants: [mockVariant({ price: 1_000_000, comparePrice: 0 })],
        markModified: jest.fn(),
      });
      const prod2 = mockProduct({
        _id: new Types.ObjectId(),
        variants: [mockVariant({ price: 2_000_000, comparePrice: 0 })],
        save: jest.fn().mockResolvedValue(true),
        markModified: jest.fn(),
      });
      model.find.mockReturnValue(execResolve<ProductDocLike[]>([prod1, prod2]));

      const result = await service.bulkDiscount({
        productIds: [prodId, prod2._id.toString()],
        discountPct: 30,
      });

      expect(result.updated).toBe(2);
      expect(prod1.save).toHaveBeenCalled();
      expect(prod2.save).toHaveBeenCalled();
    });

    it('clamps discountPct to 90 maximum', async () => {
      const prod = mockProduct({
        variants: [mockVariant({ price: 10_000_000, comparePrice: 0 })],
        markModified: jest.fn(),
      });
      model.find.mockReturnValue(execResolve<ProductDocLike[]>([prod]));

      await service.bulkDiscount({ productIds: [prodId], discountPct: 99 });

      // 90% of 10M = 1M
      expect(prod.variants[0].price).toBe(1_000_000);
      expect(prod.variants[0].comparePrice).toBe(10_000_000);
    });

    it('logs warn when removing discount (pct=0) and logs done after completion', async () => {
      const prod = mockProduct({
        variants: [mockVariant({ price: 8_000_000, comparePrice: 10_000_000 })],
        markModified: jest.fn(),
      });
      model.find.mockReturnValue(execResolve<ProductDocLike[]>([prod]));

      await service.bulkDiscount({ productIds: [prodId], discountPct: 0 });

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'BulkDiscount: removing discount',
        expect.any(Object),
      );
      expect(mockLogger.log).toHaveBeenCalledWith(
        'BulkDiscount: done',
        expect.objectContaining({ updated: 1, pct: 0 }),
      );
    });
  });

  describe('bulkDiscount — timed mode', () => {
    const startDate = '2026-07-01T00:00:00.000Z';
    const endDate = '2026-07-15T23:59:59.000Z';

    beforeEach(() => jest.clearAllMocks());

    it('delegates to DiscountsService when startDate+endDate provided', async () => {
      mockDiscountsService.create.mockResolvedValue({
        _id: new Types.ObjectId(),
      });

      const result = await service.bulkDiscount({
        productIds: [prodId],
        discountPct: 25,
        startDate,
        endDate,
      });

      expect(mockDiscountsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          discountType: 'percentage',
          value: 25,
          targetType: 'products',
          targetIds: [prodId],
          startDate,
          endDate,
        }),
      );
      expect(result).toEqual({ updated: 1, mode: 'timed' });
    });

    it('does not query or modify products in timed mode', async () => {
      mockDiscountsService.create.mockResolvedValue({
        _id: new Types.ObjectId(),
      });

      await service.bulkDiscount({
        productIds: [prodId],
        discountPct: 20,
        startDate,
        endDate,
      });

      expect(model.find).not.toHaveBeenCalled();
    });

    it('uses custom title when provided', async () => {
      mockDiscountsService.create.mockResolvedValue({
        _id: new Types.ObjectId(),
      });

      await service.bulkDiscount({
        productIds: [prodId],
        discountPct: 30,
        startDate,
        endDate,
        title: 'فروش ویژه تابستان',
      });

      expect(mockDiscountsService.create).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'فروش ویژه تابستان' }),
      );
    });

    it('auto-generates title from pct when title is not provided', async () => {
      mockDiscountsService.create.mockResolvedValue({
        _id: new Types.ObjectId(),
      });

      await service.bulkDiscount({
        productIds: [prodId],
        discountPct: 15,
        startDate,
        endDate,
      });

      expect(mockDiscountsService.create).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'تخفیف گروهی 15٪' }),
      );
    });

    it('throws BadRequestException when endDate is before startDate', async () => {
      await expect(
        service.bulkDiscount({
          productIds: [prodId],
          discountPct: 10,
          startDate: '2026-07-15T00:00:00.000Z',
          endDate: '2026-07-01T00:00:00.000Z',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockDiscountsService.create).not.toHaveBeenCalled();
    });

    it('falls back to permanent mode when only startDate is given (no endDate)', async () => {
      const prod = mockProduct({
        variants: [mockVariant()],
        markModified: jest.fn(),
      });
      model.find.mockReturnValue(execResolve<ProductDocLike[]>([prod]));

      const result = await service.bulkDiscount({
        productIds: [prodId],
        discountPct: 10,
        startDate,
      });

      expect(mockDiscountsService.create).not.toHaveBeenCalled();
      expect(result.mode).toBe('permanent');
    });
  });

  describe('adjustStock — low stock warn', () => {
    it('emits warn log when stock drops to ≤5', async () => {
      const prod = mockProduct({
        variants: [mockVariant({ stock: 7 })],
      });
      model.findById.mockResolvedValue(prod);

      await service.adjustStock(prodId, varId.toString(), -4);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Low stock',
        expect.objectContaining({ stock: 3 }),
      );
    });
  });

  describe('findAll — sort', () => {
    it('sorts by viewCount desc when sort=mostViewed', async () => {
      await service.findAll({ sort: 'mostViewed' });
      const sortCall = (model.find() as FindChain<ProductLike[]>).select().sort
        .mock.calls[0][0];
      expect(sortCall).toEqual({ viewCount: -1, createdAt: -1 });
    });

    it('defaults to newest sort when no sort param', async () => {
      await service.findAll({});
      const sortCall = (model.find() as FindChain<ProductLike[]>).select().sort
        .mock.calls[0][0];
      expect(sortCall).toEqual({ createdAt: -1 });
    });

    it('sorts by soldCount when sort=bestseller', async () => {
      await service.findAll({ sort: 'bestseller' });
      const sortCall = (model.find() as FindChain<ProductLike[]>).select().sort
        .mock.calls[0][0];
      expect(sortCall).toEqual({ soldCount: -1 });
    });
  });

  describe('variant images', () => {
    it('passes variant images through to the model on create', async () => {
      const variantImages = [
        'https://cdn.example.com/v1.jpg',
        'https://cdn.example.com/v2.jpg',
      ];
      model.findOne.mockReturnValue(lean<SlugCheckResult>(null));
      model.create.mockResolvedValue({
        ...mockProduct({ variants: [mockVariant({ images: variantImages })] }),
        toObject: () =>
          mockProduct({ variants: [mockVariant({ images: variantImages })] }),
      });

      await service.create({
        name: 'محصول با عکس تنوع',
        category: catId,
        variants: [
          {
            sku: 'SKU-001',
            price: 10_000_000,
            stock: 5,
            images: variantImages,
          },
        ],
      });

      expect(model.create).toHaveBeenCalledWith(
        expect.objectContaining({
          variants: expect.arrayContaining([
            expect.objectContaining({ images: variantImages }),
          ]) as unknown,
        }),
      );
    });

    it('stores variant images on addVariant', async () => {
      const prod = mockProduct({ variants: [] });
      model.findById.mockResolvedValue(prod);
      const variantImages = ['https://cdn.example.com/v-img.jpg'];

      await service.addVariant(prodId, {
        sku: 'SKU-IMG',
        price: 10_000_000,
        stock: 2,
        images: variantImages,
      });

      expect(prod.variants[0]).toMatchObject({ images: variantImages });
      expect(prod.save).toHaveBeenCalled();
    });

    it('defaults to empty array when variant has no images', async () => {
      model.findOne.mockReturnValue(lean<SlugCheckResult>(null));
      model.create.mockResolvedValue({
        ...mockProduct(),
        toObject: () => mockProduct(),
      });

      await service.create({
        name: 'محصول بدون عکس تنوع',
        category: catId,
        variants: [{ sku: 'SKU-001', price: 10_000_000, stock: 5 }],
      });

      // images field absent from DTO → no images key passed to model.create
      const createCall = model.create.mock.calls[0][0];
      const variant = createCall.variants?.[0];
      expect(variant?.images).toBeUndefined();
    });
  });

  describe('costPrice', () => {
    it('persists costPrice through create', async () => {
      model.findOne.mockReturnValue(lean<SlugCheckResult>(null));
      model.create.mockResolvedValue({
        ...mockProduct({ variants: [mockVariant({ costPrice: 8_000_000 })] }),
        toObject: () =>
          mockProduct({ variants: [mockVariant({ costPrice: 8_000_000 })] }),
      });

      await service.create({
        name: 'محصول با قیمت خرید',
        category: catId,
        variants: [
          { sku: 'SKU-001', price: 10_000_000, stock: 5, costPrice: 8_000_000 },
        ],
      });

      expect(model.create).toHaveBeenCalledWith(
        expect.objectContaining({
          variants: expect.arrayContaining([
            expect.objectContaining({ costPrice: 8_000_000 }),
          ]) as unknown,
        }),
      );
    });

    it('persists costPrice through addVariant', async () => {
      const prod = mockProduct({ variants: [] });
      model.findById.mockResolvedValue(prod);

      await service.addVariant(prodId, {
        sku: 'SKU-002',
        price: 12_000_000,
        stock: 3,
        costPrice: 9_000_000,
      });

      expect(prod.variants[0]).toMatchObject({ costPrice: 9_000_000 });
    });

    it('copies costPrice in duplicate', async () => {
      const src = mockProduct({
        slug: 'test-product',
        variants: [mockVariant({ sku: 'SKU-123', costPrice: 7_500_000 })],
      });
      model.findById.mockReturnValue(lean<ProductDocLike | null>(src));
      model.findOne.mockReturnValue(lean<SlugCheckResult>(null));
      model.create.mockResolvedValue({
        ...src,
        _id: new Types.ObjectId(),
        toObject: () => src,
      });

      await service.duplicate(prodId);

      const createArg = model.create.mock.calls[0][0];
      expect(createArg.variants[0].costPrice).toBe(7_500_000);
    });

    it('allows null costPrice (field is optional)', async () => {
      model.findOne.mockReturnValue(lean<SlugCheckResult>(null));
      model.create.mockResolvedValue({
        ...mockProduct(),
        toObject: () => mockProduct(),
      });

      await service.create({
        name: 'محصول بدون قیمت خرید',
        category: catId,
        variants: [{ sku: 'SKU-001', price: 10_000_000, stock: 5 }],
      });

      const createArg = model.create.mock.calls[0][0];
      expect(createArg.variants?.[0]?.costPrice).toBeUndefined();
    });
  });

  describe('duplicate', () => {
    it('uses original slug (no -copy suffix) when no collision', async () => {
      const src = mockProduct({
        slug: 'rayban-aviator',
        variants: [mockVariant()],
      });
      model.findById.mockReturnValue(lean<ProductDocLike | null>(src));
      // uniqueSlug: first findOne returns null → no collision
      model.findOne.mockReturnValue(lean<SlugCheckResult>(null));
      model.create.mockResolvedValue({
        ...src,
        _id: new Types.ObjectId(),
        toObject: () => src,
      });

      await service.duplicate(prodId);

      const createArg = model.create.mock.calls[0][0];
      expect(createArg.slug).toBe('rayban-aviator');
    });

    it('appends -1 when original slug is taken', async () => {
      const src = mockProduct({
        slug: 'rayban-aviator',
        variants: [mockVariant()],
      });
      model.findById.mockReturnValue(lean<ProductDocLike | null>(src));
      // first findOne (slug='rayban-aviator') → collision, second (slug='rayban-aviator-1') → free
      model.findOne
        .mockReturnValueOnce(
          lean<SlugCheckResult>({ _id: new Types.ObjectId() }),
        )
        .mockReturnValue(lean<SlugCheckResult>(null));
      model.create.mockResolvedValue({
        ...src,
        _id: new Types.ObjectId(),
        toObject: () => src,
      });

      await service.duplicate(prodId);

      const createArg = model.create.mock.calls[0][0];
      expect(createArg.slug).toBe('rayban-aviator-1');
    });

    it('sets status to draft and clears variant SKUs', async () => {
      const src = mockProduct({
        slug: 'rayban-aviator',
        variants: [mockVariant({ sku: 'SKU-123' })],
      });
      model.findById.mockReturnValue(lean<ProductDocLike | null>(src));
      model.findOne.mockReturnValue(lean<SlugCheckResult>(null));
      model.create.mockResolvedValue({
        ...src,
        _id: new Types.ObjectId(),
        toObject: () => src,
      });

      await service.duplicate(prodId);

      const createArg = model.create.mock.calls[0][0];
      expect(createArg.status).toBe('draft');
      expect(createArg.variants[0].sku).toBe('');
    });

    it('throws NotFoundException for unknown id', async () => {
      model.findById.mockReturnValue(lean<ProductDocLike | null>(null));
      await expect(service.duplicate(prodId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
