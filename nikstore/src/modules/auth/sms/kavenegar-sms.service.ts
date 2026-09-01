import { Injectable, Logger } from '@nestjs/common';
import { SmsService } from './sms.service.abstract';
import { SettingsService } from '../../settings/settings.service';

interface KavenegarResponse {
  return?: { status?: number; message?: string };
}

@Injectable()
export class KavenegarSmsService extends SmsService {
  private readonly logger = new Logger(KavenegarSmsService.name);

  constructor(private readonly settingsService: SettingsService) {
    super();
  }

  private async config(): Promise<{ apiKey: string; template: string }> {
    try {
      const s = await this.settingsService.findSettings();
      return {
        apiKey: s.sms?.kavenegarApiKey || (process.env.KAVENEGAR_API_KEY ?? ''),
        template:
          s.sms?.kavenegarOtpTemplate ||
          (process.env.KAVENEGAR_OTP_TEMPLATE ?? 'nikstore-otp'),
      };
    } catch {
      return {
        apiKey: process.env.KAVENEGAR_API_KEY ?? '',
        template: process.env.KAVENEGAR_OTP_TEMPLATE ?? 'nikstore-otp',
      };
    }
  }

  async sendOtp(phone: string, code: string): Promise<void> {
    const { apiKey, template } = await this.config();

    if (!apiKey) {
      this.logger.warn('[KAVENEGAR] API key not set — OTP not sent');
      return;
    }

    const url = `https://api.kavenegar.com/v1/${apiKey}/verify/lookup.json`;
    const body = new URLSearchParams({
      receptor: phone,
      token: code,
      template,
    });

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    const json = (await res.json()) as KavenegarResponse;
    const status = json?.return?.status;

    if (status !== 200) {
      const msg = json?.return?.message ?? `HTTP ${res.status}`;
      this.logger.error(
        `[KAVENEGAR] OTP failed | phone: ${phone} | status: ${status} | ${msg}`,
      );
      throw new Error(`Kavenegar OTP error: ${msg}`);
    }

    this.logger.log(`[KAVENEGAR] OTP sent | phone: ${phone}`);
  }
}
