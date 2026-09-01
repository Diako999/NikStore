import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../redis/redis.module';
import { Review, ReviewDocument, ReviewStatus } from './entities/review.schema';
import { Product, ProductDocument } from '../product/entities/product.schema';
import {
  Order,
  OrderDocument,
  OrderStatus,
} from '../order/entities/order.schema';
import { User, UserDocument } from '../user/entities/user.schema';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewStatusDto } from './dto/update-review-status.dto';
import { ReviewQueryDto } from './dto/review-query.dto';
import { NotificationsGateway } from '../../common/gateway/notifications.gateway';
import { AppLoggerService } from '../../common/logger/app-logger.service';

const helpfulKey = (reviewId: string) => `review:helpful:${reviewId}`;

type WithTimestamps = { createdAt: Date; updatedAt: Date };

@Injectable()
export class ReviewService {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @Inject(REDIS_CLIENT) private redis: Redis,
    private readonly gateway: NotificationsGateway,
    private readonly logger: AppLoggerService,
  ) {
    this.logger.setContext('ReviewService');
  }

  async create(userId: string, dto: CreateReviewDto): Promise<ReviewDocument> {
    // Find any delivered order containing this product for this user
    const order = await this.orderModel
      .findOne({
        userId: new Types.ObjectId(userId),
        'items.productId': new Types.ObjectId(dto.productId),
        status: OrderStatus.DELIVERED,
      })
      .lean<OrderDocument>();

    const existing = await this.reviewModel
      .findOne({
        userId: new Types.ObjectId(userId),
        productId: new Types.ObjectId(dto.productId),
      })
      .lean();

    if (existing)
      throw new ConflictException('شما قبلاً برای این محصول نظر ثبت کرده‌اید');

    const review = await this.reviewModel.create({
      ...dto,
      userId: new Types.ObjectId(userId),
      productId: new Types.ObjectId(dto.productId),
      orderId: order?._id ?? null,
      isVerifiedPurchase: !!order,
      status: ReviewStatus.PENDING,
    });

    // Fire-and-forget: fetch names for notification without blocking response
    Promise.all([
      this.productModel.findById(dto.productId).select('name').lean(),
      this.userModel.findById(userId).select('firstName').lean<UserDocument>(),
    ])
      .then(([product, user]) => {
        this.gateway.emitNewReview({
          reviewId: review._id.toString(),
          productName: product?.name ?? 'محصول',
          rating: review.rating,
          userName: (user as UserDocument)?.firstName?.trim() || 'کاربر',
          // `@Schema({ timestamps: true })` adds `createdAt` at runtime; not
          // reflected on the `Review` class, so the intermediate `unknown`
          // cast is needed (see `OrderWithTimestamps` in order.service.ts for
          // the same pattern).
          createdAt:
            (
              review as unknown as ReviewDocument & WithTimestamps
            ).createdAt?.toISOString() ?? new Date().toISOString(),
        });
      })
      .catch(() => {
        /* silent — notification is non-critical */
      });

    this.logger.log('Review created', {
      reviewId: review._id.toString(),
      userId,
      productId: dto.productId,
      rating: dto.rating,
      isVerifiedPurchase: !!order,
    });

    return review.toObject();
  }

  async getProductReviews(query: ReviewQueryDto): Promise<{
    items: ReviewDocument[];
    total: number;
    totalPages: number;
    stats: { avgRating: number; distribution: Record<number, number> };
  }> {
    const {
      productId,
      rating,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
    } = query;

    const filter: Record<string, any> = { status: ReviewStatus.APPROVED };
    if (productId) filter.productId = new Types.ObjectId(productId);
    if (rating) filter.rating = rating;

    const skip = (page - 1) * limit;

    const sortMap: Record<string, Record<string, 1 | -1>> = {
      createdAt: { createdAt: -1 },
      rating: { rating: -1, createdAt: -1 },
      helpful: { helpfulCount: -1, createdAt: -1 },
    };

    const [reviews, total] = await Promise.all([
      this.reviewModel
        .find(filter)
        .select('-__v -adminNote')
        .sort(sortMap[sortBy] ?? { createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'firstName lastName')
        .lean<ReviewDocument[]>(),
      this.reviewModel.countDocuments(filter),
    ]);

    for (const r of reviews) {
      const count = await this.redis.scard(helpfulKey(r._id.toString()));
      r.helpfulCount = count;
    }

    const distBase: Record<string, any> = productId
      ? { productId: new Types.ObjectId(productId) }
      : {};

    const dist = await this.reviewModel.aggregate<{
      _id: number;
      count: number;
    }>([
      { $match: { ...distBase, status: ReviewStatus.APPROVED } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
    ]);

    const distribution: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };
    dist.forEach((d) => (distribution[d._id] = d.count));

    const total5 = Object.values(distribution).reduce((a, b) => a + b, 0);
    const sum5 = Object.entries(distribution).reduce(
      (a, [k, v]) => a + Number(k) * v,
      0,
    );
    const avgRating = total5 ? Math.round((sum5 / total5) * 10) / 10 : 0;

    return {
      items: reviews,
      total,
      totalPages: Math.ceil(total / limit),
      stats: { avgRating, distribution },
    };
  }

  async getMyReviews(userId: string, page = 1, limit = 10) {
    const filter = { userId: new Types.ObjectId(userId) };
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.reviewModel
        .find(filter)
        .select('-__v')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('productId', 'name slug thumbnail')
        .lean<ReviewDocument[]>(),
      this.reviewModel.countDocuments(filter),
    ]);

    return { reviews, total, totalPages: Math.ceil(total / limit) };
  }

  async toggleHelpful(
    userId: string,
    reviewId: string,
  ): Promise<{ helpful: boolean; count: number }> {
    if (!Types.ObjectId.isValid(reviewId))
      throw new BadRequestException('شناسه معتبر نیست');

    const review = await this.reviewModel.findById(reviewId).lean();
    if (!review) throw new NotFoundException('نظر یافت نشد');

    const key = helpfulKey(reviewId);
    const already = await this.redis.sismember(key, userId);

    if (already) {
      await this.redis.srem(key, userId);
    } else {
      await this.redis.sadd(key, userId);
      await this.redis.expire(key, 60 * 60 * 24 * 90);
    }

    const count = await this.redis.scard(key);
    return { helpful: !already, count };
  }

  async adminFindAll(query: ReviewQueryDto): Promise<{
    items: ReviewDocument[];
    total: number;
    totalPages: number;
    pendingCount: number;
  }> {
    const { status, productId, page = 1, limit = 10 } = query;
    const filter: Record<string, any> = {};
    if (status) filter.status = status;
    if (productId) filter.productId = new Types.ObjectId(productId);

    const skip = (page - 1) * limit;

    const [items, total, pendingCount] = await Promise.all([
      this.reviewModel
        .find(filter)
        .select('-__v')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'phone firstName lastName')
        .populate('productId', 'name slug thumbnail')
        .lean<ReviewDocument[]>(),
      this.reviewModel.countDocuments(filter),
      this.reviewModel.countDocuments({ status: ReviewStatus.PENDING }),
    ]);

    return { items, total, totalPages: Math.ceil(total / limit), pendingCount };
  }

  async updateStatus(
    reviewId: string,
    dto: UpdateReviewStatusDto,
  ): Promise<ReviewDocument> {
    if (!Types.ObjectId.isValid(reviewId))
      throw new BadRequestException('شناسه معتبر نیست');

    const review = await this.reviewModel.findById(reviewId);
    if (!review) throw new NotFoundException('نظر یافت نشد');

    if (review.status !== ReviewStatus.PENDING)
      throw new BadRequestException('فقط نظرات در انتظار قابل بررسی هستند');

    review.status = dto.status;
    if (dto.adminNote) review.adminNote = dto.adminNote;
    await review.save();

    if (dto.status === ReviewStatus.APPROVED) {
      await this.recalcProductRating(review.productId.toString());
    }

    this.logger.log('Review status updated', {
      reviewId,
      status: dto.status,
      productId: review.productId.toString(),
    });

    return review.toObject();
  }

  async remove(reviewId: string): Promise<void> {
    if (!Types.ObjectId.isValid(reviewId))
      throw new BadRequestException('شناسه معتبر نیست');

    const review = await this.reviewModel.findByIdAndDelete(reviewId);
    if (!review) throw new NotFoundException('نظر یافت نشد');

    if (review.status === ReviewStatus.APPROVED) {
      await this.recalcProductRating(review.productId.toString());
    }
  }

  private async recalcProductRating(productId: string): Promise<void> {
    const result = await this.reviewModel.aggregate<{
      _id: null;
      avgRating: number;
      reviewCount: number;
    }>([
      {
        $match: {
          productId: new Types.ObjectId(productId),
          status: ReviewStatus.APPROVED,
        },
      },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 },
        },
      },
    ]);

    const avgRating = result[0] ? Math.round(result[0].avgRating * 10) / 10 : 0;
    const reviewCount = result[0]?.reviewCount ?? 0;

    await this.productModel.findByIdAndUpdate(productId, {
      $set: { avgRating, reviewCount },
    });
  }
}
