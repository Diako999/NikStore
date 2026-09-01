import { registerAs } from '@nestjs/config';
export default registerAs('otp', () => ({
  expiresIn: parseInt(process.env.OTP_EXPIRES_IN ?? '120', 10) || 120,
  length: parseInt(process.env.OTP_LENGTH ?? '6', 10) || 6,
}));
