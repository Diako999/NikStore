import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Types } from 'mongoose';
import { DiscountsService } from './discounts.service';
import { Discount } from './schemas/discount.schema';
import { DiscountUsage } from './schemas/discount-usage.schema';
import { AppLoggerService } from '../common/logger/app-logger.service';
import { REDIS_CLIENT } from '../redis/redis.module';
import { EVENTS } from '../modules/notification/notification.listener';

interface MockDiscountModel {
  create: jest.Mock;
  findOne: jest.Mock;
  findById: jest.Mock;
  findByIdAndUpdate: jest.Mock;
  find: jest.Mock;
  countDocuments: jest.Mock;
  updateOne: jest.Mock;
}

interface MockUsageModel {
  create: jest.Mock;
  countDocuments: jest.Mock;
}

interface MockRedis {
  get: jest.Mock;
  set: jest.Mock;
  del: jest.Mock;
}

interface MockLogger {
  setContext: jest.Mock;
  log: jest.Mock;
  warn: jest.Mock;
  error: jest.Mock;
  debug: jest.Mock;
}

interface MockEventEmitter {
  emit: jest.Mock;
}

interface MockDiscountDoc {
  _id: Types.ObjectId;
  title: string;
  discountType: 'percentage' | 'fixed';
  value: number;
  code: string | null;
  endDate: Date | null;
  targetType: string;
  targetIds: Types.ObjectId[];
  isActive: boolean;
  usageCount: number;
  toObject: () => Record<string, unknown>;
}

const MOCK_REDIS: MockRedis = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
};

const MOCK_LOGGER: MockLogger = {
  setContext: jest.fn(),
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

function makeDiscount(
  overrides: Partial<Omit<MockDiscountDoc, 'toObject'>> = {},
): MockDiscountDoc {
  const id = new Types.ObjectId();
  const base: Omit<MockDiscountDoc, 'toObject'> = {
    _id: id,
    title: 'تخفیف ویژه',
    discountType: 'percentage',
    value: 20,
    code: null,
    endDate: null,
    targetType: 'all',
    targetIds: [],
    isActive: true,
    usageCount: 0,
    ...overrides,
  };
  return {
    ...base,
    toObject: () => ({ ...base }),
  };
}

describe('DiscountsService — discount created notification', () => {
  let service: DiscountsService;
  let discountModel: MockDiscountModel;
  let eventEmitter: MockEventEmitter;

  beforeEach(async () => {
    discountModel = {
      create: jest.fn(),
      findOne: jest
        .fn()
        .mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      find: jest.fn(),
      countDocuments: jest.fn(),
      updateOne: jest.fn().mockResolvedValue({}),
    };

    const usageModel: MockUsageModel = {
      create: jest.fn(),
      countDocuments: jest.fn().mockResolvedValue(0),
    };

    eventEmitter = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscountsService,
        { provide: getModelToken(Discount.name), useValue: discountModel },
        { provide: getModelToken(DiscountUsage.name), useValue: usageModel },
        { provide: REDIS_CLIENT, useValue: MOCK_REDIS },
        { provide: AppLoggerService, useValue: MOCK_LOGGER },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get(DiscountsService);
    jest.clearAllMocks();
  });

  // ── create — notification event ───────────────────────────────

  it('emits DISCOUNT_CREATED after creating an auto-apply discount', async () => {
    const doc = makeDiscount({ code: null });
    discountModel.create.mockResolvedValue(doc);

    await service.create({
      title: 'تخفیف ویژه',
      discountType: 'percentage',
      value: 20,
      targetType: 'all',
      targetIds: [],
    });

    expect(eventEmitter.emit).toHaveBeenCalledWith(
      EVENTS.DISCOUNT_CREATED,
      expect.objectContaining({
        isCoupon: false,
        code: null,
      }),
    );
  });

  it('emits DISCOUNT_CREATED with isCoupon=true when code is set', async () => {
    const doc = makeDiscount({ code: 'SAVE20' });
    discountModel.create.mockResolvedValue(doc);

    await service.create({
      title: 'کد تخفیف',
      code: 'SAVE20',
      discountType: 'percentage',
      value: 20,
      targetType: 'all',
      targetIds: [],
    });

    expect(eventEmitter.emit).toHaveBeenCalledWith(
      EVENTS.DISCOUNT_CREATED,
      expect.objectContaining({ isCoupon: true, code: 'SAVE20' }),
    );
  });

  it('emits DISCOUNT_CREATED with endDate when discount is time-limited', async () => {
    const endDate = new Date('2026-08-01');
    const doc = makeDiscount({ code: null, endDate });
    discountModel.create.mockResolvedValue(doc);

    await service.create({
      title: 'تخفیف موقت',
      discountType: 'percentage',
      value: 15,
      targetType: 'all',
      targetIds: [],
      startDate: '2026-07-01',
      endDate: '2026-08-01',
    });

    expect(eventEmitter.emit).toHaveBeenCalledWith(
      EVENTS.DISCOUNT_CREATED,
      expect.objectContaining({ endDate }),
    );
  });

  it('includes correct discountId in emitted event', async () => {
    const id = new Types.ObjectId();
    const doc = makeDiscount({ _id: id });
    discountModel.create.mockResolvedValue(doc);

    await service.create({
      title: 'تخفیف',
      discountType: 'percentage',
      value: 10,
      targetType: 'all',
      targetIds: [],
    });

    expect(eventEmitter.emit).toHaveBeenCalledWith(
      EVENTS.DISCOUNT_CREATED,
      expect.objectContaining({ discountId: id.toString() }),
    );
  });

  // ── create — guard checks ──────────────────────────────────────

  it('throws BadRequestException when endDate is before startDate', async () => {
    await expect(
      service.create({
        title: 'تخفیف',
        discountType: 'percentage',
        value: 10,
        targetType: 'all',
        targetIds: [],
        startDate: '2026-08-01',
        endDate: '2026-07-01',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(eventEmitter.emit).not.toHaveBeenCalled();
  });

  it('throws ConflictException when code already exists', async () => {
    discountModel.findOne.mockReturnValue({
      lean: jest
        .fn()
        .mockResolvedValue({ _id: new Types.ObjectId(), code: 'DUP' }),
    });

    await expect(
      service.create({
        title: 'تخفیف',
        code: 'DUP',
        discountType: 'percentage',
        value: 10,
        targetType: 'all',
        targetIds: [],
      }),
    ).rejects.toThrow(ConflictException);

    expect(eventEmitter.emit).not.toHaveBeenCalled();
  });

  it('does NOT emit event when creation throws', async () => {
    discountModel.create.mockRejectedValue(new Error('db error'));

    await expect(
      service.create({
        title: 'تخفیف',
        discountType: 'percentage',
        value: 10,
        targetType: 'all',
        targetIds: [],
      }),
    ).rejects.toThrow('db error');

    expect(eventEmitter.emit).not.toHaveBeenCalled();
  });
});
