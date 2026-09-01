import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { ProductStatus } from './entities/product.schema';
import { CreateProductDto } from './dto/create-product.dto';

const mockService = {
  findAll: jest.fn(),
  findBySlug: jest.fn(),
  adminFindAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  addVariant: jest.fn(),
  updateVariant: jest.fn(),
  removeVariant: jest.fn(),
  adjustStock: jest.fn(),
  bulkDiscount: jest.fn(),
};

const prodId = new Types.ObjectId().toString();
const varId = new Types.ObjectId().toString();

describe('ProductController', () => {
  let controller: ProductController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [{ provide: ProductService, useValue: mockService }],
    }).compile();

    controller = module.get(ProductController);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('returns paginated products', async () => {
      mockService.findAll.mockResolvedValue({ products: [], total: 0 });
      const result = await controller.findAll({});
      expect(result.total).toBe(0);
    });
  });

  describe('findBySlug', () => {
    it('returns product with colorMap', async () => {
      mockService.findBySlug.mockResolvedValue({ slug: 'test', colorMap: {} });
      const result = (await controller.findBySlug('test')) as {
        slug: string;
        colorMap: Record<string, unknown>;
      };
      expect(result.slug).toBe('test');
    });

    it('propagates NotFoundException', async () => {
      mockService.findBySlug.mockRejectedValue(new NotFoundException());
      await expect(controller.findBySlug('unknown')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('adminFindAll', () => {
    it('returns all products for admin', async () => {
      mockService.adminFindAll.mockResolvedValue({ products: [], total: 0 });
      const result = await controller.adminFindAll({});
      expect(result.total).toBe(0);
    });
  });

  describe('findById', () => {
    it('returns product by id', async () => {
      mockService.findById.mockResolvedValue({ _id: prodId });
      const result = (await controller.findById(prodId)) as { _id: string };
      expect(result._id).toBe(prodId);
    });

    it('propagates NotFoundException', async () => {
      mockService.findById.mockRejectedValue(new NotFoundException());
      await expect(controller.findById(prodId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('creates and returns product', async () => {
      const dto = { name: 'محصول', category: prodId, variants: [] };
      mockService.create.mockResolvedValue({
        ...dto,
        slug: 'product',
        status: ProductStatus.ACTIVE,
      });
      const result = await controller.create(dto);
      expect(result.slug).toBe('product');
    });

    it('propagates BadRequestException on validation error', async () => {
      mockService.create.mockRejectedValue(new BadRequestException());
      await expect(
        controller.create({} as unknown as CreateProductDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('updates and returns product', async () => {
      mockService.update.mockResolvedValue({ _id: prodId, name: 'Updated' });
      const result = await controller.update(prodId, { name: 'Updated' });
      expect(result.name).toBe('Updated');
    });

    it('propagates NotFoundException', async () => {
      mockService.update.mockRejectedValue(new NotFoundException());
      await expect(controller.update(prodId, {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('removes product successfully', async () => {
      mockService.remove.mockResolvedValue(undefined);
      await expect(controller.remove(prodId)).resolves.toBeUndefined();
    });

    it('propagates NotFoundException', async () => {
      mockService.remove.mockRejectedValue(new NotFoundException());
      await expect(controller.remove(prodId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('bulkDiscount', () => {
    it('returns updated count in permanent mode', async () => {
      mockService.bulkDiscount.mockResolvedValue({
        updated: 3,
        mode: 'permanent',
      });
      const result = await controller.bulkDiscount({
        productIds: [prodId],
        discountPct: 10,
      });
      expect(result.updated).toBe(3);
      expect(result.mode).toBe('permanent');
    });

    it('returns updated count and timed mode when dates provided', async () => {
      mockService.bulkDiscount.mockResolvedValue({ updated: 2, mode: 'timed' });
      const result = await controller.bulkDiscount({
        productIds: [prodId],
        discountPct: 20,
        startDate: '2026-07-01T00:00:00.000Z',
        endDate: '2026-07-15T23:59:59.000Z',
        title: 'تخفیف تابستانه',
      });
      expect(result.updated).toBe(2);
      expect(result.mode).toBe('timed');
    });
  });

  describe('addVariant', () => {
    it('adds variant and returns product', async () => {
      mockService.addVariant.mockResolvedValue({ _id: prodId });
      const result = await controller.addVariant(prodId, {
        sku: 'SKU-NEW',
        price: 1000,
        stock: 5,
      });
      expect(result._id).toBe(prodId);
    });

    it('throws on duplicate SKU', async () => {
      mockService.addVariant.mockRejectedValue(new BadRequestException());
      await expect(
        controller.addVariant(prodId, {
          sku: 'SKU-001',
          price: 1000,
          stock: 1,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateVariant', () => {
    it('updates variant and returns product', async () => {
      mockService.updateVariant.mockResolvedValue({ _id: prodId });
      const result = await controller.updateVariant(prodId, varId, {
        price: 2000,
      });
      expect(result._id).toBe(prodId);
    });
  });

  describe('removeVariant', () => {
    it('removes variant and returns product', async () => {
      mockService.removeVariant.mockResolvedValue({ _id: prodId });
      const result = await controller.removeVariant(prodId, varId);
      expect(result._id).toBe(prodId);
    });

    it('propagates NotFoundException', async () => {
      mockService.removeVariant.mockRejectedValue(new NotFoundException());
      await expect(controller.removeVariant(prodId, varId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('adjustStock', () => {
    it('adjusts stock and returns product', async () => {
      mockService.adjustStock.mockResolvedValue({ _id: prodId });
      const result = await controller.adjustStock(prodId, varId, 5);
      expect(mockService.adjustStock).toHaveBeenCalledWith(prodId, varId, 5);
      expect(result._id).toBe(prodId);
    });

    it('propagates BadRequestException on negative stock', async () => {
      mockService.adjustStock.mockRejectedValue(new BadRequestException());
      await expect(controller.adjustStock(prodId, varId, -100)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
