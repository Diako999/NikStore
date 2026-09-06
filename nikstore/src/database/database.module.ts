import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Connection } from 'mongoose';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService, logger: Logger) => ({
        uri: configService.get<string>('database.uri'),
        connectionFactory: (connection: Connection) => {
          connection.on('connected', () =>
            logger.info('MongoDB connected', { context: 'Database' }),
          );
          connection.on('error', (err: Error) =>
            logger.error(`MongoDB error: ${err.message}`, {
              context: 'Database',
            }),
          );
          return connection;
        },
      }),
      inject: [ConfigService, WINSTON_MODULE_PROVIDER],
    }),
  ],
})
export class DatabaseModule {}
