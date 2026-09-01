import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { AdminService } from './admin.service';
import { User, UserDocument } from '../user/entities/user.schema';
import { Order } from '../order/entities/order.schema';
import { Product } from '../product/entities/product.schema';
import { Transaction } from '../payment/entities/transaction.schema';
import { REDIS_CLIENT } from '../../redis/redis.module';

const userId = new Types.ObjectId().toString();

const mockUser = (overrides: Partial<UserDocument> = {}): UserDocument =>
  ({
    _id: new Types.ObjectId(userId),
    phone: '09121234567',
    isActive: true,
    isAdmin: false,
    ...overrides,
  }) as unknown as UserDocument;

interface MockUserModel {
  countDocuments: jest.Mock;
  findByIdAndUpdate: jest.Mock;
  find: jest.Mock;
  db: {
    db: {
      admin: jest.Mock;
    };
  };
}

interface MockOrderModel {
  countDocuments: jest.Mock;
  aggregate: jest.Mock;
  find: jest.Mock;
}

interface MockProductModel {
  countDocuments: jest.Mock;
  find: jest.Mock;
}

interface MockTxModel {
  aggregate: jest.Mock;
}

interface MockRedis {
  get: jest.Mock;
  setex: jest.Mock;
  keys: jest.Mock;
  del: jest.Mock;
  ping: jest.Mock;
}

describe('AdminService', () => {
  let service: AdminService;
  let userModel: MockUserModel;
  let orderModel: MockOrderModel;
  let productModel: MockProductModel;
  let txModel: MockTxModel;
  let redis: MockRedis;

  const lean = (v: unknown) => ({ lean: jest.fn().mockResolvedValue(v) });
  const selSort = (v: unknown) => ({
    select: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue(lean(v)),
          lean: jest.fn().mockResolvedValue(v),
        }),
        lean: jest.fn().mockResolvedValue(v),
      }),
    }),
  });
  const selLean = (v: unknown) => ({
    select: jest.fn().mockReturnValue(lean(v)),
  });

  beforeEach(async () => {
    userModel = {
      countDocuments: jest.fn().mockResolvedValue(0),
      findByIdAndUpdate: jest.fn(),
      find: jest.fn().mockReturnValue(selSort([])),
      db: {
        db: {
          admin: jest.fn().mockReturnValue({
            ping: jest.fn().mockResolvedValue(true),
          }),
        },
      },
    };

    orderModel = {
      countDocuments: jest.fn().mockResolvedValue(0),
      aggregate: jest.fn().mockResolvedValue([]),
      find: jest.fn().mockReturnValue(selSort([])),
    };

    productModel = {
      countDocuments: jest.fn().mockResolvedValue(0),
      find: jest.fn().mockReturnValue(selSort([])),
    };

    txModel = {
      aggregate: jest.fn().mockResolvedValue([]),
    };

    redis = {
      get: jest.fn().mockResolvedValue(null),
      setex: jest.fn(),
      keys: jest.fn().mockResolvedValue([]),
      del: jest.fn(),
      ping: jest.fn().mockResolvedValue('PONG'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: getModelToken(User.name), useValue: userModel },
        { provide: getModelToken(Order.name), useValue: orderModel },
        { provide: getModelToken(Product.name), useValue: productModel },
        { provide: getModelToken(Transaction.name), useValue: txModel },
        { provide: REDIS_CLIENT, useValue: redis },
      ],
    }).compile();

    service = module.get(AdminService);
    jest.clearAllMocks();
  });

  // ── getDashboard ──────────────────────────────────────────────
  describe('getDashboard', () => {
    it('returns cached dashboard when available', async () => {
      const cached = {
        users: { total: 100 },
        generatedAt: new Date().toISOString(),
      };
      redis.get.mockResolvedValue(JSON.stringify(cached));

      const res = await service.getDashboard();
      expect(res.users.total).toBe(100);
      expect(userModel.countDocuments).not.toHaveBeenCalled();
    });

    it('builds dashboard from DB when cache miss', async () => {
      redis.get.mockResolvedValue(null);
      userModel.countDocuments.mockResolvedValue(50);
      orderModel.aggregate.mockResolvedValue([]);

      const res = await service.getDashboard();
      expect(res.users.total).toBe(50);
      expect(redis.setex).toHaveBeenCalledWith(
        'admin:dashboard',
        expect.any(Number),
        expect.any(String),
      );
    });
  });

  // ── getRevenue ────────────────────────────────────────────────
  describe('getRevenue', () => {
    it('returns revenue grouped by day', async () => {
      redis.get.mockResolvedValue(null);
      orderModel.aggregate.mockResolvedValue([
        { _id: { y: 2025, m: 1, d: 15 }, amount: 5_000_000 },
        { _id: { y: 2025, m: 1, d: 16 }, amount: 3_000_000 },
      ]);

      const res = await service.getRevenue({
        from: '2025-01-01',
        to: '2025-01-31',
      });
      expect(res.total).toBe(8_000_000);
      expect(res.byDay).toHaveLength(2);
      expect(res.byDay[0].date).toBe('2025-01-15');
    });

    it('returns cached revenue', async () => {
      const cached = { total: 999, byDay: [] };
      redis.get.mockResolvedValue(JSON.stringify(cached));

      const res = await service.getRevenue({});
      expect(res.total).toBe(999);
      expect(orderModel.aggregate).not.toHaveBeenCalled();
    });
  });

  // ── getLowStockProducts ───────────────────────────────────────
  describe('getLowStockProducts', () => {
    it('queries products with totalStock <= threshold', async () => {
      productModel.find.mockReturnValue(selSort([]));

      await service.getLowStockProducts(5);
      expect(productModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ totalStock: { $lte: 5 } }),
      );
    });
  });

  // ── promoteToAdmin ────────────────────────────────────────────
  describe('promoteToAdmin', () => {
    it('sets isAdmin to true', async () => {
      userModel.findByIdAndUpdate.mockReturnValue(
        selLean(mockUser({ isAdmin: true })),
      );

      const res = await service.promoteToAdmin(userId);
      expect(res.isAdmin).toBe(true);
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        { role: 'admin', isAdmin: true },
        { new: true },
      );
    });

    it('throws when user not found', async () => {
      userModel.findByIdAndUpdate.mockReturnValue(selLean(null));
      await expect(service.promoteToAdmin(userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── demoteFromAdmin ───────────────────────────────────────────
  describe('demoteFromAdmin', () => {
    it('sets isAdmin to false', async () => {
      userModel.findByIdAndUpdate.mockReturnValue(
        selLean(mockUser({ isAdmin: false })),
      );

      const res = await service.demoteFromAdmin(userId);
      expect(res.isAdmin).toBe(false);
    });
  });

  // ── clearStatsCache ───────────────────────────────────────────
  describe('clearStatsCache', () => {
    it('deletes all admin cache keys', async () => {
      redis.keys.mockResolvedValue(['admin:dashboard', 'admin:revenue:x']);
      const res = await service.clearStatsCache();
      expect(res.cleared).toBe(2);
      expect(redis.del).toHaveBeenCalledWith(
        'admin:dashboard',
        'admin:revenue:x',
      );
    });

    it('returns 0 when no cache keys exist', async () => {
      redis.keys.mockResolvedValue([]);
      const res = await service.clearStatsCache();
      expect(res.cleared).toBe(0);
    });
  });

  // ── healthCheck ───────────────────────────────────────────────
  describe('healthCheck', () => {
    it('returns ok when both DB and Redis are healthy', async () => {
      const res = await service.healthCheck();
      expect(res.status).toBe('ok');
      expect(res.db).toBe('ok');
      expect(res.redis).toBe('ok');
      expect(typeof res.uptime).toBe('number');
    });

    it('returns degraded when Redis fails', async () => {
      redis.ping.mockRejectedValue(new Error('Redis down'));
      const res = await service.healthCheck();
      expect(res.status).toBe('degraded');
      expect(res.redis).toBe('error');
    });

    it('returns degraded when DB fails', async () => {
      userModel.db.db.admin.mockReturnValue({
        ping: jest.fn().mockRejectedValue(new Error('DB down')),
      });
      const res = await service.healthCheck();
      expect(res.status).toBe('degraded');
      expect(res.db).toBe('error');
    });
  });
});
