import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Discount, DiscountDocument } from './schemas/discount.schema';
import { DiscountsService } from './discounts.service';

@Injectable()
export class DiscountSchedulerService {
  private readonly logger = new Logger(DiscountSchedulerService.name);

  constructor(
    @InjectModel(Discount.name)
    private readonly discountModel: Model<DiscountDocument>,
    private readonly discountsService: DiscountsService,
  ) {}

  // Refresh Redis cache every 5 minutes
  @Cron('0 */5 * * * *')
  async refreshCache() {
    await this.discountsService.invalidateCache();
    await this.discountsService.getActiveDiscounts();
    this.logger.log('Discount cache refreshed');
  }

  // Deactivate expired time-limited discounts every minute
  // Note: filters by endDate presence — no longer depends on legacy `kind` field
  @Cron('* * * * *')
  async deactivateExpired() {
    const result = await this.discountModel.updateMany(
      {
        isActive: true,
        endDate: { $lt: new Date(), $ne: null },
      },
      { $set: { isActive: false } },
    );

    if (result.modifiedCount > 0) {
      await this.discountsService.invalidateCache();
      this.logger.log(`Deactivated ${result.modifiedCount} expired discounts`);
    }
  }
}
