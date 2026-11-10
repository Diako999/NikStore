import { ConfigService } from '@nestjs/config';
import { OrderExpiryService } from './order-expiry.service';
import { OrderService } from './order.service';

describe('OrderExpiryService', () => {
  const orderService = { cancelExpiredUnpaid: jest.fn() };
  const build = (hours?: unknown) =>
    new OrderExpiryService(
      orderService as unknown as OrderService,
      { get: jest.fn().mockReturnValue(hours) } as unknown as ConfigService,
    );

  beforeEach(() => jest.resetAllMocks());

  it('cancels orders older than the configured number of hours', async () => {
    orderService.cancelExpiredUnpaid.mockResolvedValue(3);
    const before = Date.now();
    const n = await build('24').cancelExpiredUnpaidOrders();
    expect(n).toBe(3);
    const [cutoff] = orderService.cancelExpiredUnpaid.mock.calls[0] as [Date];
    const ageHours = (before - cutoff.getTime()) / 3_600_000;
    expect(ageHours).toBeGreaterThan(23.99);
    expect(ageHours).toBeLessThan(24.1);
  });

  it('falls back to 48h when the setting is missing or invalid', async () => {
    orderService.cancelExpiredUnpaid.mockResolvedValue(0);
    await build(undefined).cancelExpiredUnpaidOrders();
    const [cutoff] = orderService.cancelExpiredUnpaid.mock.calls[0] as [Date];
    const ageHours = (Date.now() - cutoff.getTime()) / 3_600_000;
    expect(Math.round(ageHours)).toBe(48);
  });

  it('never throws out of the cron job', async () => {
    orderService.cancelExpiredUnpaid.mockRejectedValue(new Error('db down'));
    await expect(build('48').cancelExpiredUnpaidOrders()).resolves.toBe(0);
  });
});
