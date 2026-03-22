import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { IoAdapter } from '@nestjs/platform-socket.io';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3001);
  const frontendUrl = configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  // ─── Security ─────────────────────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: nodeEnv === 'production',
      crossOriginEmbedderPolicy: false,
    }),
  );

  // ─── CORS ─────────────────────────────────────────────────────
  app.enableCors({
    origin: configService
      .get<string>('CORS_ORIGINS', frontendUrl)
      .split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Workspace-Id'],
  });

  // ─── Middleware ───────────────────────────────────────────────
  app.use(compression());
  app.use(cookieParser());

  // ─── WebSockets ───────────────────────────────────────────────
  app.useWebSocketAdapter(new IoAdapter(app));

  // ─── Versioning ───────────────────────────────────────────────
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // ─── Global Prefix ────────────────────────────────────────────
  app.setGlobalPrefix('api', {
    exclude: ['health', '/'],
  });

  // ─── Validation ───────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ─── Global Filters & Interceptors ────────────────────────────
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  // ─── Swagger ──────────────────────────────────────────────────
  if (nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Barmagly API')
      .setDescription('Barmagly Social Media Manager — Enterprise SaaS API')
      .setVersion('1.0')
      .addBearerAuth()
      .addApiKey({ type: 'apiKey', name: 'X-API-Key', in: 'header' }, 'api-key')
      .addTag('auth', 'Authentication & Authorization')
      .addTag('workspaces', 'Workspace Management')
      .addTag('social-accounts', 'Social Media Accounts')
      .addTag('posts', 'Post Management & Scheduling')
      .addTag('inbox', 'Unified Smart Inbox')
      .addTag('campaigns', 'Campaign Management')
      .addTag('analytics', 'Analytics & Reporting')
      .addTag('ai', 'AI Agents & Automation')
      .addTag('email', 'Email Marketing')
      .addTag('crm', 'CRM & Contacts')
      .addTag('billing', 'Billing & Subscriptions')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  // ─── Graceful Shutdown ────────────────────────────────────────
  app.enableShutdownHooks();

  await app.listen(port);
  console.log(`🚀 Barmagly API running on http://localhost:${port}/api`);
  console.log(`📚 Swagger docs: http://localhost:${port}/docs`);
}

bootstrap();
