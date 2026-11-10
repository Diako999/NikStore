import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { OrderService } from './order.service';

/**
 * Orders are reserved stock until paid. Since payment happens manually via chat,
 * an order that is never paid (abandoned, or a fake guest order) would hold that
 * stock forever — so unpaid pending orders are auto-cancelled after a while.
 */
@Injectable()
export class OrderExpiryService {
  private readonly logger = new Logger(OrderExpiryService.name);

  constructor(
    private readonly orderService: OrderService,
    private readonly config: ConfigService,
  ) {}

  /** Hours an unpaid order may stay pending (env ORDER_UNPAID_EXPIRY_HOURS, default 48). */
  private get expiryHours(): number {
    const h = Number(this.config.get('ORDER_UNPAID_EXPIRY_HOURS'));
    return Number.isFinite(h) && h > 0 ? h : 48;
  }

  @Cron('0 */30 * * * *')
  async cancelExpiredUnpaidOrders(): Promise<number> {
    const cutoff = new Date(Date.now() - this.expiryHours * 3_600_000);
    try {
      const n = await this.orderService.cancelExpiredUnpaid(cutoff);
      if (n > 0)
        this.logger.log(
          `Auto-cancelled ${n} unpaid order(s) older than ${this.expiryHours}h`,
        );
      return n;
    } catch (err) {
      this.logger.error(
        `Auto-cancel of unpaid orders failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      return 0;
    }
  }
}
