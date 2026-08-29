import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { CategoryService } from './category.service';
import { Category } from './entities/category.schema';
import { Product } from '../product/entities/product.schema';

const mockId = new Types.ObjectId().toString();
const mockCat = (overrides: Record<string, any> = {}) => ({
  _id: new Types.ObjectId(mockId),
  name: 'موبایل',
  slug: 'mobile',
  parent: null as Types.ObjectId | null,
  ancestors: [] as Types.ObjectId[],
  depth: 0,
  isActive: true,
  sortOrder: 0,
  ...overrides,
});

type CategoryLike = ReturnType<typeof mockCat>;
type CreatedCategory = CategoryLike & { toObject: () => CategoryLike };

// ── Chainable Mongoose-query mock shapes ────────────────────────────────────
interface LeanOnly<T> {
  lean: jest.Mock<Promise<T>, []>;
}
interface SelectThenLean<T> {
  select: jest.Mock<LeanOnly<T>, [string]>;
}
interface SortThenLean<T> {
  sort: jest.Mock<LeanOnly<T>, [Record<string, number>]>;
}
interface SelectThenSortThenLean<T> {
  select: jest.Mock<SortThenLean<T>, [string]>;
}

interface ProductAggResult {
  _id: string;
  totalStock: number;
  productsCount: number;
}

interface MockCategoryModel {
  find: jest.Mock<SelectThenSortThenLean<CategoryLike[]>, unknown[]>;
  findOne: jest.Mock<
    LeanOnly<CategoryLike | null> | SelectThenLean<CategoryLike | null>,
    unknown[]
  >;
  findById: jest.Mock<
    LeanOnly<CategoryLike | null> | Promise<CategoryLike>,
    unknown[]
  >;
  findByIdAndUpdate: jest.Mock<SelectThenLean<CategoryLike>, unknown[]>;
  findByIdAndDelete: jest.Mock<Promise<CategoryLike | null>, unknown[]>;
  exists: jest.Mock<Promise<boolean>, unknown[]>;
  create: jest.Mock<Promise<CreatedCategory>, unknown[]>;
}

interface MockProductModel {
  aggregate: jest.Mock<Promise<ProductAggResult[]>, unknown[]>;
}

describe('CategoryService', () => {
  let service: CategoryService;
  let model: MockCategoryModel;
  let productModel: MockProductModel;

  const lean = <T>(val: T): LeanOnly<T> => ({
    lean: jest.fn<Promise<T>, []>().mockResolvedValue(val),
  });
  const selectLean = <T>(val: T): SelectThenLean<T> => ({
    select: jest.fn<LeanOnly<T>, [string]>().mockReturnValue(lean(val)),
  });
  const sortLean = <T>(val: T): SortThenLean<T> => ({
    sort: jest
      .fn<LeanOnly<T>, [Record<string, number>]>()
      .mockReturnValue(lean(val)),
  });
  const selectSort = <T>(val: T): SelectThenSortThenLean<T> => ({
    select: jest.fn<SortThenLean<T>, [string]>().mockReturnValue(sortLean(val)),
  });

  beforeEach(async () => {
    model = {
      find: jest.fn<SelectThenSortThenLean<CategoryLike[]>, unknown[]>(),
      findOne: jest.fn<
        LeanOnly<CategoryLike | null> | SelectThenLean<CategoryLike | null>,
        unknown[]
      >(),
      findById: jest.fn<
        LeanOnly<CategoryLike | null> | Promise<CategoryLike>,
        unknown[]
      >(),
      findByIdAndUpdate: jest.fn<SelectThenLean<CategoryLike>, unknown[]>(),
      findByIdAndDelete: jest.fn<Promise<CategoryLike | null>, unknown[]>(),
      exists: jest.fn<Promise<boolean>, unknown[]>().mockResolvedValue(false),
      create: jest.fn<Promise<CreatedCategory>, unknown[]>(),
    };

    productModel = {
      aggregate: jest
        .fn<Promise<ProductAggResult[]>, unknown[]>()
        .mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        { provide: getModelToken(Category.name), useValue: model },
        { provide: getModelToken(Product.name), useValue: productModel },
      ],
    }).compile();

    service = module.get(CategoryService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates root category with auto slug', async () => {
      model.findOne.mockReturnValue(lean(null));
      model.create.mockResolvedValue({
        ...mockCat(),
        toObject: () => mockCat(),
      });

      const res = await service.create({ name: 'موبایل' });
      expect(res.slug).toBe('mobile');
      expect(model.create).toHaveBeenCalledWith(
        expect.objectContaining({ depth: 0, ancestors: [], parent: null }),
      );
    });

    it('creates child category with correct ancestors and depth', async () => {
      const parentDoc = mockCat({ _id: new Types.ObjectId(mockId) });
      model.findById.mockReturnValue(lean(parentDoc));
      model.findOne.mockReturnValue(lean(null));
      model.create.mockResolvedValue({
        ...mockCat({ depth: 1 }),
        toObject: () => mockCat({ depth: 1 }),
      });

      await service.create({ name: 'گوشی', parent: mockId });
      expect(model.create).toHaveBeenCalledWith(
        expect.objectContaining({ depth: 1 }),
      );
    });

    it('throws if parent not found', async () => {
      model.findById.mockReturnValue(lean(null));
      await expect(
        service.create({ name: 'تست', parent: mockId }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('throws on circular parent (self)', async () => {
      model.findById.mockReturnValue(Promise.resolve(mockCat()));
      await expect(service.update(mockId, { parent: mockId })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('updates name and regenerates slug', async () => {
      model.findById.mockReturnValue(Promise.resolve(mockCat()));
      model.findOne.mockReturnValue(lean(null));
      model.findByIdAndUpdate.mockReturnValue(
        selectLean(mockCat({ name: 'تبلت', slug: 'tablet' })),
      );

      await service.update(mockId, { name: 'تبلت' });
      expect(model.findByIdAndUpdate).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('throws if category has children', async () => {
      model.exists.mockResolvedValue(true);
      await expect(service.remove(mockId)).rejects.toThrow(BadRequestException);
    });

    it('throws if not found', async () => {
      model.exists.mockResolvedValue(false);
      model.findByIdAndDelete.mockResolvedValue(null);
      await expect(service.remove(mockId)).rejects.toThrow(NotFoundException);
    });

    it('deletes category successfully', async () => {
      model.exists.mockResolvedValue(false);
      model.findByIdAndDelete.mockResolvedValue(mockCat());
      await expect(service.remove(mockId)).resolves.toBeUndefined();
    });
  });

  describe('getBySlug', () => {
    it('throws if not found', async () => {
      model.findOne.mockReturnValue(selectLean(null));
      await expect(service.getBySlug('not-exist')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns category with children', async () => {
      model.findOne.mockReturnValue(selectLean(mockCat()));
      model.find.mockReturnValue(selectSort([]));
      const res = await service.getBySlug('mobile');
      expect(res.category.slug).toBe('mobile');
    });
  });

  describe('getRootsWithStock', () => {
    it('returns only root categories (depth=0)', async () => {
      const rootId = new Types.ObjectId();
      const childId = new Types.ObjectId();

      const root = mockCat({
        _id: rootId,
        depth: 0,
        ancestors: [],
        parent: null,
      });
      const child = mockCat({
        _id: childId,
        depth: 1,
        ancestors: [rootId],
        parent: rootId,
      });

      model.find.mockReturnValue(selectSort([root, child]));
      productModel.aggregate.mockResolvedValue([]);

      const result = await service.getRootsWithStock();

      expect(result).toHaveLength(1);
      expect(result[0]._id.toString()).toBe(rootId.toString());
    });

    it('rolls up child product stock to the root', async () => {
      const rootId = new Types.ObjectId();
      const childId = new Types.ObjectId();

      const root = mockCat({
        _id: rootId,
        depth: 0,
        ancestors: [],
        parent: null,
      });
      const child = mockCat({
        _id: childId,
        depth: 1,
        ancestors: [rootId],
        parent: rootId,
      });

      model.find.mockReturnValue(selectSort([root, child]));
      productModel.aggregate.mockResolvedValue([
        { _id: childId.toString(), totalStock: 80, productsCount: 4 },
      ]);

      const result = await service.getRootsWithStock();

      expect(result[0].totalStock).toBe(80);
      expect(result[0].productsCount).toBe(4);
    });

    it('accumulates stock from multiple children', async () => {
      const rootId = new Types.ObjectId();
      const childId1 = new Types.ObjectId();
      const childId2 = new Types.ObjectId();

      model.find.mockReturnValue(
        selectSort([
          mockCat({ _id: rootId, depth: 0, ancestors: [], parent: null }),
          mockCat({
            _id: childId1,
            depth: 1,
            ancestors: [rootId],
            parent: rootId,
          }),
          mockCat({
            _id: childId2,
            depth: 1,
            ancestors: [rootId],
            parent: rootId,
          }),
        ]),
      );
      productModel.aggregate.mockResolvedValue([
        { _id: childId1.toString(), totalStock: 30, productsCount: 2 },
        { _id: childId2.toString(), totalStock: 50, productsCount: 3 },
      ]);

      const result = await service.getRootsWithStock();

      expect(result[0].totalStock).toBe(80);
      expect(result[0].productsCount).toBe(5);
    });

    it('returns empty array when no active categories exist', async () => {
      model.find.mockReturnValue(selectSort([]));
      productModel.aggregate.mockResolvedValue([]);

      const result = await service.getRootsWithStock();
      expect(result).toEqual([]);
    });

    it('ignores product stats for unknown category IDs', async () => {
      const rootId = new Types.ObjectId();
      model.find.mockReturnValue(
        selectSort([
          mockCat({ _id: rootId, depth: 0, ancestors: [], parent: null }),
        ]),
      );
      productModel.aggregate.mockResolvedValue([
        {
          _id: new Types.ObjectId().toString(),
          totalStock: 999,
          productsCount: 99,
        },
      ]);

      const result = await service.getRootsWithStock();
      expect(result[0].totalStock).toBe(0);
      expect(result[0].productsCount).toBe(0);
    });
  });
});
