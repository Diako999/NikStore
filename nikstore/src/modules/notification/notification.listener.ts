import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationService } from './notification.service';
import { NotificationType } from './entities/notification.schema';

// ── Event Payloads ─────────────────────────────────────────────
export interface OrderStatusChangedEvent {
  orderId: string;
  orderNumber: string;
  userId: string;
  phone: string;
  status: string;
  previousStatus: string;
}

export const EVENTS = {
  ORDER_STATUS_CHANGED: 'order.status.changed',
  DISCOUNT_CREATED: 'discount.created',
} as const;

export interface DiscountCreatedEvent {
  discountId: string;
  title: string;
  discountType: 'percentage' | 'fixed';
  value: number;
  isCoupon: boolean;
  code: string | null;
  endDate: Date | null;
}

const STATUS_LABELS: Record<string, string> = {
  confirmed: 'تایید شد',
  processing: 'در حال آماده‌سازی',
  shipped: 'ارسال شد',
  delivered: 'تحویل داده شد',
  cancelled: 'لغو شد',
};

@Injectable()
export class NotificationListener {
  private readonly logger = new Logger(NotificationListener.name);

  constructor(private readonly notifService: NotificationService) {}

  @OnEvent(EVENTS.ORDER_STATUS_CHANGED)
  async handleOrderStatusChanged(event: OrderStatusChangedEvent) {
    const label = STATUS_LABELS[event.status];
    if (!label) return;

    try {
      await this.notifService.create({
        userId: event.userId,
        type: NotificationType.ORDER_UPDATE,
        title: `سفارش ${event.orderNumber}`,
        body: `وضعیت سفارش شما ${label}`,
        data: { orderId: event.orderId, status: event.status },
        phone: event.phone,
        sendPush: true,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Order notification failed: ${message}`);
    }
  }

  @OnEvent(EVENTS.DISCOUNT_CREATED)
  async handleDiscountCreated(event: DiscountCreatedEvent) {
    const { discountId, title, discountType, value, isCoupon, code, endDate } =
      event;

    const valueStr =
      discountType === 'percentage'
        ? `${value}٪`
        : `${value.toLocaleString('fa-IR')} تومان`;

    const notifTitle = isCoupon ? 'کد تخفیف ویژه 🎁' : 'تخفیف ویژه 🎉';

    let body = isCoupon
      ? `کد تخفیف «${code}» با ${valueStr} تخفیف فعال شد`
      : `تخفیف ${valueStr} برای «${title}» فعال شد`;

    if (endDate) {
      const formatted = new Intl.DateTimeFormat('fa-IR', {
        month: 'long',
        day: 'numeric',
      }).format(new Date(endDate));
      body += ` — تا ${formatted}`;
    }

    try {
      await this.notifService.broadcastToSegment({
        type: NotificationType.PROMO,
        title: notifTitle,
        body,
        data: {
          discountId,
          isCoupon,
          ...(isCoupon && code ? { code } : {}),
        },
      });
      this.logger.log(
        `Discount notification broadcast complete — id: ${discountId}`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Discount notification broadcast failed: ${message}`);
    }
  }
}
