import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../redis/redis.module';
import { User, UserDocument, UserRole } from '../user/entities/user.schema';
import { Order, OrderDocument, OrderStatus } from '../order/entities/order.schema';
import { Product, ProductDocument, ProductStatus } from '../product/entities/product.schema';
import { Transaction, TransactionDocument } from '../payment/entities/transaction.schema';
import { DateRangeDto } from './dto/date-range.dto';

const CACHE_TTL      = 60 * 5;
const DASHBOARD_KEY  = 'admin:dashboard';
const REVENUE_PREFIX = 'admin:revenue:';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectModel(User.name)        private userModel:    Model<UserDocument>,
    @InjectModel(Order.name)       private orderModel:   Model<OrderDocument>,
    @InjectModel(Product.name)     private productModel: Model<ProductDocument>,
    @InjectModel(Transaction.name) private txModel:      Model<TransactionDocument>,
    @Inject(REDIS_CLIENT)          private redis:        Redis,
  ) {}

  // ── Dashboard Overview ────────────────────────────────────────
  async getDashboard(): Promise<any> {
    const cached = await this.redis.get(DASHBOARD_KEY);
    if (cached) return JSON.parse(cached);

    const now        = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalUsers,
      activeUsers,
      newUsersThisMonth,
      ordersByStatus,
      revenueAll,
      revenueMonth,
      revenueToday,
      totalProducts,
      activeProducts,
      lowStockCount,
    ] = await Promise.all([
      this.userModel.countDocuments(),
      this.userModel.countDocuments({ isActive: true }),
      this.userModel.countDocuments({ createdAt: { $gte: monthStart } }),

      this.orderModel.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),

      this.orderModel.aggregate([
        { $match: { status: { $nin: [OrderStatus.PENDING, OrderStatus.CANCELLED] } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      this.orderModel.aggregate([
        {
          $match: {
            status:    { $nin: [OrderStatus.PENDING, OrderStatus.CANCELLED] },
            createdAt: { $gte: monthStart },
          },
        },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      this.orderModel.aggregate([
        {
          $match: {
            status:    { $nin: [OrderStatus.PENDING, OrderStatus.CANCELLED] },
            createdAt: { $gte: todayStart },
          },
        },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),

      this.productModel.countDocuments(),
      this.productModel.countDocuments({ status: ProductStatus.ACTIVE }),
      this.productModel.countDocuments({ totalStock: { $lte: 5 }, status: ProductStatus.ACTIVE }),
    ]);

    const orders: Record<string, number> = {};
    ordersByStatus.forEach((s: any) => (orders[s._id] = s.count));

    const dashboard = {
      users: {
        total:        totalUsers,
        active:       activeUsers,
        newThisMonth: newUsersThisMonth,
      },
      orders: {
        ...orders,
        total: Object.values(orders).reduce((a, b) => a + b, 0),
      },
      revenue: {
        allTime:   revenueAll[0]?.total   ?? 0,
        thisMonth: revenueMonth[0]?.total ?? 0,
        today:     revenueToday[0]?.total ?? 0,
      },
      products: {
        total:    totalProducts,
        active:   activeProducts,
        lowStock: lowStockCount,
      },
      generatedAt: new Date().toISOString(),
    };

    await this.redis.setex(DASHBOARD_KEY, CACHE_TTL, JSON.stringify(dashboard));
    return dashboard;
  }

  // ── Revenue by Period ─────────────────────────────────────────
  async getRevenue(dto: DateRangeDto): Promise<{
    total: number;
    byDay: { date: string; amount: number }[];
  }> {
    const from = dto.from ? new Date(dto.from) : this.daysAgo(30);
    const to   = dto.to   ? new Date(dto.to)   : new Date();

    const cacheKey = `${REVENUE_PREFIX}${from.toISOString()}:${to.toISOString()}`;
    const cached   = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const result = await this.orderModel.aggregate([
      {
        $match: {
          // سفارشات پرداخت‌شده: همه وضعیت‌ها به‌جز pending و cancelled
          status:    { $nin: [OrderStatus.PENDING, OrderStatus.CANCELLED] },
          createdAt: { $gte: from, $lte: to },
        },
      },
      {
        $group: {
          _id: {
            y: { $year:        '$createdAt' },
            m: { $month:       '$createdAt' },
            d: { $dayOfMonth:  '$createdAt' },
          },
          amount: { $sum: '$total' },
          count:  { $sum: 1 },
        },
      },
      { $sort: { '_id.y': 1, '_id.m': 1, '_id.d': 1 } },
    ]);

    const byDay = result.map((r: any) => ({
      date:   `${r._id.y}-${String(r._id.m).padStart(2, '0')}-${String(r._id.d).padStart(2, '0')}`,
      amount: r.amount,
      count:  r.count,
    }));

    const total = byDay.reduce((s, d) => s + d.amount, 0);
    const data  = { total, byDay };

    await this.redis.setex(cacheKey, CACHE_TTL, JSON.stringify(data));
    return data;
  }

  // ── Order Stats ───────────────────────────────────────────────
  async getOrderStats(): Promise<any> {
    const now        = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [monthly, today, avgValue] = await Promise.all([
      this.orderModel.countDocuments({ createdAt: { $gte: monthStart } }),
      this.orderModel.countDocuments({ createdAt: { $gte: todayStart } }),
      this.orderModel.aggregate([
        { $match: { status: OrderStatus.DELIVERED } },
        { $group: { _id: null, avg: { $avg: '$total' } } },
      ]),
    ]);

    return {
      thisMonth:     monthly,
      today,
      avgOrderValue: Math.round(avgValue[0]?.avg ?? 0),
    };
  }

  // ── Low Stock Products ────────────────────────────────────────
  async getLowStockProducts(threshold = 10): Promise<ProductDocument[]> {
    return this.productModel
      .find({ totalStock: { $lte: threshold }, status: ProductStatus.ACTIVE })
      .select('name slug thumbnail totalStock minPrice variants')
      .sort({ totalStock: 1 })
      .limit(50)
      .lean<ProductDocument[]>();
  }

  // ── Top Selling Products ──────────────────────────────────────
  async getTopProducts(limit = 10): Promise<ProductDocument[]> {
    return this.productModel
      .find({ status: ProductStatus.ACTIVE })
      .select('name slug thumbnail soldCount minPrice avgRating')
      .sort({ soldCount: -1 })
      .limit(limit)
      .lean<ProductDocument[]>();
  }

  // ── Recent Orders ─────────────────────────────────────────────
  async getRecentOrders(limit = 10): Promise<OrderDocument[]> {
    return this.orderModel
      .find()
      .select('orderNumber userId status total createdAt')
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('userId', 'phone firstName lastName')
      .lean<OrderDocument[]>();
  }

  // ── User Management ───────────────────────────────────────────
  async setUserRole(userId: string, role: string): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(userId))
      throw new NotFoundException('کاربر یافت نشد');
    if (!Object.values(UserRole).includes(role as UserRole))
      throw new BadRequestException(`نقش نامعتبر: ${role}`);

    const isAdmin = role === UserRole.ADMIN;
    const user = await this.userModel
      .findByIdAndUpdate(userId, { role, isAdmin }, { new: true })
      .select('-__v')
      .lean<UserDocument>();

    if (!user) throw new NotFoundException('کاربر یافت نشد');
    this.logger.log(`User ${userId} role set to ${role}`);
    return user;
  }

  async setPermissions(userId: string, permissions: string[]): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(userId))
      throw new NotFoundException('کاربر یافت نشد');
    const user = await this.userModel
      .findByIdAndUpdate(userId, { permissions }, { new: true })
      .select('-__v')
      .lean<UserDocument>();
    if (!user) throw new NotFoundException('کاربر یافت نشد');
    this.logger.log(`User ${userId} permissions: [${permissions.join(', ')}]`);
    return user;
  }

  async promoteToAdmin(userId: string): Promise<UserDocument> {
    return this.setUserRole(userId, UserRole.ADMIN);
  }

  async demoteFromAdmin(userId: string): Promise<UserDocument> {
    return this.setUserRole(userId, UserRole.USER);
  }

  async getAdminUsers(): Promise<UserDocument[]> {
    return this.userModel
      .find({ $or: [{ isAdmin: true }, { role: UserRole.MANAGER }] })
      .select('phone firstName lastName isAdmin role isActive createdAt')
      .lean<UserDocument[]>();
  }

  // ── Cache Management ──────────────────────────────────────────
  async clearStatsCache(): Promise<{ cleared: number }> {
    const keys = await this.redis.keys('admin:*');
    if (keys.length > 0) await this.redis.del(...keys);
    this.logger.log(`Cleared ${keys.length} admin cache keys`);
    return { cleared: keys.length };
  }

  async getCacheInfo(): Promise<{ adminKeys: number; keys: string[] }> {
    const keys = await this.redis.keys('admin:*');
    return { adminKeys: keys.length, keys };
  }

  // ── Health Check ──────────────────────────────────────────────
  async healthCheck(): Promise<{
    status:  'ok' | 'degraded';
    db:      string;
    redis:   string;
    uptime:  number;
  }> {
    let dbStatus    = 'ok';
    let redisStatus = 'ok';

    try {
      await this.userModel.db.db!.admin().ping();
    } catch {
      dbStatus = 'error';
    }

    try {
      await this.redis.ping();
    } catch {
      redisStatus = 'error';
    }

    const status =
      dbStatus === 'ok' && redisStatus === 'ok' ? 'ok' : 'degraded';

    return {
      status,
      db:     dbStatus,
      redis:  redisStatus,
      uptime: Math.floor(process.uptime()),
    };
  }

  private daysAgo(days: number): Date {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
  }
}
