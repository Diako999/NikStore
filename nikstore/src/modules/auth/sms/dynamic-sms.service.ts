import { Injectable, Logger } from '@nestjs/common';
import { SmsService } from './sms.service.abstract';
import { MockSmsService } from './mock-sms.service';
import { KavenegarSmsService } from './kavenegar-sms.service';
import { SettingsService } from '../../settings/settings.service';

@Injectable()
export class DynamicSmsService extends SmsService {
  private readonly logger = new Logger(DynamicSmsService.name);

  constructor(
    private readonly settingsService: SettingsService,
    private readonly kavenegar: KavenegarSmsService,
    private readonly mock: MockSmsService,
  ) {
    super();
  }

  private async active(): Promise<SmsService> {
    try {
      const s = await this.settingsService.findSettings();
      const isKavenegar = s.sms?.provider === 'kavenegar';
      this.logger.debug(
        `[DynamicSms] active provider: ${isKavenegar ? 'kavenegar' : 'mock'}`,
      );
      return isKavenegar ? this.kavenegar : this.mock;
    } catch {
      this.logger.warn(
        '[DynamicSms] failed to read settings — falling back to mock',
      );
      return this.mock;
    }
  }

  async sendOtp(phone: string, code: string): Promise<void> {
    return (await this.active()).sendOtp(phone, code);
  }
}
