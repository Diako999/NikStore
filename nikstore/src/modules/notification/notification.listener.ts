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

export interface PaymentSuccessEvent {
  userId: string;
  phone: string;
  orderId?: string;
  amount: number;
  refId: string;
  isTopup: boolean;
}

export const EVENTS = {
  ORDER_STATUS_CHANGED: 'order.status.changed',
  PAYMENT_SUCCESS: 'payment.success',
  PAYMENT_FAILED: 'payment.failed',
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

  @OnEvent(EVENTS.PAYMENT_SUCCESS)
  async handlePaymentSuccess(event: PaymentSuccessEvent) {
    try {
      const title = event.isTopup ? 'شارژ کیف پول' : 'پرداخت موفق';
      const body = event.isTopup
        ? `کیف پول شما با مبلغ ${event.amount.toLocaleString()} تومان شارژ شد`
        : `پرداخت سفارش شما با موفقیت انجام شد. کد پیگیری: ${event.refId}`;

      await this.notifService.create({
        userId: event.userId,
        type: NotificationType.PAYMENT,
        title,
        body,
        data: { refId: event.refId, orderId: event.orderId },
        phone: event.phone,
        sendPush: true,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Payment notification failed: ${message}`);
    }
  }

  @OnEvent(EVENTS.PAYMENT_FAILED)
  async handlePaymentFailed(event: { userId: string; phone: string }) {
    try {
      await this.notifService.create({
        userId: event.userId,
        type: NotificationType.PAYMENT,
        title: 'پرداخت ناموفق',
        body: 'متأسفانه پرداخت شما انجام نشد. لطفاً مجدداً تلاش کنید',
        phone: event.phone,
        sendPush: true,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed payment notification failed: ${message}`);
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
