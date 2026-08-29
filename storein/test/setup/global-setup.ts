import { MongoMemoryServer } from 'mongodb-memory-server';

declare global {
  var __MONGOD__: MongoMemoryServer | undefined;
}

export default async function globalSetup(): Promise<void> {
  const mongod = await MongoMemoryServer.create();
  global.__MONGOD__ = mongod;

  process.env.MONGODB_URI = mongod.getUri();
  process.env.NODE_ENV = 'test';
  process.env.PORT = '3099';
  process.env.APP_NAME = 'storein-test';
  process.env.JWT_SECRET = 'test-jwt-secret-e2e-very-long-key';
  process.env.JWT_EXPIRES_IN = '15m';
  process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-e2e-very-long-key';
  process.env.JWT_REFRESH_EXPIRES_IN = '30d';
  process.env.OTP_EXPIRES_IN = '300';
  process.env.OTP_LENGTH = '5';
  process.env.REDIS_HOST = 'localhost';
  process.env.REDIS_PORT = '6379';
  process.env.REDIS_TTL = '300';
  process.env.UPLOAD_DEST = './uploads-test';
  process.env.UPLOAD_MAX_FILE_SIZE = '5242880';
  process.env.UPLOAD_BASE_URL = 'http://localhost:3099';
  process.env.PAYMENT_GATEWAY = 'mock';
  process.env.PAYMENT_CALLBACK_URL =
    'http://localhost:3099/api/v1/payments/verify';
  process.env.ZARINPAL_MERCHANT_ID = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
  process.env.ZARINPAL_SANDBOX = 'true';
  process.env.SMS_PROVIDER = 'mock';
  process.env.KAVENEGAR_API_KEY = '';
  process.env.KAVENEGAR_SENDER = '';
  process.env.KAVENEGAR_OTP_TEMPLATE = 'storein-otp';
  process.env.ALLOWED_ORIGINS = 'http://localhost:4000';
}
