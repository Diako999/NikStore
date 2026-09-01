import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import type { UserDocument } from './entities/user.schema';

const mockService = {
  getProfile: jest.fn(),
  updateProfile: jest.fn(),
  addAddress: jest.fn(),
  updateAddress: jest.fn(),
  removeAddress: jest.fn(),
  setDefaultAddress: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  getUserReviews: jest.fn(),
  toggleBlock: jest.fn(),
};

const userId = new Types.ObjectId().toString();
const addrId = new Types.ObjectId().toString();
const mockUser = {
  _id: { toString: () => userId },
  phone: '09121234567',
} as unknown as UserDocument;

describe('UserController', () => {
  let controller: UserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: mockService }],
    }).compile();

    controller = module.get(UserController);
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('returns current user profile', async () => {
      mockService.getProfile.mockResolvedValue({ phone: '09121234567' });
      const result = await controller.getProfile(mockUser);
      expect(result.phone).toBe('09121234567');
      expect(mockService.getProfile).toHaveBeenCalledWith(userId);
    });
  });

  describe('updateProfile', () => {
    it('updates and returns profile', async () => {
      mockService.updateProfile.mockResolvedValue({ firstName: 'علی' });
      const result = await controller.updateProfile(mockUser, {
        firstName: 'علی',
      });
      expect(result.firstName).toBe('علی');
    });

    it('propagates NotFoundException when user not found', async () => {
      mockService.updateProfile.mockRejectedValue(new NotFoundException());
      await expect(controller.updateProfile(mockUser, {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('addAddress', () => {
    const dto = {
      title: 'خانه',
      province: 'تهران',
      city: 'تهران',
      street: 'آزادی',
      detail: 'پ۱',
      postalCode: '1234567890',
      recipientName: 'علی',
      recipientPhone: '09121234567',
    };

    it('adds address successfully', async () => {
      mockService.addAddress.mockResolvedValue({ addresses: [dto] });
      const result = await controller.addAddress(mockUser, dto);
      expect(mockService.addAddress).toHaveBeenCalledWith(userId, dto);
      expect(result.addresses).toHaveLength(1);
    });

    it('propagates BadRequestException on address limit', async () => {
      mockService.addAddress.mockRejectedValue(new BadRequestException());
      await expect(controller.addAddress(mockUser, dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateAddress', () => {
    it('updates address and returns user', async () => {
      mockService.updateAddress.mockResolvedValue({ addresses: [] });
      await controller.updateAddress(mockUser, addrId, { city: 'مشهد' });
      expect(mockService.updateAddress).toHaveBeenCalledWith(userId, addrId, {
        city: 'مشهد',
      });
    });

    it('propagates NotFoundException when address not found', async () => {
      mockService.updateAddress.mockRejectedValue(new NotFoundException());
      await expect(
        controller.updateAddress(mockUser, addrId, {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeAddress', () => {
    it('removes address successfully', async () => {
      mockService.removeAddress.mockResolvedValue({ addresses: [] });
      const result = await controller.removeAddress(mockUser, addrId);
      expect(mockService.removeAddress).toHaveBeenCalledWith(userId, addrId);
      expect(result.addresses).toHaveLength(0);
    });
  });

  describe('setDefault', () => {
    it('sets default address', async () => {
      mockService.setDefaultAddress.mockResolvedValue({ addresses: [] });
      await controller.setDefault(mockUser, addrId);
      expect(mockService.setDefaultAddress).toHaveBeenCalledWith(
        userId,
        addrId,
      );
    });
  });

  describe('findAll', () => {
    it('returns paginated users with filters', async () => {
      mockService.findAll.mockResolvedValue({ items: [], total: 0 });
      await controller.findAll(1, 20, 'ali', 'false', 'user');
      expect(mockService.findAll).toHaveBeenCalledWith(
        1,
        20,
        'ali',
        'false',
        'user',
      );
    });
  });

  describe('findById', () => {
    it('returns user with stats', async () => {
      mockService.findById.mockResolvedValue({ _id: userId, ordersCount: 3 });
      const result = await controller.findById(userId);
      expect(result.ordersCount).toBe(3);
    });

    it('propagates NotFoundException', async () => {
      mockService.findById.mockRejectedValue(new NotFoundException());
      await expect(controller.findById(userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getUserReviews', () => {
    it('returns paginated reviews', async () => {
      mockService.getUserReviews.mockResolvedValue({ items: [], total: 0 });
      await controller.getUserReviews(userId, 1, 10);
      expect(mockService.getUserReviews).toHaveBeenCalledWith(userId, 1, 10);
    });
  });

  describe('block', () => {
    it('toggles block and returns isBlocked flag', async () => {
      mockService.toggleBlock.mockResolvedValue({ isBlocked: true });
      const result = await controller.block(userId);
      expect(result.isBlocked).toBe(true);
      expect(mockService.toggleBlock).toHaveBeenCalledWith(userId);
    });
  });
});
