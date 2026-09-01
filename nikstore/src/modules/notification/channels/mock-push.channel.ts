import { Injectable, Logger } from '@nestjs/common';
import {
  ChannelPayload,
  PushNotificationChannel,
} from './notification-channel.abstract';

@Injectable()
export class MockPushChannel extends PushNotificationChannel {
  private readonly logger = new Logger(MockPushChannel.name);

  send(payload: ChannelPayload): Promise<void> {
    this.logger.log(
      `🔔 [MOCK PUSH] → ${payload.userId} | ${payload.title}: ${payload.body}`,
    );
    return Promise.resolve();
  }
}
