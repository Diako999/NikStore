import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT ?? '3000', 10) || 3000,
  name: process.env.APP_NAME || 'storein',
  allowedOrigins: process.env
    .ALLOWED_ORIGINS!.split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  paymentCallbackUrl: process.env.PAYMENT_CALLBACK_URL,
}));
