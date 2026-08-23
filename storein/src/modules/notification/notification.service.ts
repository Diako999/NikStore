import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Notification,
  NotificationDocument,
  NotificationType,
} from './entities/notification.schema';
import { BroadcastLog, BroadcastLogDocument } from './entities/broadcast-log.schema';
import { SmsLog, SmsLogDocument }             from './entities/sms-log.schema';
import {
  ChannelPayload,
  PushNotificationChannel,
  SmsNotificationChannel,
} from './channels/notification-channel.abstract';
import { AdminBroadcastDto }    from './dto/admin-broadcast.dto';
import { AdminSmsDto }          from './dto/admin-sms.dto';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { NotificationsGateway } from '../../common/gateway/notifications.gateway';

export interface CreateNotificationPayload {
  userId:    string;
  type:      NotificationType;
  title:     string;
  body:      string;
  data?:     Record<string, any>;
  phone?:    string;
  sendPush?: boolean;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectModel(Notification.name)
    private notifModel: Model<NotificationDocument>,
    @InjectModel(BroadcastLog.name)
    private broadcastLogModel: Model<BroadcastLogDocument>,
    @InjectModel(SmsLog.name)
    private smsLogModel: Model<SmsLogDocument>,
    private smsChannel:  SmsNotificationChannel,
    private pushChannel: PushNotificationChannel,
    private gateway:     NotificationsGateway,
  ) {}

  // ── Create (internal — called by listener or admin) ───────────
  async create(payload: CreateNotificationPayload): Promise<NotificationDocument> {
    const notif = await this.notifModel.create({
      userId: new Types.ObjectId(payload.userId),
      type:   payload.type,
      title:  payload.title,
      body:   payload.body,
      data:   payload.data ?? null,
    });

    // Push real-time notification to user's WebSocket room (best-effort)
    try {
      this.gateway.emitToUser(payload.userId, {
        _id:       (notif._id as any).toString(),
        type:      notif.type,
        title:     notif.title,
        body:      notif.body,
        data:      notif.data,
        isRead:    notif.isRead,
        createdAt: (notif as any).createdAt,
      });
    } catch (err: any) {
      this.logger.warn(`Real-time emit failed for user ${payload.userId}: ${err?.message}`);
    }

    if (payload.phone) {
      this.smsChannel
        .send(payload.phone, payload.body)
        .catch((err) =>
          this.logger.error(`SMS notify failed: ${err.message}`),
        );
    }

    if (payload.sendPush !== false) {
      const pushPayload: ChannelPayload = {
        userId: payload.userId,
        title:  payload.title,
        body:   payload.body,
        data:   payload.data,
      };
      this.pushChannel
        .send(pushPayload)
        .catch((err) =>
          this.logger.error(`Push notify failed: ${err.message}`),
        );
    }

    return notif.toObject();
  }

  // ── User: Get notifications ───────────────────────────────────
  async getUserNotifications(
    userId: string,
    query: NotificationQueryDto,
  ): Promise<{
    notifications: NotificationDocument[];
    total: number;
    unreadCount: number;
    totalPages: number;
  }> {
    const { unreadOnly, page = 1, limit = 20 } = query;
    const oid = new Types.ObjectId(userId);

    const filter: Record<string, any> = { userId: oid };
    if (unreadOnly) filter.isRead = false;

    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      this.notifModel
        .find(filter)
        .select('-__v')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<NotificationDocument[]>(),
      this.notifModel.countDocuments(filter),
      this.notifModel.countDocuments({ userId: oid, isRead: false }),
    ]);

    return {
      notifications,
      total,
      unreadCount,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ── User: Mark one as read ────────────────────────────────────
  async markRead(userId: string, notifId: string): Promise<NotificationDocument> {
    const notif = await this.notifModel
      .findOneAndUpdate(
        {
          _id:    new Types.ObjectId(notifId),
          userId: new Types.ObjectId(userId),
        },
        { $set: { isRead: true, readAt: new Date() } },
        { new: true },
      )
      .lean<NotificationDocument>();

    if (!notif) throw new NotFoundException('اعلان یافت نشد');
    return notif;
  }

  // ── User: Mark all as read ────────────────────────────────────
  async markAllRead(userId: string): Promise<{ modifiedCount: number }> {
    const result = await this.notifModel.updateMany(
      { userId: new Types.ObjectId(userId), isRead: false },
      { $set: { isRead: true, readAt: new Date() } },
    );
    return { modifiedCount: result.modifiedCount };
  }

  // ── User: Unread count ────────────────────────────────────────
  async getUnreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.notifModel.countDocuments({
      userId: new Types.ObjectId(userId),
      isRead: false,
    });
    return { count };
  }

  // ── Admin: Broadcast or targeted send ────────────────────────
  async adminBroadcast(dto: AdminBroadcastDto): Promise<{ sent: number }> {
    let sent = 0;

    if (dto.targetUserId) {
      await this.create({
        userId: dto.targetUserId,
        type:   dto.type,
        title:  dto.title,
        body:   dto.body,
        data:   dto.data,
      });
      sent = 1;
    } else {
      const UserModel = this.notifModel.db.model('User');
      const users: any[] = await UserModel
        .find({ isActive: true })
        .select('_id')
        .lean();

      const docs = users.map((u) => ({
        userId: u._id,
        type:   dto.type,
        title:  dto.title,
        body:   dto.body,
        data:   dto.data ?? null,
        isRead: false,
        readAt: null,
      }));

      if (docs.length > 0) {
        await this.notifModel.insertMany(docs, { ordered: false });
        // Emit a single WebSocket event to the `broadcast` room so all connected
        // users see the notification in real-time without polling the DB.
        try {
          this.gateway.emitBroadcast({
            type:      dto.type,
            title:     dto.title,
            body:      dto.body,
            data:      dto.data ?? null,
            createdAt: new Date().toISOString(),
          });
          this.logger.log(`Broadcast real-time event emitted to ${sent} connected users`);
        } catch (err: any) {
          this.logger.warn(`Broadcast real-time emit failed (non-critical): ${err?.message}`);
        }
      }
      sent = docs.length;
    }

    await this.broadcastLogModel.create({
      type:         dto.type,
      title:        dto.title,
      body:         dto.body,
      target:       dto.targetUserId ? 'single' : 'all',
      targetUserId: dto.targetUserId ?? null,
      sent,
    });

    this.logger.log(`Broadcast complete — saved ${sent} notifications to DB`);
    return { sent };
  }

  // ── Admin: Send SMS (targeted or broadcast) ──────────────────
  async adminSendSms(dto: AdminSmsDto): Promise<{ sent: number; failed: number }> {
    const normalizePhone = (p: string) =>
      p.startsWith('+98') ? '0' + p.slice(3) : p;

    let sent   = 0;
    let failed = 0;
    let phone: string | null = null;

    if (dto.phone) {
      phone = normalizePhone(dto.phone);
      await this.smsChannel.send(phone, dto.message);
      sent = 1;
      this.logger.log(`Admin SMS sent to single target: ${phone.slice(0, -4)}****`);
    } else {
      const UserModel = this.notifModel.db.model('User');
      const users: any[] = await UserModel
        .find({ isActive: true })
        .select('phone')
        .lean();

      for (const user of users) {
        if (!user.phone) continue;
        try {
          await this.smsChannel.send(user.phone, dto.message);
          sent++;
        } catch (err: any) {
          failed++;
          this.logger.error(`Admin SMS broadcast failed for ${user.phone.slice(0, -4)}****: ${err?.message}`);
        }
      }
    }

    await this.smsLogModel.create({
      target:  dto.phone ? 'single' : 'all',
      phone:   phone ? `${phone.slice(0, 5)}****` : null,
      message: dto.message,
      sent,
      failed,
    });

    this.logger.log(`Admin SMS complete — sent: ${sent}, failed: ${failed}`);
    return { sent, failed };
  }

  // ── Admin: List broadcast logs ────────────────────────────────
  async adminListBroadcastLogs(query: NotificationQueryDto): Promise<{
    logs: BroadcastLogDocument[];
    total: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.broadcastLogModel
        .find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<BroadcastLogDocument[]>(),
      this.broadcastLogModel.countDocuments(),
    ]);

    return { logs, total, totalPages: Math.ceil(total / limit) };
  }

  // ── Admin: List SMS logs ──────────────────────────────────────
  async adminListSmsLogs(query: NotificationQueryDto): Promise<{
    logs: SmsLogDocument[];
    total: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.smsLogModel
        .find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<SmsLogDocument[]>(),
      this.smsLogModel.countDocuments(),
    ]);

    return { logs, total, totalPages: Math.ceil(total / limit) };
  }

  // ── Admin: Delete individual notification ────────────────────
  async adminDelete(notifId: string): Promise<void> {
    if (!Types.ObjectId.isValid(notifId)) return;
    await this.notifModel.findByIdAndDelete(notifId);
  }

  // ── Segment broadcast (discount/promo notifications) ─────────
  // Sends to all active users.
  async broadcastToSegment(params: {
    type:  NotificationType;
    title: string;
    body:  string;
    data?: Record<string, any>;
  }): Promise<{ sent: number }> {
    const { type, title, body, data } = params;

    const UserModel = this.notifModel.db.model('User');
    const users: { _id: any }[] = await UserModel
      .find({ isActive: true })
      .select('_id')
      .lean();

    if (!users.length) {
      this.logger.log('Segment broadcast skipped — no eligible users');
      return { sent: 0 };
    }

    const docs = users.map((u) => ({
      userId: u._id,
      type,
      title,
      body,
      data:   data ?? null,
      isRead: false,
      readAt: null,
    }));

    await this.notifModel.insertMany(docs, { ordered: false });

    // Real-time WebSocket emit — best-effort
    try {
      this.gateway.emitBroadcast({
        type,
        title,
        body,
        data:      data ?? null,
        createdAt: new Date().toISOString(),
      });
    } catch (err: any) {
      this.logger.warn(`Segment broadcast real-time emit failed (non-critical): ${err?.message}`);
    }

    this.logger.log(`Segment broadcast complete — sent: ${users.length}`);
    return { sent: users.length };
  }

  // ── Admin: Delete broadcast log entry ────────────────────────
  async adminDeleteBroadcastLog(logId: string): Promise<{ deleted: boolean }> {
    if (!Types.ObjectId.isValid(logId)) {
      throw new NotFoundException(`Broadcast log ${logId} not found`);
    }
    const result = await this.broadcastLogModel.findByIdAndDelete(logId);
    if (!result) {
      throw new NotFoundException(`Broadcast log ${logId} not found`);
    }
    this.logger.log(`Admin deleted broadcast log ${logId}`);
    return { deleted: true };
  }
}
