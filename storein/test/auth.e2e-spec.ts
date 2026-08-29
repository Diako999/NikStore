import { INestApplication } from '@nestjs/common';
import type { Server } from 'http';
import request from 'supertest';
import type Redis from 'ioredis';
import { REDIS_CLIENT } from 'src/redis/redis.module';
import { createTestApp, closeTestApp } from './helpers/app.helper';
import {
  loginAsNewUser,
  refreshSession,
  generateTestPhone,
} from './helpers/auth.helper';
import { getOtpFromRedis } from './helpers/seed.helper';

interface SendOtpResponseBody {
  message: string;
  expiresIn: number;
}

interface ErrorResponseBody {
  message: string | string[];
}

interface VerifyOtpResponseBody {
  accessToken: string;
  isNewUser: boolean;
}

interface RefreshResponseBody {
  accessToken: string;
}

describe('Auth (e2e)', () => {
  let app: INestApplication<Server>;
  let redis: Redis;

  beforeAll(async () => {
    app = (await createTestApp()) as INestApplication<Server>;
    redis = app.get<Redis>(REDIS_CLIENT);
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  beforeEach(async () => {
    await redis.flushall();
  });

  // ── send-otp ──────────────────────────────────────────────────────────────

  describe('POST /api/v1/auth/send-otp', () => {
    it('valid phone → 200 + message', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/send-otp')
        .send({ phone: generateTestPhone() })
        .expect(200);

      const body = res.body as SendOtpResponseBody;
      expect(body.message).toBeDefined();
      expect(body.expiresIn).toBeDefined();
    });

    it('invalid phone format → 400', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/send-otp')
        .send({ phone: '12345' })
        .expect(400);
    });

    it('4th request within window → 400 (custom rate-limit)', async () => {
      const phone = generateTestPhone();

      for (let i = 0; i < 3; i++) {
        await request(app.getHttpServer())
          .post('/api/v1/auth/send-otp')
          .send({ phone })
          .expect(200);
      }

      // 4th attempt exceeds limit (attempts > 3 in auth.service)
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/send-otp')
        .send({ phone })
        .expect(400);

      const body = res.body as ErrorResponseBody;
      expect(body.message).toMatch(/درخواست زیاد/);
    });
  });

  // ── verify-otp ────────────────────────────────────────────────────────────

  describe('POST /api/v1/auth/verify-otp', () => {
    it('correct OTP → 200 + accessToken', async () => {
      const phone = generateTestPhone();
      await request(app.getHttpServer())
        .post('/api/v1/auth/send-otp')
        .send({ phone });

      const otp = await getOtpFromRedis(app, phone);
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/verify-otp')
        .send({ phone, code: otp })
        .expect(200);

      const body = res.body as VerifyOtpResponseBody;
      expect(body.accessToken).toBeDefined();
      expect(typeof body.isNewUser).toBe('boolean');
    });

    it('response carries Set-Cookie with refresh_token', async () => {
      const phone = generateTestPhone();
      await request(app.getHttpServer())
        .post('/api/v1/auth/send-otp')
        .send({ phone });

      const otp = await getOtpFromRedis(app, phone);
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/verify-otp')
        .send({ phone, code: otp })
        .expect(200);

      const setCookie =
        (res.headers['set-cookie'] as string[] | undefined) ?? [];
      const cookie = setCookie.find((c) => c.startsWith('refresh_token='));
      expect(cookie).toBeDefined();
    });

    it('cookie has HttpOnly flag', async () => {
      const phone = generateTestPhone();
      await request(app.getHttpServer())
        .post('/api/v1/auth/send-otp')
        .send({ phone });

      const otp = await getOtpFromRedis(app, phone);
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/verify-otp')
        .send({ phone, code: otp });

      const cookie =
        ((res.headers['set-cookie'] as string[]) ?? []).find((c) =>
          c.startsWith('refresh_token='),
        ) ?? '';
      expect(cookie).toMatch(/HttpOnly/i);
    });

    it('cookie path is /api/v1/auth', async () => {
      const phone = generateTestPhone();
      await request(app.getHttpServer())
        .post('/api/v1/auth/send-otp')
        .send({ phone });

      const otp = await getOtpFromRedis(app, phone);
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/verify-otp')
        .send({ phone, code: otp });

      const cookie =
        ((res.headers['set-cookie'] as string[]) ?? []).find((c) =>
          c.startsWith('refresh_token='),
        ) ?? '';
      expect(cookie).toContain('Path=/api/v1/auth');
    });

    it('accessToken is a valid JWT (3 dot-separated parts)', async () => {
      const { accessToken } = await loginAsNewUser(app);
      const parts = accessToken.split('.');
      expect(parts).toHaveLength(3);
    });

    it('wrong OTP → 401', async () => {
      const phone = generateTestPhone();
      await request(app.getHttpServer())
        .post('/api/v1/auth/send-otp')
        .send({ phone });

      await request(app.getHttpServer())
        .post('/api/v1/auth/verify-otp')
        .send({ phone, code: '000000' })
        .expect(401);
    });

    it('no prior send-otp → 401', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/verify-otp')
        .send({ phone: generateTestPhone(), code: '123456' })
        .expect(401);
    });

    it('brute-force: 6 wrong attempts → 400', async () => {
      const phone = generateTestPhone();
      await request(app.getHttpServer())
        .post('/api/v1/auth/send-otp')
        .send({ phone });

      // 5 wrong attempts → 401 each
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post('/api/v1/auth/verify-otp')
          .send({ phone, code: '000000' })
          .expect(401);
      }

      // 6th attempt hits brute-force guard → 400
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/verify-otp')
        .send({ phone, code: '000000' })
        .expect(400);

      const body = res.body as ErrorResponseBody;
      expect(body.message).toMatch(/تلاش/);
    });
  });

  // ── refresh ───────────────────────────────────────────────────────────────

  describe('POST /api/v1/auth/refresh', () => {
    it('valid cookie → 200 + new accessToken', async () => {
      const { cookie } = await loginAsNewUser(app);
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Cookie', cookie)
        .expect(200);

      const body = res.body as RefreshResponseBody;
      expect(body.accessToken).toBeDefined();
    });

    it('response rotates the refresh cookie', async () => {
      const { cookie } = await loginAsNewUser(app);
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Cookie', cookie)
        .expect(200);

      const newCookies =
        (res.headers['set-cookie'] as string[] | undefined) ?? [];
      expect(newCookies.some((c) => c.startsWith('refresh_token='))).toBe(true);
    });

    it('no cookie → 401', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .expect(401);
    });

    it('tampered cookie value → 401', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Cookie', 'refresh_token=definitely.not.a.valid.jwt')
        .expect(401);
    });

    it('old cookie after rotation is revoked → 401', async () => {
      const { cookie: originalCookie } = await loginAsNewUser(app);
      // Rotate the token
      await refreshSession(app, originalCookie);
      // Old cookie should now be rejected
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Cookie', originalCookie)
        .expect(401);
    });
  });

  // ── logout ────────────────────────────────────────────────────────────────

  describe('POST /api/v1/auth/logout', () => {
    it('valid access token → 200', async () => {
      const { accessToken } = await loginAsNewUser(app);
      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('response clears the refresh_token cookie', async () => {
      const { accessToken, cookie } = await loginAsNewUser(app);
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Cookie', cookie)
        .expect(200);

      const setCookies =
        (res.headers['set-cookie'] as string[] | undefined) ?? [];
      const cleared = setCookies.find((c) => c.startsWith('refresh_token='));
      expect(cleared).toBeDefined();
      // Expiry must be in the past or Max-Age=0
      expect(cleared).toMatch(/Expires=Thu, 01 Jan 1970|Max-Age=0/);
    });

    it('access token still works after logout (JWTs are stateless)', async () => {
      const { accessToken, cookie } = await loginAsNewUser(app);
      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Cookie', cookie);

      // Access token is NOT revoked; wallet endpoint should still respond
      await request(app.getHttpServer())
        .get('/api/v1/payments/wallet')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('refresh cookie is revoked after logout', async () => {
      const { accessToken, cookie } = await loginAsNewUser(app);
      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Cookie', cookie);

      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Cookie', cookie)
        .expect(401);
    });

    it('no auth header → 401', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .expect(401);
    });
  });

  // ── logout-all ────────────────────────────────────────────────────────────

  describe('POST /api/v1/auth/logout-all', () => {
    it('invalidates all sessions including other refresh cookies', async () => {
      const phone = generateTestPhone();

      // Session A
      const sessionA = await loginAsNewUser(app, phone);
      // Session B: send OTP again (RL counter was cleared on first verify) → login again
      const sessionB = await loginAsNewUser(app, phone);

      // Logout all using session A's access token
      await request(app.getHttpServer())
        .post('/api/v1/auth/logout-all')
        .set('Authorization', `Bearer ${sessionA.accessToken}`)
        .expect(200);

      // Session B's cookie must be revoked
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Cookie', sessionB.cookie)
        .expect(401);
    });
  });
});
