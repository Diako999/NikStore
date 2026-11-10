import { Injectable, Logger } from '@nestjs/common';
import { SmsService } from './sms.service.abstract';

@Injectable()
export class MockSmsService extends SmsService {
  private readonly logger = new Logger(MockSmsService.name);
  sendOtp(phone: string, code: string): Promise<void> {
    // Never write live OTP codes to production logs — a misconfigured provider
    // would otherwise leak working login codes to anyone who can read them.
    const isProd = process.env.NODE_ENV === 'production';
    this.logger.log(
      isProd
        ? `📱 [MOCK SMS] not delivered (no SMS provider configured) → ${phone}`
        : `📱 [MOCK SMS] → ${phone} | OTP: ${code}`,
    );
    return Promise.resolve();
  }
}
