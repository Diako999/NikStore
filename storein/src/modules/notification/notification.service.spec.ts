import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { NotificationService } from './notification.service';
import { Notification, NotificationType } from './entities/notification.schema';
import { BroadcastLog } from './entities/broadcast-log.schema';
import { SmsLog } from './entities/sms-log.schema';
import {
  ChannelPayload,
  PushNotificationChannel,
  SmsNotificationChannel,
} from './channels/notification-channel.abstract';
import { NotificationsGateway } from '../../common/gateway/notifications.gateway';

const userId = new Types.ObjectId().toString();
const notifId = new Types.ObjectId().toString();

interface MockNotif {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  readAt: Date | null;
}

type MockNotifRecord = MockNotif & { toObject: () => MockNotif };

const mockNotif = (overrides: Partial<MockNotif> = {}): MockNotif => ({
  _id: new Types.ObjectId(notifId),
  userId: new Types.ObjectId(userId),
  type: NotificationType.ORDER_UPDATE,
  title: 'سفارش ORD-001',
  body: 'وضعیت سفارش شما تایید شد',
  data: null,
  isRead: false,
  readAt: null,
  ...overrides,
});

interface BroadcastLogRow {
  _id: Types.ObjectId;
  type: NotificationType;
  title: string;
  body: string;
  target: string;
  sent: number;
}

interface SmsLogRow {
  _id: Types.ObjectId;
  target: string;
  phone: string | null;
  message: string;
  sent: number;
  failed: number;
}

interface UserRow {
  _id?: Types.ObjectId;
  phone?: string | null;
}

// ── Generic chainable-query mock helpers ─────────────────────────
interface LeanChain<T> {
  lean: jest.Mock<Promise<T>, []>;
}

interface LimitChain<T> {
  limit: jest.Mock<LeanChain<T>, [number]>;
}

interface SkipChain<T> {
  skip: jest.Mock<LimitChain<T>, [number]>;
}

interface SortChain<T> {
  sort: jest.Mock<SkipChain<T>, [Record<string, number>]>;
}

interface FullChain<T> {
  select: jest.Mock<SortChain<T>, [string]>;
}

interface UserSubModel {
  find: jest.Mock<
    { select: jest.Mock<LeanChain<UserRow[]>, [string]> },
    [Record<string, unknown>]
  >;
}

function leanChain<T>(val: T): LeanChain<T> {
  return { lean: jest.fn<Promise<T>, []>().mockResolvedValue(val) };
}

function limitChain<T>(val: T): LimitChain<T> {
  return {
    limit: jest.fn<LeanChain<T>, [number]>().mockReturnValue(leanChain(val)),
  };
}

function skipChain<T>(val: T): SkipChain<T> {
  return {
    skip: jest.fn<LimitChain<T>, [number]>().mockReturnValue(limitChain(val)),
  };
}

function sortChain<T>(val: T): SortChain<T> {
  return {
    sort: jest
      .fn<SkipChain<T>, [Record<string, number>]>()
      .mockReturnValue(skipChain(val)),
  };
}

function fullChain<T>(val: T): FullChain<T> {
  return {
    select: jest.fn<SortChain<T>, [string]>().mockReturnValue(sortChain(val)),
  };
}

// Alias kept for readability at call sites that mirror the log-listing chain
// (find().sort().skip().limit().lean() — no `.select()` step).
const logListChain = sortChain;

interface NotifModelMock {
  create: jest.Mock<Promise<MockNotifRecord>, [Record<string, unknown>]>;
  find: jest.Mock<FullChain<MockNotif[]>, [Record<string, unknown>]>;
  findOneAndUpdate: jest.Mock<
    LeanChain<MockNotif | null>,
    [Record<string, unknown>, Record<string, unknown>, Record<string, unknown>]
  >;
  findByIdAndDelete: jest.Mock<Promise<unknown>, [string]>;
  updateMany: jest.Mock<
    Promise<{ modifiedCount: number }>,
    [Record<string, unknown>, Record<string, unknown>]
  >;
  countDocuments: jest.Mock<Promise<number>, [Record<string, unknown>?]>;
  insertMany: jest.Mock<
    Promise<unknown[]>,
    [unknown[], Record<string, unknown>?]
  >;
  db: {
    model: jest.Mock<UserSubModel, [string]>;
  };
}

interface BroadcastLogModelMock {
  create: jest.Mock<Promise<unknown>, [Record<string, unknown>]>;
  find: jest.Mock<SortChain<BroadcastLogRow[]>, []>;
  countDocuments: jest.Mock<Promise<number>, [Record<string, unknown>?]>;
  findByIdAndDelete: jest.Mock<Promise<unknown>, [string]>;
}

interface SmsLogModelMock {
  create: jest.Mock<Promise<unknown>, [Record<string, unknown>]>;
  find: jest.Mock<SortChain<SmsLogRow[]>, []>;
  countDocuments: jest.Mock<Promise<number>, [Record<string, unknown>?]>;
}

interface MockSmsChannel {
  send: jest.Mock<Promise<void>, [string, string]>;
}

interface MockPushChannel {
  send: jest.Mock<Promise<void>, [ChannelPayload]>;
}

describe('NotificationService', () => {
  let service: NotificationService;
  let notifModel: NotifModelMock;
  let broadcastLogModel: BroadcastLogModelMock;
  let smsLogModel: SmsLogModelMock;
  let smsChannel: MockSmsChannel;
  let pushChannel: MockPushChannel;
  let gateway: { emitToUser: jest.Mock; emitBroadcast: jest.Mock };

  function mockUserSubModel(users: UserRow[]): UserSubModel {
    return {
      find: jest
        .fn<
          { select: jest.Mock<LeanChain<UserRow[]>, [string]> },
          [Record<string, unknown>]
        >()
        .mockReturnValue({
          select: jest
            .fn<LeanChain<UserRow[]>, [string]>()
            .mockReturnValue(leanChain(users)),
        }),
    };
  }

  beforeEach(async () => {
    notifModel = {
      create: jest.fn<Promise<MockNotifRecord>, [Record<string, unknown>]>(),
      find: jest
        .fn<FullChain<MockNotif[]>, [Record<string, unknown>]>()
        .mockReturnValue(fullChain([])),
      findOneAndUpdate: jest.fn<
        LeanChain<MockNotif | null>,
        [
          Record<string, unknown>,
          Record<string, unknown>,
          Record<string, unknown>,
        ]
      >(),
      findByIdAndDelete: jest.fn<Promise<unknown>, [string]>(),
      updateMany: jest
        .fn<
          Promise<{ modifiedCount: number }>,
          [Record<string, unknown>, Record<string, unknown>]
        >()
        .mockResolvedValue({ modifiedCount: 0 }),
      countDocuments: jest
        .fn<Promise<number>, [Record<string, unknown>?]>()
        .mockResolvedValue(0),
      insertMany: jest
        .fn<Promise<unknown[]>, [unknown[], Record<string, unknown>?]>()
        .mockResolvedValue([]),
      db: {
        model: jest
          .fn<UserSubModel, [string]>()
          .mockReturnValue(mockUserSubModel([])),
      },
    };

    broadcastLogModel = {
      create: jest
        .fn<Promise<unknown>, [Record<string, unknown>]>()
        .mockResolvedValue({}),
      find: jest
        .fn<SortChain<BroadcastLogRow[]>, []>()
        .mockReturnValue(logListChain([])),
      countDocuments: jest
        .fn<Promise<number>, [Record<string, unknown>?]>()
        .mockResolvedValue(0),
      findByIdAndDelete: jest.fn<Promise<unknown>, [string]>(),
    };

    smsLogModel = {
      create: jest
        .fn<Promise<unknown>, [Record<string, unknown>]>()
        .mockResolvedValue({}),
      find: jest
        .fn<SortChain<SmsLogRow[]>, []>()
        .mockReturnValue(logListChain([])),
      countDocuments: jest
        .fn<Promise<number>, [Record<string, unknown>?]>()
        .mockResolvedValue(0),
    };

    smsChannel = {
      send: jest
        .fn<Promise<void>, [string, string]>()
        .mockResolvedValue(undefined),
    };
    pushChannel = {
      send: jest
        .fn<Promise<void>, [ChannelPayload]>()
        .mockResolvedValue(undefined),
    };
    gateway = { emitToUser: jest.fn(), emitBroadcast: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: getModelToken(Notification.name), useValue: notifModel },
        {
          provide: getModelToken(BroadcastLog.name),
          useValue: broadcastLogModel,
        },
        { provide: getModelToken(SmsLog.name), useValue: smsLogModel },
        { provide: SmsNotificationChannel, useValue: smsChannel },
        { provide: PushNotificationChannel, useValue: pushChannel },
        { provide: NotificationsGateway, useValue: gateway },
      ],
    }).compile();

    service = module.get(NotificationService);
    jest.clearAllMocks();
  });

  // ── create ────────────────────────────────────────────────────
  describe('create', () => {
    it('saves notification to DB', async () => {
      notifModel.create.mockResolvedValue({
        ...mockNotif(),
        toObject: () => mockNotif(),
      });

      const res = await service.create({
        userId,
        type: NotificationType.ORDER_UPDATE,
        title: 'سفارش',
        body: 'تایید شد',
      });

      expect(res.type).toBe(NotificationType.ORDER_UPDATE);
      expect(notifModel.create).toHaveBeenCalled();
    });

    it('fires SMS channel when phone provided (fire-and-forget)', async () => {
      notifModel.create.mockResolvedValue({
        ...mockNotif(),
        toObject: () => mockNotif(),
      });

      await service.create({
        userId,
        type: NotificationType.ORDER_UPDATE,
        title: 'سفارش',
        body: 'تایید شد',
        phone: '09121234567',
      });

      await new Promise(setImmediate);
      expect(smsChannel.send).toHaveBeenCalledWith('09121234567', 'تایید شد');
    });

    it('fires push channel by default', async () => {
      notifModel.create.mockResolvedValue({
        ...mockNotif(),
        toObject: () => mockNotif(),
      });

      await service.create({
        userId,
        type: NotificationType.SYSTEM,
        title: 'خبر',
        body: 'پیام جدید',
      });

      await new Promise(setImmediate);
      expect(pushChannel.send).toHaveBeenCalled();
    });
  });

  // ── getUserNotifications ──────────────────────────────────────
  describe('getUserNotifications', () => {
    it('returns notifications with unreadCount', async () => {
      notifModel.find.mockReturnValue(fullChain([mockNotif()]));
      notifModel.countDocuments
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(1);

      const res = await service.getUserNotifications(userId, {});
      expect(res.notifications).toHaveLength(1);
      expect(res.unreadCount).toBe(1);
    });
  });

  // ── markRead ──────────────────────────────────────────────────
  describe('markRead', () => {
    it('marks notification as read', async () => {
      notifModel.findOneAndUpdate.mockReturnValue(
        leanChain(mockNotif({ isRead: true, readAt: new Date() })),
      );

      const res = await service.markRead(userId, notifId);
      expect(res.isRead).toBe(true);
    });

    it('throws when notification not found or not owned', async () => {
      notifModel.findOneAndUpdate.mockReturnValue(leanChain(null));
      await expect(service.markRead(userId, notifId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── markAllRead ───────────────────────────────────────────────
  describe('markAllRead', () => {
    it('returns modifiedCount', async () => {
      notifModel.updateMany.mockResolvedValue({ modifiedCount: 5 });
      const res = await service.markAllRead(userId);
      expect(res.modifiedCount).toBe(5);
    });
  });

  // ── getUnreadCount ────────────────────────────────────────────
  describe('getUnreadCount', () => {
    it('returns count of unread notifications', async () => {
      notifModel.countDocuments.mockResolvedValue(3);
      const res = await service.getUnreadCount(userId);
      expect(res.count).toBe(3);
    });
  });

  // ── adminBroadcast ────────────────────────────────────────────
  describe('adminBroadcast', () => {
    it('sends to specific user when targetUserId provided', async () => {
      notifModel.create.mockResolvedValue({
        ...mockNotif(),
        toObject: () => mockNotif(),
      });

      const res = await service.adminBroadcast({
        type: NotificationType.PROMO,
        title: 'تخفیف',
        body: 'کد تخفیف ویژه',
        targetUserId: userId,
      });

      expect(res.sent).toBe(1);
      expect(notifModel.create).toHaveBeenCalled();
    });

    it('broadcasts to all active users', async () => {
      const users: UserRow[] = [
        { _id: new Types.ObjectId() },
        { _id: new Types.ObjectId() },
        { _id: new Types.ObjectId() },
      ];
      notifModel.db.model.mockReturnValue(mockUserSubModel(users));

      const res = await service.adminBroadcast({
        type: NotificationType.SYSTEM,
        title: 'همه',
        body: 'پیام عمومی',
      });

      expect(res.sent).toBe(3);
      expect(notifModel.insertMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ type: NotificationType.SYSTEM }),
        ]),
        { ordered: false },
      );
    });

    it('saves a BroadcastLog entry after send', async () => {
      notifModel.create.mockResolvedValue({
        ...mockNotif(),
        toObject: () => mockNotif(),
      });

      await service.adminBroadcast({
        type: NotificationType.PROMO,
        title: 'تخفیف',
        body: 'متن',
        targetUserId: userId,
      });

      expect(broadcastLogModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ target: 'single', sent: 1 }),
      );
    });

    it('saves target=all in BroadcastLog for broadcast', async () => {
      notifModel.db.model.mockReturnValue(
        mockUserSubModel([{ _id: new Types.ObjectId() }]),
      );

      await service.adminBroadcast({
        type: NotificationType.SYSTEM,
        title: 'عنوان',
        body: 'متن',
      });

      expect(broadcastLogModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ target: 'all', sent: 1 }),
      );
    });

    it('calls gateway.emitBroadcast after all-users insertMany so clients get real-time event', async () => {
      const users: UserRow[] = [
        { _id: new Types.ObjectId() },
        { _id: new Types.ObjectId() },
      ];
      notifModel.db.model.mockReturnValue(mockUserSubModel(users));

      await service.adminBroadcast({
        type: NotificationType.PROMO,
        title: 'تخفیف ویژه',
        body: 'همه کاربران',
      });

      expect(gateway.emitBroadcast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'تخفیف ویژه',
          type: NotificationType.PROMO,
        }),
      );
    });

    it('does NOT call emitBroadcast for targeted single-user send (emitToUser handles it)', async () => {
      notifModel.create.mockResolvedValue({
        ...mockNotif(),
        toObject: () => mockNotif(),
      });

      await service.adminBroadcast({
        type: NotificationType.ORDER_UPDATE,
        title: 'سفارش',
        body: 'تایید شد',
        targetUserId: userId,
      });

      expect(gateway.emitBroadcast).not.toHaveBeenCalled();
      expect(gateway.emitToUser).toHaveBeenCalled();
    });
  });

  // ── adminSendSms ──────────────────────────────────────────────
  describe('adminSendSms', () => {
    it('sends SMS to a single phone number', async () => {
      const res = await service.adminSendSms({
        phone: '09121234567',
        message: 'پیام آزمایشی',
      });
      expect(smsChannel.send).toHaveBeenCalledWith(
        '09121234567',
        'پیام آزمایشی',
      );
      expect(res).toEqual({ sent: 1, failed: 0 });
    });

    it('normalizes +98 prefix before sending', async () => {
      await service.adminSendSms({ phone: '+989121234567', message: 'test' });
      expect(smsChannel.send).toHaveBeenCalledWith('09121234567', 'test');
    });

    it('broadcasts to all active users when no phone given', async () => {
      const users: UserRow[] = [
        { _id: new Types.ObjectId(), phone: '09120000001' },
        { _id: new Types.ObjectId(), phone: '09120000002' },
        { _id: new Types.ObjectId(), phone: '09120000003' },
      ];
      notifModel.db.model.mockReturnValue(mockUserSubModel(users));

      const res = await service.adminSendSms({ message: 'پیام انبوه' });
      expect(smsChannel.send).toHaveBeenCalledTimes(3);
      expect(res).toEqual({ sent: 3, failed: 0 });
    });

    it('counts failed sends in broadcast without throwing', async () => {
      const users: UserRow[] = [
        { phone: '09120000001' },
        { phone: '09120000002' },
      ];
      notifModel.db.model.mockReturnValue(mockUserSubModel(users));
      smsChannel.send
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('provider error'));

      const res = await service.adminSendSms({ message: 'پیام' });
      expect(res).toEqual({ sent: 1, failed: 1 });
    });

    it('skips users with no phone in broadcast', async () => {
      const users: UserRow[] = [
        { phone: '09120000001' },
        { phone: null },
        { phone: '09120000003' },
      ];
      notifModel.db.model.mockReturnValue(mockUserSubModel(users));

      const res = await service.adminSendSms({ message: 'پیام' });
      expect(smsChannel.send).toHaveBeenCalledTimes(2);
      expect(res.sent).toBe(2);
    });

    it('saves a SmsLog entry after send', async () => {
      await service.adminSendSms({ phone: '09121234567', message: 'تست' });
      expect(smsLogModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ target: 'single', sent: 1, failed: 0 }),
      );
    });

    it('saves target=all in SmsLog for broadcast', async () => {
      notifModel.db.model.mockReturnValue(
        mockUserSubModel([{ phone: '09120000001' }]),
      );

      await service.adminSendSms({ message: 'پیامک انبوه' });
      expect(smsLogModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ target: 'all', phone: null }),
      );
    });
  });

  // ── adminListBroadcastLogs ────────────────────────────────────
  describe('adminListBroadcastLogs', () => {
    it('returns paginated broadcast logs', async () => {
      const mockLog: BroadcastLogRow = {
        _id: new Types.ObjectId(),
        type: NotificationType.PROMO,
        title: 'تخفیف',
        body: 'متن',
        target: 'all',
        sent: 10,
      };
      broadcastLogModel.find.mockReturnValue(logListChain([mockLog]));
      broadcastLogModel.countDocuments.mockResolvedValue(1);

      const res = await service.adminListBroadcastLogs({ page: 1, limit: 20 });
      expect(res.logs).toHaveLength(1);
      expect(res.total).toBe(1);
      expect(res.totalPages).toBe(1);
    });

    it('calculates totalPages correctly', async () => {
      broadcastLogModel.find.mockReturnValue(logListChain([]));
      broadcastLogModel.countDocuments.mockResolvedValue(45);

      const res = await service.adminListBroadcastLogs({ page: 1, limit: 20 });
      expect(res.totalPages).toBe(3);
    });
  });

  // ── broadcastToSegment ────────────────────────────────────────
  describe('broadcastToSegment', () => {
    const allUsers: UserRow[] = [
      { _id: new Types.ObjectId() },
      { _id: new Types.ObjectId() },
    ];

    function mockUserModel(users: UserRow[]) {
      notifModel.db.model.mockReturnValue(mockUserSubModel(users));
    }

    it('inserts one notification per active user', async () => {
      mockUserModel(allUsers);
      const res = await service.broadcastToSegment({
        type: NotificationType.PROMO,
        title: 'تخفیف ویژه',
        body: 'تخفیف ۲۰٪',
      });
      expect(res.sent).toBe(2);
      expect(notifModel.insertMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            type: NotificationType.PROMO,
            title: 'تخفیف ویژه',
          }),
        ]),
        { ordered: false },
      );
    });

    it('queries users without any role filter', async () => {
      const findMock = jest
        .fn<
          { select: jest.Mock<LeanChain<UserRow[]>, [string]> },
          [Record<string, unknown>]
        >()
        .mockReturnValue({
          select: jest
            .fn<LeanChain<UserRow[]>, [string]>()
            .mockReturnValue(leanChain(allUsers)),
        });
      notifModel.db.model.mockReturnValue({ find: findMock });

      await service.broadcastToSegment({
        type: NotificationType.PROMO,
        title: 'تخفیف همه',
        body: 'برای همه',
      });

      expect(findMock).toHaveBeenCalledWith(
        expect.not.objectContaining({ role: expect.anything() as unknown }),
      );
    });

    it('calls emitBroadcast after insertMany', async () => {
      mockUserModel(allUsers);
      await service.broadcastToSegment({
        type: NotificationType.PROMO,
        title: 'تخفیف همه',
        body: 'برای همه',
      });
      expect(gateway.emitBroadcast).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'تخفیف همه' }),
      );
    });

    it('returns sent: 0 and skips insertMany when no users found', async () => {
      mockUserModel([]);
      const res = await service.broadcastToSegment({
        type: NotificationType.PROMO,
        title: 'تخفیف',
        body: 'متن',
      });
      expect(res.sent).toBe(0);
      expect(notifModel.insertMany).not.toHaveBeenCalled();
      expect(gateway.emitBroadcast).not.toHaveBeenCalled();
    });

    it('includes optional data field in each notification doc', async () => {
      mockUserModel([{ _id: new Types.ObjectId() }]);
      await service.broadcastToSegment({
        type: NotificationType.PROMO,
        title: 'تخفیف',
        body: 'متن',
        data: { discountId: 'abc123', isCoupon: false },
      });
      expect(notifModel.insertMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            data: { discountId: 'abc123', isCoupon: false },
          }),
        ]),
        { ordered: false },
      );
    });
  });

  // ── adminListSmsLogs ──────────────────────────────────────────
  describe('adminListSmsLogs', () => {
    it('returns paginated sms logs', async () => {
      const mockLog: SmsLogRow = {
        _id: new Types.ObjectId(),
        target: 'single',
        phone: '0912****',
        message: 'پیام',
        sent: 1,
        failed: 0,
      };
      smsLogModel.find.mockReturnValue(logListChain([mockLog]));
      smsLogModel.countDocuments.mockResolvedValue(1);

      const res = await service.adminListSmsLogs({ page: 1, limit: 20 });
      expect(res.logs).toHaveLength(1);
      expect(res.total).toBe(1);
    });

    it('returns empty list when no logs exist', async () => {
      const res = await service.adminListSmsLogs({});
      expect(res.logs).toHaveLength(0);
      expect(res.total).toBe(0);
    });
  });
});
