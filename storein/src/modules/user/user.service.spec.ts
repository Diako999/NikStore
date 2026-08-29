import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { UserService } from './user.service';
import { User } from './entities/user.schema';
import { Address } from './entities/address.schema';
import { CreateAddressDto } from './dto/create-address.dto';
import { Order } from '../order/entities/order.schema';
import { Review } from '../review/entities/review.schema';

type MockAddress = Pick<Address, '_id' | 'isDefault'> & Partial<Address>;

interface MockUserModel {
  findById: jest.Mock;
  findByIdAndUpdate: jest.Mock;
  find: jest.Mock;
  countDocuments: jest.Mock;
}

const addrId = new Types.ObjectId();
const userId = new Types.ObjectId().toString();

const mockUser = () => ({
  _id: userId,
  phone: '09121234567',
  isActive: true,
  isAdmin: false,
  addresses: [] as MockAddress[],
  save: jest.fn().mockResolvedValue(true),
  toObject: jest.fn().mockReturnThis(),
});

describe('UserService', () => {
  let service: UserService;
  let model: MockUserModel;

  beforeEach(async () => {
    model = {
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      find: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      }),
      countDocuments: jest.fn().mockResolvedValue(0),
    };

    const orderModel = {
      aggregate: jest.fn().mockResolvedValue([{ count: 2, total: 50_000_000 }]),
    };

    const reviewModel = {
      find: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                  lean: jest.fn().mockResolvedValue([]),
                }),
              }),
            }),
          }),
        }),
      }),
      countDocuments: jest.fn().mockResolvedValue(0),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getModelToken(User.name), useValue: model },
        { provide: getModelToken(Order.name), useValue: orderModel },
        { provide: getModelToken(Review.name), useValue: reviewModel },
      ],
    }).compile();

    service = module.get(UserService);
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('returns user', async () => {
      model.findById.mockReturnValue({
        select: jest
          .fn()
          .mockReturnValue({ lean: jest.fn().mockResolvedValue(mockUser()) }),
      });
      const res = await service.getProfile(userId);
      expect(res.phone).toBe('09121234567');
    });

    it('throws if user not found', async () => {
      model.findById.mockReturnValue({
        select: jest
          .fn()
          .mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
      });
      await expect(service.getProfile(userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('addAddress', () => {
    it('adds first address and sets it as default', async () => {
      const user = mockUser();
      model.findById.mockResolvedValue(user);

      await service.addAddress(userId, {
        title: 'خانه',
        province: 'تهران',
        city: 'تهران',
        street: 'خ آزادی',
        detail: 'پ۱',
        postalCode: '1234567890',
        recipientName: 'علی رضایی',
        recipientPhone: '09121234567',
      });

      expect(user.addresses[0].isDefault).toBe(true);
      expect(user.save).toHaveBeenCalled();
    });

    it('throws if address limit reached', async () => {
      const user = mockUser();
      user.addresses = Array<MockAddress>(10).fill({
        _id: new Types.ObjectId(),
        isDefault: false,
      });
      model.findById.mockResolvedValue(user);

      await expect(
        service.addAddress(userId, {} as CreateAddressDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('removeAddress', () => {
    it('sets next address as default when default is removed', async () => {
      const user = mockUser();
      const a1 = { _id: addrId, isDefault: true };
      const a2 = { _id: new Types.ObjectId(), isDefault: false };
      user.addresses = [a1, a2];
      model.findById.mockResolvedValue(user);

      await service.removeAddress(userId, addrId.toString());
      expect(user.addresses[0].isDefault).toBe(true);
    });
  });

  describe('toggleBlock', () => {
    it('toggles user active status and returns isBlocked', async () => {
      const user = {
        ...mockUser(),
        isActive: true,
        save: jest.fn().mockResolvedValue(undefined),
        toObject: jest.fn().mockReturnThis(),
      };
      model.findById.mockResolvedValue(user);

      const result = await service.toggleBlock(userId);
      expect(user.isActive).toBe(false);
      expect(result.isBlocked).toBe(true);
    });
  });

  describe('updateProfile', () => {
    it('returns updated user', async () => {
      const updated = { ...mockUser(), firstName: 'علی' };
      model.findByIdAndUpdate.mockReturnValue({
        select: jest
          .fn()
          .mockReturnValue({ lean: jest.fn().mockResolvedValue(updated) }),
      });
      const result = await service.updateProfile(userId, { firstName: 'علی' });
      expect(result.firstName).toBe('علی');
    });

    it('throws NotFoundException when user not found', async () => {
      model.findByIdAndUpdate.mockReturnValue({
        select: jest
          .fn()
          .mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
      });
      await expect(service.updateProfile(userId, {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateAddress', () => {
    it('updates address fields', async () => {
      const user = mockUser();
      const addr = { _id: addrId, isDefault: false, city: 'تهران' };
      user.addresses = [addr];
      model.findById.mockResolvedValue(user);

      await service.updateAddress(userId, addrId.toString(), {
        city: 'مشهد',
      });
      expect(addr.city).toBe('مشهد');
      expect(user.save).toHaveBeenCalled();
    });

    it('throws when address not found', async () => {
      const user = mockUser();
      model.findById.mockResolvedValue(user);
      await expect(
        service.updateAddress(userId, new Types.ObjectId().toString(), {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('setDefaultAddress', () => {
    it('sets only target address as default', async () => {
      const user = mockUser();
      const a1 = { _id: addrId, isDefault: false };
      const a2 = { _id: new Types.ObjectId(), isDefault: true };
      user.addresses = [a1, a2];
      model.findById.mockResolvedValue(user);

      await service.setDefaultAddress(userId, addrId.toString());
      expect(a1.isDefault).toBe(true);
      expect(a2.isDefault).toBe(false);
    });
  });

  describe('findById', () => {
    it('returns user with order stats', async () => {
      model.findById.mockReturnValue({
        select: jest
          .fn()
          .mockReturnValue({ lean: jest.fn().mockResolvedValue(mockUser()) }),
      });

      const result = await service.findById(userId);
      expect(result.ordersCount).toBe(2);
      expect(result.totalSpent).toBe(50_000_000);
    });

    it('throws NotFoundException when user not found', async () => {
      model.findById.mockReturnValue({
        select: jest
          .fn()
          .mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
      });
      await expect(service.findById(userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserReviews', () => {
    it('returns paginated reviews', async () => {
      const result = await service.getUserReviews(userId, 1, 10);
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });
  });
});
