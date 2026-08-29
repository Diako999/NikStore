import { Injectable, Logger } from '@nestjs/common';
import { SmsNotificationChannel } from './notification-channel.abstract';
import { MockSmsChannel } from './mock-sms.channel';
import { KavenegarSmsChannel } from './kavenegar-sms.channel';
import { SettingsService } from '../../settings/settings.service';

@Injectable()
export class DynamicSmsChannel extends SmsNotificationChannel {
  private readonly logger = new Logger(DynamicSmsChannel.name);

  constructor(
    private readonly settingsService: SettingsService,
    private readonly kavenegar: KavenegarSmsChannel,
    private readonly mock: MockSmsChannel,
  ) {
    super();
  }

  private async active(): Promise<SmsNotificationChannel> {
    try {
      const s = await this.settingsService.findSettings();
      const isKavenegar = s.sms?.provider === 'kavenegar';
      this.logger.debug(
        `[DynamicSmsChannel] active: ${isKavenegar ? 'kavenegar' : 'mock'}`,
      );
      return isKavenegar ? this.kavenegar : this.mock;
    } catch {
      this.logger.warn(
        '[DynamicSmsChannel] settings error — falling back to mock',
      );
      return this.mock;
    }
  }

  async send(phone: string, message: string): Promise<void> {
    return (await this.active()).send(phone, message);
  }
}
