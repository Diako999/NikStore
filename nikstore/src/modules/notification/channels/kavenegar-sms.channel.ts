import { Injectable, Logger } from '@nestjs/common';
import { SmsNotificationChannel } from './notification-channel.abstract';
import { SettingsService } from '../../settings/settings.service';

interface KavenegarSendResponse {
  return?: {
    status?: number;
    message?: string;
  };
}

@Injectable()
export class KavenegarSmsChannel extends SmsNotificationChannel {
  private readonly logger = new Logger(KavenegarSmsChannel.name);

  constructor(private readonly settingsService: SettingsService) {
    super();
  }

  private async config(): Promise<{ apiKey: string; sender: string }> {
    try {
      const s = await this.settingsService.findSettings();
      return {
        apiKey: s.sms?.kavenegarApiKey || (process.env.KAVENEGAR_API_KEY ?? ''),
        sender: s.sms?.kavenegarSender || (process.env.KAVENEGAR_SENDER ?? ''),
      };
    } catch {
      return {
        apiKey: process.env.KAVENEGAR_API_KEY ?? '',
        sender: process.env.KAVENEGAR_SENDER ?? '',
      };
    }
  }

  async send(phone: string, message: string): Promise<void> {
    const { apiKey, sender } = await this.config();

    if (!apiKey) {
      this.logger.warn(
        '[KAVENEGAR] API key not set — notification SMS not sent',
      );
      return;
    }

    const url = `https://api.kavenegar.com/v1/${apiKey}/sms/send.json`;
    const body = new URLSearchParams({ receptor: phone, sender, message });

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    const json = (await res.json()) as KavenegarSendResponse;
    const status = json.return?.status;

    if (status !== 200) {
      const msg = json.return?.message ?? `HTTP ${res.status}`;
      this.logger.error(
        `[KAVENEGAR] SMS failed | phone: ${phone} | status: ${status} | ${msg}`,
      );
      throw new Error(`Kavenegar SMS error: ${msg}`);
    }

    this.logger.log(`[KAVENEGAR] SMS sent | phone: ${phone}`);
  }
}
