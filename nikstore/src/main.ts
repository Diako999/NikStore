import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import {
  WINSTON_MODULE_NEST_PROVIDER,
  WINSTON_MODULE_PROVIDER,
} from 'nest-winston';
import { Logger } from 'winston';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  // Use Winston as NestJS built-in logger (replaces console.log in framework output)
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port') ?? 3000;
  const uploadDest = configService.get<string>('upload.dest') ?? './uploads';
  const allowedOrigins =
    configService.get<string[]>('app.allowedOrigins') ?? [];

  app.useStaticAssets(path.resolve(uploadDest), { prefix: '/uploads' });
  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Retrieve logger instance and wire into global filter + interceptors
  const winstonLogger = app.get<Logger>(WINSTON_MODULE_PROVIDER);
  app.useGlobalFilters(new AllExceptionsFilter(winstonLogger));
  app.useGlobalInterceptors(
    new LoggingInterceptor(winstonLogger),
    new ResponseInterceptor(),
  );

  // Swagger — only expose in non-production environments
  if (configService.get('app.nodeEnv') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('NikStore API')
      .setDescription('NikStore e-commerce REST API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  app.use(cookieParser());

  // Helmet must disable crossOriginResourcePolicy on the API — the default
  // "same-origin" policy causes browsers to block cross-origin API responses
  // (frontend ↔ backend on different Railway subdomains).
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  winstonLogger.info(
    `🔒 CORS origins: ${allowedOrigins.join(', ')} | NODE_ENV: ${process.env.NODE_ENV} | build: 2026-06-20`,
    { context: 'Bootstrap' },
  );

  app.enableShutdownHooks();

  await app.listen(port);
  winstonLogger.info(
    `🚀 NikStore API running on http://localhost:${port}/api/v1`,
    {
      context: 'Bootstrap',
    },
  );
  winstonLogger.info(`📁 Uploads served at http://localhost:${port}/uploads`, {
    context: 'Bootstrap',
  });

  // Signal PM2 that the app is fully ready (wait_ready: true in ecosystem.config.js)
  if (process.send) {
    process.send('ready');
  }
}

void bootstrap();
