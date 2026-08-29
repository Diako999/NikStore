export interface ChannelPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

export abstract class SmsNotificationChannel {
  abstract send(phone: string, body: string): Promise<void>;
}

export abstract class PushNotificationChannel {
  abstract send(payload: ChannelPayload): Promise<void>;
}
