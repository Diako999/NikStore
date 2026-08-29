import { INestApplication } from '@nestjs/common';
import type { Server } from 'http';
import request from 'supertest';
import { getOtpFromRedis } from './seed.helper';

export interface AuthSession {
  accessToken: string;
  /** Value to pass to `.set('Cookie', cookie)` — just the `refresh_token=JWT` part. */
  cookie: string;
  phone: string;
}

interface AccessTokenPayload {
  sub: string;
  phone: string;
  iat: number;
  exp: number;
}

interface VerifyOtpResponseBody {
  accessToken: string;
  isNewUser: boolean;
}

interface RefreshResponseBody {
  accessToken: string;
}

/** Decodes the JWT payload without verifying signature. */
export function parseAccessToken(token: string): AccessTokenPayload {
  const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(
    Buffer.from(b64, 'base64').toString('utf8'),
  ) as AccessTokenPayload;
}

/** Generates a valid random Iranian mobile phone number. */
export function generateTestPhone(): string {
  const rand = Math.floor(Math.random() * 9_000_000) + 1_000_000;
  return `0912${rand}`;
}

/**
 * Full login flow:
 *  1. POST /auth/send-otp
 *  2. Read OTP from ioredis-mock
 *  3. POST /auth/verify-otp
 * Returns { accessToken, cookie, phone }.
 */
export async function loginAsNewUser(
  app: INestApplication<Server>,
  phone = generateTestPhone(),
): Promise<AuthSession> {
  await request(app.getHttpServer())
    .post('/api/v1/auth/send-otp')
    .send({ phone })
    .expect(200);

  const otp = await getOtpFromRedis(app, phone);

  const res = await request(app.getHttpServer())
    .post('/api/v1/auth/verify-otp')
    .send({ phone, code: otp })
    .expect(200);

  const body = res.body as VerifyOtpResponseBody;
  const setCookieHeader =
    (res.headers['set-cookie'] as string[] | undefined) ?? [];
  const fullCookie =
    setCookieHeader.find((c) => c.startsWith('refresh_token=')) ?? '';
  // Cookie header for subsequent requests must be just 'refresh_token=JWT'
  const cookie = fullCookie.split(';')[0];

  return { accessToken: body.accessToken, cookie, phone };
}

/**
 * Calls POST /auth/refresh with the current cookie.
 * Returns the new access token and rotated cookie.
 */
export async function refreshSession(
  app: INestApplication<Server>,
  cookie: string,
): Promise<{ accessToken: string; newCookie: string }> {
  const res = await request(app.getHttpServer())
    .post('/api/v1/auth/refresh')
    .set('Cookie', cookie)
    .expect(200);

  const body = res.body as RefreshResponseBody;
  const setCookieHeader =
    (res.headers['set-cookie'] as string[] | undefined) ?? [];
  const fullCookie =
    setCookieHeader.find((c) => c.startsWith('refresh_token=')) ?? '';
  const newCookie = fullCookie.split(';')[0];

  return { accessToken: body.accessToken, newCookie };
}
