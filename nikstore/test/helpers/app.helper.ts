import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import RedisMock from 'ioredis-mock';
import { AppModule } from 'src/app.module';
import { REDIS_CLIENT } from 'src/redis/redis.module';
import { SettingsService } from 'src/modules/settings/settings.service';

/**
 * Creates an isolated NestJS test application.
 * - Uses real AppModule (all routes, guards, pipes as in production)
 * - MongoDB connects to MongoMemoryServer (URI from process.env.MONGODB_URI)
 * - Redis replaced with ioredis-mock
 * - Same middleware stack as main.ts (cookieParser, helmet, ValidationPipe)
 */
export async function createTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(REDIS_CLIENT)
    .useValue(new RedisMock())
    .compile();

  const app = moduleRef.createNestApplication<NestExpressApplication>();

  app.use(cookieParser());
  app.use(helmet());
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();

  // New-account registration is closed by default in production (SMS provider not
  // active yet). The e2e suite signs up fresh users via OTP, so open it here.
  await app.get(SettingsService).updateSettings({ registrationEnabled: true });
  return app;
}

export async function closeTestApp(app: INestApplication): Promise<void> {
  try {
    const connection = app.get<Connection>(getConnectionToken());
    await connection.dropDatabase();
    await connection.close();
  } catch {
    // Connection may already be closed
  }
  await app.close();
}
