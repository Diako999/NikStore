import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { ReviewService } from './review.service';
import { Review, ReviewStatus } from './entities/review.schema';
import { Product } from '../product/entities/product.schema';
import { Order } from '../order/entities/order.schema';
import { User } from '../user/entities/user.schema';
import { REDIS_CLIENT } from '../../redis/redis.module';
import { NotificationsGateway } from '../../common/gateway/notifications.gateway';
import { AppLoggerService } from '../../common/logger/app-logger.service';

const mockLogger = {
  setContext: jest.fn().mockReturnThis(),
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

const mockGateway = { emitNewReview: jest.fn() };

const userId = new Types.ObjectId().toString();
const productId = new Types.ObjectId().toString();
const orderId = new Types.ObjectId().toString();
const reviewId = new Types.ObjectId().toString();

interface MockReview {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  productId: Types.ObjectId;
  orderId: Types.ObjectId;
  rating: number;
  title: string;
  body: string;
  status: ReviewStatus;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  pros: string[];
  cons: string[];
  images: string[];
  save: jest.Mock;
  toObject: jest.Mock;
}

const mockReview = (overrides: Partial<MockReview> = {}): MockReview => ({
  _id: new Types.ObjectId(reviewId),
  userId: new Types.ObjectId(userId),
  productId: new Types.ObjectId(productId),
  orderId: new Types.ObjectId(orderId),
  rating: 5,
  title: 'محصول عالی بود',
  body: 'واقعاً از خریدم راضی هستم و کیفیت خوبی داشت',
  status: ReviewStatus.PENDING,
  isVerifiedPurchase: true,
  helpfulCount: 0,
  pros: [],
  cons: [],
  images: [],
  save: jest.fn().mockResolvedValue(true),
  toObject: jest.fn().mockReturnThis(),
  ...overrides,
});

interface MockReviewModel {
  create: jest.Mock;
  findOne: jest.Mock;
  findById: jest.Mock;
  find: jest.Mock;
  findByIdAndDelete: jest.Mock;
  countDocuments: jest.Mock;
  aggregate: jest.Mock;
}

interface MockProductModel {
  findByIdAndUpdate: jest.Mock;
}

interface MockOrderModel {
  findOne: jest.Mock;
}

interface MockRedis {
  sismember: jest.Mock;
  sadd: jest.Mock;
  srem: jest.Mock;
  scard: jest.Mock;
  expire: jest.Mock;
}

describe('ReviewService', () => {
  let service: ReviewService;
  let reviewModel: MockReviewModel;
  let productModel: MockProductModel;
  let orderModel: MockOrderModel;
  let redis: MockRedis;

  const leanChain = (val: any) => ({
    lean: jest.fn().mockResolvedValue(val),
  });

  const selectSortSkipLimitPopulateLean = (val: any) => ({
    select: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue(leanChain(val)),
            lean: jest.fn().mockResolvedValue(val),
          }),
        }),
      }),
    }),
  });

  beforeEach(async () => {
    reviewModel = {
      create: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
      find: jest.fn().mockReturnValue(selectSortSkipLimitPopulateLean([])),
      findByIdAndDelete: jest.fn(),
      countDocuments: jest.fn().mockResolvedValue(0),
      aggregate: jest.fn().mockResolvedValue([]),
    };

    productModel = {
      findByIdAndUpdate: jest.fn().mockResolvedValue({}),
    };

    orderModel = {
      findOne: jest.fn(),
    };

    redis = {
      sismember: jest.fn().mockResolvedValue(0),
      sadd: jest.fn(),
      srem: jest.fn(),
      scard: jest.fn().mockResolvedValue(0),
      expire: jest.fn(),
    };

    const userModel = {
      findById: jest.fn().mockReturnValue({
        select: jest
          .fn()
          .mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewService,
        { provide: getModelToken(Review.name), useValue: reviewModel },
        { provide: getModelToken(Product.name), useValue: productModel },
        { provide: getModelToken(Order.name), useValue: orderModel },
        { provide: getModelToken(User.name), useValue: userModel },
        { provide: REDIS_CLIENT, useValue: redis },
        { provide: NotificationsGateway, useValue: mockGateway },
        { provide: AppLoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get(ReviewService);
    jest.clearAllMocks();
  });

  // ── create ────────────────────────────────────────────────────
  describe('create', () => {
    const dto = {
      productId,
      orderId,
      rating: 5,
      title: 'محصول عالی بود',
      body: 'واقعاً از خریدم راضی هستم و کیفیت خوبی داشت',
    };

    it('creates review for verified purchase', async () => {
      orderModel.findOne.mockReturnValue(leanChain({ _id: orderId }));
      reviewModel.findOne.mockReturnValue(leanChain(null));
      reviewModel.create.mockResolvedValue({
        ...mockReview(),
        toObject: () => mockReview(),
      });

      const res = await service.create(userId, dto);
      expect(res.rating).toBe(5);
      expect(res.status).toBe(ReviewStatus.PENDING);
      expect(reviewModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ isVerifiedPurchase: true }),
      );
    });

    it('throws when order does not contain product', async () => {
      orderModel.findOne.mockReturnValue(leanChain(null));
      await expect(service.create(userId, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws on duplicate review (same user+product)', async () => {
      orderModel.findOne.mockReturnValue(leanChain({ _id: orderId }));
      reviewModel.findOne.mockReturnValue(leanChain(mockReview()));
      await expect(service.create(userId, dto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  // ── toggleHelpful ─────────────────────────────────────────────
  describe('toggleHelpful', () => {
    beforeEach(() => {
      reviewModel.findById.mockReturnValue(leanChain(mockReview()));
    });

    it('adds helpful vote', async () => {
      redis.sismember.mockResolvedValue(0);
      redis.scard.mockResolvedValue(1);

      const res = await service.toggleHelpful(userId, reviewId);
      expect(res.helpful).toBe(true);
      expect(res.count).toBe(1);
      expect(redis.sadd).toHaveBeenCalled();
    });

    it('removes helpful vote when already voted', async () => {
      redis.sismember.mockResolvedValue(1);
      redis.scard.mockResolvedValue(0);

      const res = await service.toggleHelpful(userId, reviewId);
      expect(res.helpful).toBe(false);
      expect(redis.srem).toHaveBeenCalled();
    });

    it('throws when review not found', async () => {
      reviewModel.findById.mockReturnValue(leanChain(null));
      await expect(service.toggleHelpful(userId, reviewId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── updateStatus (admin) ──────────────────────────────────────
  describe('updateStatus', () => {
    it('approves review and recalculates product rating', async () => {
      reviewModel.findById.mockResolvedValue(mockReview());
      reviewModel.aggregate.mockResolvedValue([
        { avgRating: 4.5, reviewCount: 3 },
      ]);

      await service.updateStatus(reviewId, { status: ReviewStatus.APPROVED });

      expect(productModel.findByIdAndUpdate).toHaveBeenCalledWith(productId, {
        $set: { avgRating: 4.5, reviewCount: 3 },
      });
    });

    it('rejects review without recalculating rating', async () => {
      reviewModel.findById.mockResolvedValue(mockReview());

      await service.updateStatus(reviewId, {
        status: ReviewStatus.REJECTED,
        adminNote: 'محتوای نامناسب',
      });

      expect(productModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('throws when review not in pending status', async () => {
      reviewModel.findById.mockResolvedValue(
        mockReview({ status: ReviewStatus.APPROVED }),
      );
      await expect(
        service.updateStatus(reviewId, { status: ReviewStatus.APPROVED }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── remove ────────────────────────────────────────────────────
  describe('remove', () => {
    it('deletes and recalculates if was approved', async () => {
      reviewModel.findByIdAndDelete.mockResolvedValue(
        mockReview({ status: ReviewStatus.APPROVED }),
      );
      reviewModel.aggregate.mockResolvedValue([]);

      await service.remove(reviewId);
      expect(productModel.findByIdAndUpdate).toHaveBeenCalled();
    });

    it('throws when review not found', async () => {
      reviewModel.findByIdAndDelete.mockResolvedValue(null);
      await expect(service.remove(reviewId)).rejects.toThrow(NotFoundException);
    });
  });
});
