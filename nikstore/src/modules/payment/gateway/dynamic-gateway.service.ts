import { Injectable, Logger } from '@nestjs/common';
import {
  PaymentGateway,
  GatewayCreateResult,
  GatewayVerifyResult,
} from './payment-gateway.abstract';
import { SettingsService } from '../../settings/settings.service';
import { ZarinpalGateway } from './zarinpal-gateway.service';
import { MockPaymentGateway } from './mock-payment-gateway.service';

@Injectable()
export class DynamicGateway extends PaymentGateway {
  private readonly logger = new Logger(DynamicGateway.name);

  constructor(
    private readonly settingsService: SettingsService,
    private readonly zarinpal: ZarinpalGateway,
    private readonly mock: MockPaymentGateway,
  ) {
    super();
  }

  private async active(): Promise<PaymentGateway> {
    try {
      const settings = await this.settingsService.findSettings();
      const isZarinpal = settings.payment?.gateway === 'zarinpal';
      this.logger.debug(
        `[DynamicGateway] active gateway: ${isZarinpal ? 'zarinpal' : 'mock'}`,
      );
      return isZarinpal ? this.zarinpal : this.mock;
    } catch {
      this.logger.warn(
        '[DynamicGateway] failed to read settings — falling back to mock',
      );
      return this.mock;
    }
  }

  async create(
    amount: number,
    description: string,
    callbackUrl: string,
  ): Promise<GatewayCreateResult> {
    return (await this.active()).create(amount, description, callbackUrl);
  }

  async verify(
    authority: string,
    amount: number,
  ): Promise<GatewayVerifyResult> {
    return (await this.active()).verify(authority, amount);
  }
}
