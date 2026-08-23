import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { NotificationService } from './notification.service';
import { Notification, NotificationType } from './entities/notification.schema';
import { BroadcastLog } from './entities/broadcast-log.schema';
import { SmsLog }       from './entities/sms-log.schema';
import {
  PushNotificationChannel,
  SmsNotificationChannel,
} from './channels/notification-channel.abstract';
import { NotificationsGateway } from '../../common/gateway/notifications.gateway';

const userId  = new Types.ObjectId().toString();
const notifId = new Types.ObjectId().toString();

const mockNotif = (overrides: any = {}) => ({
  _id:    new Types.ObjectId(notifId),
  userId: new Types.ObjectId(userId),
  type:   NotificationType.ORDER_UPDATE,
  title:  'سفارش ORD-001',
  body:   'وضعیت سفارش شما تایید شد',
  data:   null,
  isRead: false,
  readAt: null,
  ...overrides,
});

describe('NotificationService', () => {
  let service: NotificationService;
  let notifModel: any;
  let broadcastLogModel: any;
  let smsLogModel: any;
  let smsChannel: jest.Mocked<SmsNotificationChannel>;
  let pushChannel: jest.Mocked<PushNotificationChannel>;
  let gateway: { emitToUser: jest.Mock; emitBroadcast: jest.Mock };

  const leanChain = (val: any) => ({ lean: jest.fn().mockResolvedValue(val) });

  const fullChain = (val: any) => ({
    select: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue(leanChain(val)),
        }),
      }),
    }),
  });

  const logListChain = (val: any) => ({
    sort: jest.fn().mockReturnValue({
      skip: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue(leanChain(val)),
      }),
    }),
  });

  beforeEach(async () => {
    notifModel = {
      create:           jest.fn(),
      find:             jest.fn().mockReturnValue(fullChain([])),
      findOneAndUpdate: jest.fn(),
      findByIdAndDelete:jest.fn(),
      updateMany:       jest.fn().mockResolvedValue({ modifiedCount: 0 }),
      countDocuments:   jest.fn().mockResolvedValue(0),
      insertMany:       jest.fn().mockResolvedValue([]),
      db: {
        model: jest.fn().mockReturnValue({
          find: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue(leanChain([])),
          }),
        }),
      },
    };

    broadcastLogModel = {
      create:         jest.fn().mockResolvedValue({}),
      find:           jest.fn().mockReturnValue(logListChain([])),
      countDocuments: jest.fn().mockResolvedValue(0),
    };

    smsLogModel = {
      create:         jest.fn().mockResolvedValue({}),
      find:           jest.fn().mockReturnValue(logListChain([])),
      countDocuments: jest.fn().mockResolvedValue(0),
    };

    smsChannel  = { send: jest.fn().mockResolvedValue(undefined) } as any;
    pushChannel = { send: jest.fn().mockResolvedValue(undefined) } as any;
    gateway     = { emitToUser: jest.fn(), emitBroadcast: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: getModelToken(Notification.name),  useValue: notifModel },
        { provide: getModelToken(BroadcastLog.name),  useValue: broadcastLogModel },
        { provide: getModelToken(SmsLog.name),        useValue: smsLogModel },
        { provide: SmsNotificationChannel,            useValue: smsChannel },
        { provide: PushNotificationChannel,           useValue: pushChannel },
        { provide: NotificationsGateway,              useValue: gateway },
      ],
    }).compile();

    service = module.get(NotificationService);
    jest.clearAllMocks();
  });

  // ── create ────────────────────────────────────────────────────
  describe('create', () => {
    it('saves notification to DB', async () => {
      notifModel.create.mockResolvedValue({
        ...mockNotif(), toObject: () => mockNotif(),
      });

      const res = await service.create({
        userId, type: NotificationType.ORDER_UPDATE,
        title: 'سفارش', body: 'تایید شد',
      });

      expect(res.type).toBe(NotificationType.ORDER_UPDATE);
      expect(notifModel.create).toHaveBeenCalled();
    });

    it('fires SMS channel when phone provided (fire-and-forget)', async () => {
      notifModel.create.mockResolvedValue({
        ...mockNotif(), toObject: () => mockNotif(),
      });

      await service.create({
        userId, type: NotificationType.ORDER_UPDATE,
        title: 'سفارش', body: 'تایید شد',
        phone: '09121234567',
      });

      await new Promise(setImmediate);
      expect(smsChannel.send).toHaveBeenCalledWith('09121234567', 'تایید شد');
    });

    it('fires push channel by default', async () => {
      notifModel.create.mockResolvedValue({
        ...mockNotif(), toObject: () => mockNotif(),
      });

      await service.create({
        userId, type: NotificationType.SYSTEM,
        title: 'خبر', body: 'پیام جدید',
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
      await expect(service.markRead(userId, notifId))
        .rejects.toThrow(NotFoundException);
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
        ...mockNotif(), toObject: () => mockNotif(),
      });

      const res = await service.adminBroadcast({
        type:         NotificationType.PROMO,
        title:        'تخفیف',
        body:         'کد تخفیف ویژه',
        targetUserId: userId,
      });

      expect(res.sent).toBe(1);
      expect(notifModel.create).toHaveBeenCalled();
    });

    it('broadcasts to all active users', async () => {
      const users = [
        { _id: new Types.ObjectId() },
        { _id: new Types.ObjectId() },
        { _id: new Types.ObjectId() },
      ];
      notifModel.db.model.mockReturnValue({
        find: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue(leanChain(users)),
        }),
      });

      const res = await service.adminBroadcast({
        type: NotificationType.SYSTEM, title: 'همه', body: 'پیام عمومی',
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
        ...mockNotif(), toObject: () => mockNotif(),
      });

      await service.adminBroadcast({
        type: NotificationType.PROMO, title: 'تخفیف', body: 'متن',
        targetUserId: userId,
      });

      expect(broadcastLogModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ target: 'single', sent: 1 }),
      );
    });

    it('saves target=all in BroadcastLog for broadcast', async () => {
      notifModel.db.model.mockReturnValue({
        find: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue(leanChain([{ _id: new Types.ObjectId() }])),
        }),
      });

      await service.adminBroadcast({
        type: NotificationType.SYSTEM, title: 'عنوان', body: 'متن',
      });

      expect(broadcastLogModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ target: 'all', sent: 1 }),
      );
    });

    it('calls gateway.emitBroadcast after all-users insertMany so clients get real-time event', async () => {
      const users = [{ _id: new Types.ObjectId() }, { _id: new Types.ObjectId() }];
      notifModel.db.model.mockReturnValue({
        find: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue(leanChain(users)),
        }),
      });

      await service.adminBroadcast({
        type: NotificationType.PROMO, title: 'تخفیف ویژه', body: 'همه کاربران',
      });

      expect(gateway.emitBroadcast).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'تخفیف ویژه', type: NotificationType.PROMO }),
      );
    });

    it('does NOT call emitBroadcast for targeted single-user send (emitToUser handles it)', async () => {
      notifModel.create.mockResolvedValue({
        ...mockNotif(), toObject: () => mockNotif(),
      });

      await service.adminBroadcast({
        type: NotificationType.ORDER_UPDATE, title: 'سفارش', body: 'تایید شد',
        targetUserId: userId,
      });

      expect(gateway.emitBroadcast).not.toHaveBeenCalled();
      expect(gateway.emitToUser).toHaveBeenCalled();
    });
  });

  // ── adminSendSms ──────────────────────────────────────────────
  describe('adminSendSms', () => {
    it('sends SMS to a single phone number', async () => {
      const res = await service.adminSendSms({ phone: '09121234567', message: 'پیام آزمایشی' });
      expect(smsChannel.send).toHaveBeenCalledWith('09121234567', 'پیام آزمایشی');
      expect(res).toEqual({ sent: 1, failed: 0 });
    });

    it('normalizes +98 prefix before sending', async () => {
      await service.adminSendSms({ phone: '+989121234567', message: 'test' });
      expect(smsChannel.send).toHaveBeenCalledWith('09121234567', 'test');
    });

    it('broadcasts to all active users when no phone given', async () => {
      const users = [
        { _id: new Types.ObjectId(), phone: '09120000001' },
        { _id: new Types.ObjectId(), phone: '09120000002' },
        { _id: new Types.ObjectId(), phone: '09120000003' },
      ];
      notifModel.db.model.mockReturnValue({
        find: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue(leanChain(users)),
        }),
      });

      const res = await service.adminSendSms({ message: 'پیام انبوه' });
      expect(smsChannel.send).toHaveBeenCalledTimes(3);
      expect(res).toEqual({ sent: 3, failed: 0 });
    });

    it('counts failed sends in broadcast without throwing', async () => {
      const users = [
        { phone: '09120000001' },
        { phone: '09120000002' },
      ];
      notifModel.db.model.mockReturnValue({
        find: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue(leanChain(users)),
        }),
      });
      smsChannel.send
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('provider error'));

      const res = await service.adminSendSms({ message: 'پیام' });
      expect(res).toEqual({ sent: 1, failed: 1 });
    });

    it('skips users with no phone in broadcast', async () => {
      const users = [
        { phone: '09120000001' },
        { phone: null },
        { phone: '09120000003' },
      ];
      notifModel.db.model.mockReturnValue({
        find: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue(leanChain(users)),
        }),
      });

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
      notifModel.db.model.mockReturnValue({
        find: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue(leanChain([{ phone: '09120000001' }])),
        }),
      });

      await service.adminSendSms({ message: 'پیامک انبوه' });
      expect(smsLogModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ target: 'all', phone: null }),
      );
    });
  });

  // ── adminListBroadcastLogs ────────────────────────────────────
  describe('adminListBroadcastLogs', () => {
    it('returns paginated broadcast logs', async () => {
      const mockLog = {
        _id: new Types.ObjectId(), type: NotificationType.PROMO,
        title: 'تخفیف', body: 'متن', target: 'all', sent: 10,
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
    const allUsers = [
      { _id: new Types.ObjectId() },
      { _id: new Types.ObjectId() },
    ];

    function mockUserModel(users: any[]) {
      notifModel.db.model.mockReturnValue({
        find: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue(leanChain(users)),
        }),
      });
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
          expect.objectContaining({ type: NotificationType.PROMO, title: 'تخفیف ویژه' }),
        ]),
        { ordered: false },
      );
    });

    it('queries users without any role filter', async () => {
      const findMock = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue(leanChain(allUsers)),
      });
      notifModel.db.model.mockReturnValue({ find: findMock });

      await service.broadcastToSegment({
        type: NotificationType.PROMO,
        title: 'تخفیف همه',
        body: 'برای همه',
      });

      expect(findMock).toHaveBeenCalledWith(
        expect.not.objectContaining({ role: expect.anything() }),
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
          expect.objectContaining({ data: { discountId: 'abc123', isCoupon: false } }),
        ]),
        { ordered: false },
      );
    });
  });

  // ── adminListSmsLogs ──────────────────────────────────────────
  describe('adminListSmsLogs', () => {
    it('returns paginated sms logs', async () => {
      const mockLog = {
        _id: new Types.ObjectId(), target: 'single',
        phone: '0912****', message: 'پیام', sent: 1, failed: 0,
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
