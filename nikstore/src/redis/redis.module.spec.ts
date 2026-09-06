import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import Redis from 'ioredis';
import { RedisModule, REDIS_CLIENT } from './redis.module';
import redisConfig from '../config/redis.config';

describe('RedisModule', () => {
  it('should provide REDIS_CLIENT token', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [redisConfig],
          isGlobal: true,
        }),
        WinstonModule.forRoot({ transports: [] }),
        RedisModule,
      ],
    }).compile();

    const redisClient = module.get<Redis>(REDIS_CLIENT);
    expect(redisClient).toBeDefined();
  });
});
