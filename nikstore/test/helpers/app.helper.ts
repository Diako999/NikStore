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
