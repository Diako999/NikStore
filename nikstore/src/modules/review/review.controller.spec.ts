import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';
import { ReviewStatus } from './entities/review.schema';
import type { UserDocument } from '../user/entities/user.schema';

const mockService = {
  getProductReviews: jest.fn(),
  create: jest.fn(),
  getMyReviews: jest.fn(),
  toggleHelpful: jest.fn(),
  adminFindAll: jest.fn(),
  updateStatus: jest.fn(),
  remove: jest.fn(),
};

const userId = new Types.ObjectId().toString();
const reviewId = new Types.ObjectId().toString();
const mockUser = {
  _id: { toString: () => userId },
} as unknown as UserDocument;

describe('ReviewController', () => {
  let controller: ReviewController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReviewController],
      providers: [{ provide: ReviewService, useValue: mockService }],
    }).compile();

    controller = module.get(ReviewController);
    jest.clearAllMocks();
  });

  describe('getProductReviews', () => {
    it('returns reviews with stats', async () => {
      mockService.getProductReviews.mockResolvedValue({
        items: [],
        total: 0,
        totalPages: 0,
        stats: { avgRating: 0, distribution: {} },
      });
      const result = await controller.getProductReviews({
        productId: userId,
      });
      expect(result.total).toBe(0);
    });
  });

  describe('create', () => {
    const dto = {
      productId: userId,
      rating: 5,
      title: 'عالی',
      body: 'خیلی خوب بود واقعاً',
    };

    it('creates review successfully', async () => {
      mockService.create.mockResolvedValue({
        rating: 5,
        status: ReviewStatus.PENDING,
      });
      const result = await controller.create(mockUser, dto);
      expect(result.status).toBe(ReviewStatus.PENDING);
      expect(mockService.create).toHaveBeenCalledWith(userId, dto);
    });

    it('propagates ConflictException on duplicate review', async () => {
      mockService.create.mockRejectedValue(new ConflictException());
      await expect(controller.create(mockUser, dto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('getMyReviews', () => {
    it('returns paginated reviews for current user', async () => {
      mockService.getMyReviews.mockResolvedValue({ reviews: [], total: 0 });
      await controller.getMyReviews(mockUser, 1, 10);
      expect(mockService.getMyReviews).toHaveBeenCalledWith(userId, 1, 10);
    });
  });

  describe('toggleHelpful', () => {
    it('marks review as helpful', async () => {
      mockService.toggleHelpful.mockResolvedValue({ helpful: true, count: 1 });
      const result = await controller.toggleHelpful(mockUser, reviewId);
      expect(result.helpful).toBe(true);
      expect(mockService.toggleHelpful).toHaveBeenCalledWith(userId, reviewId);
    });

    it('propagates NotFoundException when review not found', async () => {
      mockService.toggleHelpful.mockRejectedValue(new NotFoundException());
      await expect(
        controller.toggleHelpful(mockUser, reviewId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('adminFindAll', () => {
    it('returns all reviews with pendingCount', async () => {
      mockService.adminFindAll.mockResolvedValue({
        items: [],
        total: 0,
        pendingCount: 5,
      });
      const result = await controller.adminFindAll({
        status: ReviewStatus.PENDING,
      });
      expect(result.pendingCount).toBe(5);
    });
  });

  describe('updateStatus', () => {
    it('approves review', async () => {
      mockService.updateStatus.mockResolvedValue({
        status: ReviewStatus.APPROVED,
      });
      const result = await controller.updateStatus(reviewId, {
        status: ReviewStatus.APPROVED,
      });
      expect(result.status).toBe(ReviewStatus.APPROVED);
      expect(mockService.updateStatus).toHaveBeenCalledWith(reviewId, {
        status: ReviewStatus.APPROVED,
      });
    });

    it('propagates BadRequestException when review not in pending', async () => {
      mockService.updateStatus.mockRejectedValue(new BadRequestException());
      await expect(
        controller.updateStatus(reviewId, { status: ReviewStatus.APPROVED }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('removes review successfully', async () => {
      mockService.remove.mockResolvedValue(undefined);
      await expect(controller.remove(reviewId)).resolves.toBeUndefined();
      expect(mockService.remove).toHaveBeenCalledWith(reviewId);
    });

    it('propagates NotFoundException when review not found', async () => {
      mockService.remove.mockRejectedValue(new NotFoundException());
      await expect(controller.remove(reviewId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
