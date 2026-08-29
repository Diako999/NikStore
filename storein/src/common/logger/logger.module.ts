import { Module, Global } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import { AppLoggerService } from './app-logger.service';

/** Best-effort, type-safe stringification for loosely-typed winston log fields. */
function toDisplayString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value === undefined || value === null) return '';
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return '';
  }
}

@Global()
@Module({
  imports: [
    WinstonModule.forRootAsync({
      useFactory: (config: ConfigService) => {
        const isProduction = config.get('app.nodeEnv') === 'production';
        const isDev = !isProduction;

        const logFormat = winston.format.combine(
          winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
          winston.format.errors({ stack: true }),
          winston.format.json(),
        );

        const consoleFormat = winston.format.combine(
          winston.format.timestamp({ format: 'HH:mm:ss' }),
          winston.format.errors({ stack: true }),
          winston.format.colorize({ all: true }),
          winston.format.printf(
            ({ timestamp, level, message, context, requestId, ...meta }) => {
              const ctx = context ? `[${toDisplayString(context)}]` : '';
              const rid = requestId
                ? `(${toDisplayString(requestId).slice(0, 8)})`
                : '';
              const extra = Object.keys(meta).length
                ? '\n' + JSON.stringify(meta, null, 2)
                : '';
              return `${toDisplayString(timestamp)} ${level} ${ctx}${rid} ${toDisplayString(message)}${extra}`;
            },
          ),
        );

        const transports: winston.transport[] = [];

        transports.push(
          new winston.transports.Console({
            level: isDev ? 'debug' : 'info',
            format: consoleFormat,
          }),
        );

        if (isDev) {
          transports.push(
            new winston.transports.DailyRotateFile({
              filename: 'logs/error-%DATE%.log',
              datePattern: 'YYYY-MM-DD',
              level: 'error',
              format: logFormat,
              maxSize: '20m',
              maxFiles: '30d',
              zippedArchive: true,
            }),
          );

          transports.push(
            new winston.transports.DailyRotateFile({
              filename: 'logs/combined-%DATE%.log',
              datePattern: 'YYYY-MM-DD',
              level: 'debug',
              format: logFormat,
              maxSize: '50m',
              maxFiles: '14d',
              zippedArchive: true,
            }),
          );
        }

        return { transports };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [AppLoggerService],
  exports: [WinstonModule, AppLoggerService],
})
export class LoggerModule {}
