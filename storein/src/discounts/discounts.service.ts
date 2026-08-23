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
import { EventEmitter2 } from '@nestjs/event-emitter';
import { REDIS_CLIENT } from '../redis/redis.module';
import { Discount, DiscountDocument } from './schemas/discount.schema';
import { DiscountUsage, DiscountUsageDocument } from './schemas/discount-usage.schema';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { AppLoggerService } from '../common/logger/app-logger.service';
import {
  EVENTS,
  DiscountCreatedEvent,
} from '../modules/notification/notification.listener';

const CACHE_KEY = 'active_discounts';
const CACHE_TTL = 300;

export interface DiscountPriceResult {
  finalPrice:         number;
  discountAmount:     number;
  discountPercentage: number;
  activeDiscount:     { id: string; endDate: Date | null } | null;
}

export interface PaginatedDiscounts {
  discounts:   DiscountDocument[];
  total:       number;
  totalPages:  number;
}

export interface CouponValidateResult {
  isValid:        boolean;
  discountAmount: number;
  message:        string;
  discountId?:    string;
}

@Injectable()
export class DiscountsService {
  constructor(
    @InjectModel(Discount.name)
    private readonly discountModel: Model<DiscountDocument>,
    @InjectModel(DiscountUsage.name)
    private readonly usageModel: Model<DiscountUsageDocument>,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly logger: AppLoggerService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.logger.setContext('DiscountsService');
  }

  // ── CRUD ──────────────────────────────────────────────────────

  async create(dto: CreateDiscountDto): Promise<DiscountDocument> {
    // Validate date range
    if (dto.startDate && dto.endDate) {
      if (new Date(dto.startDate) >= new Date(dto.endDate))
        throw new BadRequestException('تاریخ پایان باید بعد از تاریخ شروع باشد');
    }

    // Check code uniqueness if provided
    if (dto.code) {
      const normalizedCode = dto.code.toUpperCase().trim();
      const existing = await this.discountModel
        .findOne({ code: normalizedCode })
        .lean();
      if (existing)
        throw new ConflictException(`کد تخفیف "${normalizedCode}" قبلاً ثبت شده است`);
    }

    const discount = await this.discountModel.create({
      ...dto,
      code:              dto.code ? dto.code.toUpperCase().trim() : null,
      kind:              null,  // deprecated — null for all new records
      targetIds:         (dto.targetIds ?? []).map((id) => new Types.ObjectId(id)),
      maxDiscountAmount: dto.maxDiscountAmount ?? null,
      minOrderAmount:    dto.minOrderAmount    ?? null,
      minQuantity:       dto.minQuantity       ?? null,
      maxUsageCount:     dto.maxUsageCount     ?? null,
      perUserLimit:      dto.perUserLimit      ?? 1,
      startDate:         dto.startDate ? new Date(dto.startDate) : null,
      endDate:           dto.endDate   ? new Date(dto.endDate)   : null,
      priority:          dto.priority  ?? 0,
    });

    await this.invalidateCache();
    this.logger.log('Discount created', {
      id:    (discount._id as any).toString(),
      code:  dto.code ?? 'auto-apply',
      title: dto.title,
    });

    const discountObj = discount.toObject() as DiscountDocument;

    // Fire-and-forget: notify eligible users about the new discount/coupon
    const notifEvent: DiscountCreatedEvent = {
      discountId:    (discount._id as any).toString(),
      title:         discount.title,
      discountType:  discount.discountType,
      value:         discount.value,
      isCoupon:      !!discount.code,
      code:          discount.code ?? null,
      endDate:       discount.endDate ?? null,
    };
    this.eventEmitter.emit(EVENTS.DISCOUNT_CREATED, notifEvent);
    this.logger.log('Discount notification event emitted', {
      id:       notifEvent.discountId,
      isCoupon: notifEvent.isCoupon,
    });

    return discountObj;
  }

  async findAll(query: {
    page:      number;
    limit:     number;
    isActive?: boolean;
    kind?:     string;     // backward compat
    hasCode?:  boolean;    // true → only coupons; false → only auto-apply
  }): Promise<PaginatedDiscounts> {
    const { page = 1, limit = 20, isActive, kind, hasCode } = query;
    const filter: Record<string, any> = {};

    if (isActive !== undefined) filter.isActive = isActive;

    // hasCode takes priority over kind for new UI; kind kept for backward compat
    if (hasCode === true || kind === 'coupon') {
      filter.code = { $ne: null };
    } else if (hasCode === false) {
      filter.code = null;
    } else if (kind === 'time_limited') {
      filter.code      = null;
      filter.startDate = { $ne: null };
    }

    const skip = (page - 1) * limit;
    const [discounts, total] = await Promise.all([
      this.discountModel
        .find(filter)
        .select('-__v')
        .sort({ priority: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<DiscountDocument[]>(),
      this.discountModel.countDocuments(filter),
    ]);

    return { discounts, total, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string): Promise<DiscountDocument> {
    this.assertId(id);
    const discount = await this.discountModel
      .findById(id)
      .select('-__v')
      .lean<DiscountDocument>();
    if (!discount) throw new NotFoundException('تخفیف یافت نشد');
    return discount;
  }

  async update(id: string, dto: UpdateDiscountDto): Promise<DiscountDocument> {
    this.assertId(id);

    if (dto.startDate && dto.endDate) {
      if (new Date(dto.startDate) >= new Date(dto.endDate))
        throw new BadRequestException('تاریخ پایان باید بعد از تاریخ شروع باشد');
    }

    // Check code uniqueness on update (exclude self)
    if (dto.code) {
      const normalizedCode = dto.code.toUpperCase().trim();
      const existing = await this.discountModel
        .findOne({ code: normalizedCode, _id: { $ne: new Types.ObjectId(id) } })
        .lean();
      if (existing)
        throw new ConflictException(`کد تخفیف "${normalizedCode}" قبلاً ثبت شده است`);
    }

    const updateData: Record<string, any> = { ...dto };
    if (dto.code !== undefined)
      updateData.code = dto.code ? dto.code.toUpperCase().trim() : null;
    if (dto.targetIds)
      updateData.targetIds = dto.targetIds.map((i) => new Types.ObjectId(i));
    if (dto.startDate !== undefined)
      updateData.startDate = dto.startDate ? new Date(dto.startDate) : null;
    if (dto.endDate !== undefined)
      updateData.endDate = dto.endDate ? new Date(dto.endDate) : null;

    const updated = await this.discountModel
      .findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true })
      .select('-__v')
      .lean<DiscountDocument>();

    if (!updated) throw new NotFoundException('تخفیف یافت نشد');
    await this.invalidateCache();
    this.logger.log('Discount updated', { id });
    return updated;
  }

  async softDelete(id: string): Promise<void> {
    this.assertId(id);
    const result = await this.discountModel.findByIdAndUpdate(
      id,
      { $set: { isActive: false } },
    );
    if (!result) throw new NotFoundException('تخفیف یافت نشد');
    await this.invalidateCache();
    this.logger.log('Discount soft-deleted', { id });
  }

  async toggle(id: string): Promise<DiscountDocument> {
    this.assertId(id);
    const discount = await this.discountModel.findById(id);
    if (!discount) throw new NotFoundException('تخفیف یافت نشد');
    discount.isActive = !discount.isActive;
    await discount.save();
    await this.invalidateCache();
    this.logger.log('Discount toggled', { id, isActive: discount.isActive });
    return discount.toObject() as DiscountDocument;
  }

  // ── Active discounts (auto-apply, no code) ────────────────────

  async getActiveDiscounts(): Promise<DiscountDocument[]> {
    const cached = await this.redis.get(CACHE_KEY);
    if (cached) return JSON.parse(cached);
    return this.refreshCache();
  }

  async refreshCache(): Promise<DiscountDocument[]> {
    const now = new Date();

    // Only auto-apply discounts (code = null) enter the public cache
    const active = await this.discountModel
      .find({
        isActive: true,
        code:     null,
        $or: [
          // No time restriction → always active
          { startDate: null, endDate: null },
          // Within valid date range
          {
            startDate: { $lte: now },
            endDate:   { $gte: now },
            $or: [
              { maxUsageCount: null },
              { $expr: { $lt: ['$usageCount', '$maxUsageCount'] } },
            ],
          },
        ],
      })
      .select('-__v')
      .lean<DiscountDocument[]>();

    await this.redis.set(CACHE_KEY, JSON.stringify(active), 'EX', CACHE_TTL);
    this.logger.log(`Cache refreshed: ${active.length} active auto-apply discounts`);
    return active;
  }

  // ── Coupon validation ─────────────────────────────────────────

  async validateCoupon(
    userId: string,
    code:   string,
    cartTotal: number,
  ): Promise<CouponValidateResult> {
    const discount = await this.discountModel
      .findOne({ code: code.toUpperCase().trim(), isActive: true })
      .lean<DiscountDocument>();

    if (!discount)
      return { isValid: false, discountAmount: 0, message: 'کد تخفیف یافت نشد' };

    const now = new Date();

    if (discount.startDate && now < new Date(discount.startDate))
      return { isValid: false, discountAmount: 0, message: 'کد تخفیف هنوز فعال نشده است' };

    if (discount.endDate && now > new Date(discount.endDate))
      return { isValid: false, discountAmount: 0, message: 'کد تخفیف منقضی شده است' };

    if (discount.minOrderAmount && cartTotal < discount.minOrderAmount)
      return {
        isValid: false, discountAmount: 0,
        message: `حداقل مبلغ سفارش برای این کد: ${discount.minOrderAmount.toLocaleString()} تومان`,
      };

    if (discount.maxUsageCount && discount.usageCount >= discount.maxUsageCount)
      return { isValid: false, discountAmount: 0, message: 'ظرفیت این کد تخفیف تکمیل شده است' };

    // Per-user limit check
    const perUserLimit = discount.perUserLimit ?? 1;
    const userUsageCount = await this.usageModel.countDocuments({
      discountId: (discount as any)._id,
      userId:     new Types.ObjectId(userId),
    });
    if (userUsageCount >= perUserLimit)
      return { isValid: false, discountAmount: 0, message: 'شما قبلاً از این کد تخفیف استفاده کرده‌اید' };

    // Calculate discount amount
    let amount: number;
    if (discount.discountType === 'percentage') {
      const raw = Math.floor((cartTotal * discount.value) / 100);
      amount = discount.maxDiscountAmount
        ? Math.min(raw, discount.maxDiscountAmount)
        : raw;
    } else {
      amount = Math.min(discount.value, cartTotal);
    }

    this.logger.log('Coupon validated', { code, userId, cartTotal, discountAmount: amount });

    return {
      isValid:        true,
      discountAmount: amount,
      message:        `تخفیف ${amount.toLocaleString()} تومان اعمال می‌شود`,
      discountId:     (discount as any)._id.toString(),
    };
  }

  async recordCouponUsage(
    discountId:     string,
    userId:         string,
    orderId:        string,
    discountAmount: number,
  ): Promise<void> {
    await Promise.all([
      this.usageModel.create({
        discountId:     new Types.ObjectId(discountId),
        userId:         new Types.ObjectId(userId),
        orderId:        new Types.ObjectId(orderId),
        discountAmount,
      }),
      // TODO: per-user race (TOCTOU between validateCoupon countDocuments and here)
      // requires unique compound index on (discountId, userId) or a Mongoose transaction.
      this.discountModel.updateOne(
        {
          _id: new Types.ObjectId(discountId),
          $expr: { $lt: ['$usageCount', { $ifNull: ['$maxUsageCount', Number.MAX_SAFE_INTEGER] }] },
        },
        { $inc: { usageCount: 1 } },
      ),
    ]);
    this.logger.log('Coupon usage recorded', { discountId, userId, orderId });
  }

  // ── Price calculation (for product service) ───────────────────

  async calculateDiscountedPrice(params: {
    originalPrice:  number;
    productId:      string;
    categoryId:     string;
    brandId?:       string;
    quantity?:      number;
  }): Promise<DiscountPriceResult> {
    const { originalPrice, productId, categoryId, brandId, quantity } = params;

    const basePrice = originalPrice;

    const activeDiscounts = await this.getActiveDiscounts();
    const now = new Date();

    const applicable = activeDiscounts.filter((d) => {
      // Target check
      const targetMatch =
        d.targetType === 'all' ||
        (d.targetType === 'products'   && d.targetIds.some((id) => id.toString() === productId)) ||
        (d.targetType === 'categories' && d.targetIds.some((id) => id.toString() === categoryId)) ||
        (d.targetType === 'brands'     && brandId && (d.brandIds ?? []).some((id) => id.toString() === brandId)) ||
        (d.targetType === 'brand_category' && (
          d.targetIds.some((id) => id.toString() === categoryId) ||
          (brandId && (d.brandIds ?? []).some((id) => id.toString() === brandId))
        ));
      if (!targetMatch) return false;

      // Time-limited check
      if (d.startDate && d.endDate) {
        if (now < new Date(d.startDate) || now > new Date(d.endDate)) return false;
      }

      // Quantity check
      if (d.minQuantity && (!quantity || quantity < d.minQuantity)) return false;

      return true;
    });

    if (!applicable.length) {
      return { finalPrice: basePrice, discountAmount: 0, discountPercentage: 0, activeDiscount: null };
    }

    // Pick best discount (highest priority, then highest amount)
    let best: { amount: number; discount: DiscountDocument; priority: number } | null = null;

    for (const d of applicable) {
      let amount: number;
      if (d.discountType === 'percentage') {
        const raw = Math.floor((basePrice * d.value) / 100);
        amount = d.maxDiscountAmount ? Math.min(raw, d.maxDiscountAmount) : raw;
      } else {
        amount = Math.min(d.value, basePrice);
      }
      const prio = d.priority ?? 0;
      if (!best || prio > best.priority || (prio === best.priority && amount > best.amount)) {
        best = { amount, discount: d, priority: prio };
      }
    }

    const discountAmount    = best!.amount;
    const finalPrice        = Math.max(0, basePrice - discountAmount);
    const discountPercentage = basePrice > 0 ? Math.round((discountAmount / basePrice) * 100) : 0;

    return {
      finalPrice,
      discountAmount,
      discountPercentage,
      activeDiscount: {
        id:      (best!.discount._id as any).toString(),
        endDate: best!.discount.endDate ?? null,
      },
    };
  }

  async invalidateCache(): Promise<void> {
    await this.redis.del(CACHE_KEY);
  }

  async incrementUsage(discountId: string): Promise<void> {
    await this.discountModel.updateOne(
      { _id: new Types.ObjectId(discountId) },
      { $inc: { usageCount: 1 } },
    );
  }

  private assertId(id: string): void {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('شناسه معتبر نیست');
  }
}
