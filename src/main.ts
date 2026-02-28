import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── Security Headers ──────────────────────────────────────────────
  app.use(helmet());

  // ── Global Validation Pipe ────────────────────────────────────────
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,           // Strip properties not in DTO
    transform: true,           // Auto-transform to DTO types
    forbidNonWhitelisted: true, // Throw on extra/unexpected properties
  }));

  // ── CORS – Allowed Origins ────────────────────────────────────────
  // new frontend domains to this array as needed
  const ALLOWED_ORIGINS: string[] = [
    'https://nbx-exchange.co.ke',
  ];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. server-to-server, webhooks, curl)
      if (!origin) {
        return callback(null, true);
      }
      if (ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    maxAge: 86400, // Cache preflight for 24 hours
  });

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
