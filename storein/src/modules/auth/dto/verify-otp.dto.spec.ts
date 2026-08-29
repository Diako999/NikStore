import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { VerifyOtpDto } from './verify-otp.dto';

async function validateDto(plain: object) {
  const instance = plainToInstance(VerifyOtpDto, plain);
  return validate(instance);
}

describe('VerifyOtpDto', () => {
  describe('code validation', () => {
    it('accepts exactly 6 digits', async () => {
      const errors = await validateDto({
        phone: '09121234567',
        code: '123456',
      });
      expect(errors).toHaveLength(0);
    });

    it('rejects 5-digit code', async () => {
      const errors = await validateDto({ phone: '09121234567', code: '12345' });
      const codeErr = errors.find((e) => e.property === 'code');
      expect(codeErr).toBeDefined();
      expect(Object.values(codeErr!.constraints!)[0]).toContain('۶ رقم');
    });

    it('rejects 7-digit code', async () => {
      const errors = await validateDto({
        phone: '09121234567',
        code: '1234567',
      });
      const codeErr = errors.find((e) => e.property === 'code');
      expect(codeErr).toBeDefined();
    });

    it('rejects empty code', async () => {
      const errors = await validateDto({ phone: '09121234567', code: '' });
      expect(errors.find((e) => e.property === 'code')).toBeDefined();
    });
  });

  describe('phone validation', () => {
    it('accepts 09xxxxxxxxx format', async () => {
      const errors = await validateDto({
        phone: '09121234567',
        code: '123456',
      });
      expect(errors).toHaveLength(0);
    });

    it('accepts +98xxxxxxxxx format', async () => {
      const errors = await validateDto({
        phone: '+989121234567',
        code: '123456',
      });
      expect(errors).toHaveLength(0);
    });

    it('rejects invalid phone', async () => {
      const errors = await validateDto({
        phone: '01234567890',
        code: '123456',
      });
      expect(errors.find((e) => e.property === 'phone')).toBeDefined();
    });
  });
});
