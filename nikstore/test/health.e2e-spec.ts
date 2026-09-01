import { INestApplication } from '@nestjs/common';
import type { Server } from 'http';
import request from 'supertest';
import { createTestApp, closeTestApp } from './helpers/app.helper';

interface HealthResponseBody {
  status: string;
  info?: {
    mongodb?: {
      status: string;
    };
  };
}

describe('Health (e2e)', () => {
  let app: INestApplication<Server>;

  beforeAll(async () => {
    app = (await createTestApp()) as INestApplication<Server>;
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  it('GET /api/v1/health → 200 with mongodb up', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200);

    const body = res.body as HealthResponseBody;
    expect(body.status).toBe('ok');
    expect(body.info?.mongodb?.status).toBe('up');
  });
});
