import { Injectable, Logger } from '@nestjs/common';
import { SmsNotificationChannel } from './notification-channel.abstract';

@Injectable()
export class MockSmsChannel extends SmsNotificationChannel {
  private readonly logger = new Logger(MockSmsChannel.name);

  send(phone: string, body: string): Promise<void> {
    this.logger.log(`📱 [MOCK SMS NOTIFY] → ${phone} | ${body}`);
    return Promise.resolve();
  }
}
