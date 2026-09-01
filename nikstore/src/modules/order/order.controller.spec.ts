import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { OrderStatus } from './entities/order.schema';
import type { UserDocument } from '../user/entities/user.schema';

const mockService = {
  createFromCart: jest.fn(),
  findMyOrders: jest.fn(),
  findMyOrderById: jest.fn(),
  cancelMyOrder: jest.fn(),
  adminFindAll: jest.fn(),
  adminFindById: jest.fn(),
  updateStatus: jest.fn(),
};

const userId = new Types.ObjectId().toString();
const orderId = new Types.ObjectId().toString();
const mockUser = {
  _id: { toString: () => userId },
} as unknown as UserDocument;

describe('OrderController', () => {
  let controller: OrderController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [{ provide: OrderService, useValue: mockService }],
    }).compile();

    controller = module.get(OrderController);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('delegates to createFromCart with userId', async () => {
      mockService.createFromCart.mockResolvedValue({ orderNumber: 'ORD-1' });
      const dto = { addressId: new Types.ObjectId().toString() };
      const result = await controller.create(mockUser, dto);
      expect(result.orderNumber).toBe('ORD-1');
      expect(mockService.createFromCart).toHaveBeenCalledWith(userId, dto);
    });

    it('propagates BadRequestException on empty cart', async () => {
      mockService.createFromCart.mockRejectedValue(new BadRequestException());
      await expect(
        controller.create(mockUser, { addressId: 'x' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findMyOrders', () => {
    it('returns paginated orders', async () => {
      mockService.findMyOrders.mockResolvedValue({ orders: [], total: 0 });
      const result = await controller.findMyOrders(mockUser, 1, 10);
      expect(mockService.findMyOrders).toHaveBeenCalledWith(
        userId,
        1,
        10,
        undefined,
      );
      expect(result.total).toBe(0);
    });

    it('passes status filter when provided', async () => {
      mockService.findMyOrders.mockResolvedValue({ orders: [], total: 0 });
      await controller.findMyOrders(mockUser, 1, 10, OrderStatus.PENDING);
      expect(mockService.findMyOrders).toHaveBeenCalledWith(
        userId,
        1,
        10,
        OrderStatus.PENDING,
      );
    });
  });

  describe('findMyOrderById', () => {
    it('returns order by id', async () => {
      mockService.findMyOrderById.mockResolvedValue({ _id: orderId });
      const result = await controller.findMyOrderById(mockUser, orderId);
      expect(result._id).toBe(orderId);
    });

    it('propagates NotFoundException when not found', async () => {
      mockService.findMyOrderById.mockRejectedValue(new NotFoundException());
      await expect(
        controller.findMyOrderById(mockUser, orderId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancelMyOrder', () => {
    it('cancels order and returns updated doc', async () => {
      mockService.cancelMyOrder.mockResolvedValue({
        status: OrderStatus.CANCELLED,
      });
      const result = await controller.cancelMyOrder(mockUser, orderId);
      expect(result.status).toBe(OrderStatus.CANCELLED);
    });

    it('propagates BadRequestException on illegal transition', async () => {
      mockService.cancelMyOrder.mockRejectedValue(new BadRequestException());
      await expect(controller.cancelMyOrder(mockUser, orderId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('adminFindAll', () => {
    it('passes query params to service', async () => {
      mockService.adminFindAll.mockResolvedValue({ items: [], total: 0 });
      await controller.adminFindAll(
        1,
        20,
        OrderStatus.PENDING,
        'test',
        '2024-01-01',
        '2024-12-31',
      );
      expect(mockService.adminFindAll).toHaveBeenCalledWith(1, 20, {
        status: OrderStatus.PENDING,
        search: 'test',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      });
    });
  });

  describe('adminFindById', () => {
    it('returns order by id', async () => {
      mockService.adminFindById.mockResolvedValue({ _id: orderId });
      const result = await controller.adminFindById(orderId);
      expect(result._id).toBe(orderId);
    });

    it('propagates NotFoundException', async () => {
      mockService.adminFindById.mockRejectedValue(new NotFoundException());
      await expect(controller.adminFindById(orderId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateStatus', () => {
    it('transitions order status', async () => {
      mockService.updateStatus.mockResolvedValue({
        status: OrderStatus.CONFIRMED,
      });
      const result = await controller.updateStatus(orderId, {
        status: OrderStatus.CONFIRMED,
      });
      expect(result.status).toBe(OrderStatus.CONFIRMED);
      expect(mockService.updateStatus).toHaveBeenCalledWith(orderId, {
        status: OrderStatus.CONFIRMED,
      });
    });

    it('propagates BadRequestException on illegal transition', async () => {
      mockService.updateStatus.mockRejectedValue(new BadRequestException());
      await expect(
        controller.updateStatus(orderId, { status: OrderStatus.CANCELLED }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
