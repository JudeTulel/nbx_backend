import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe - validates all incoming requests
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,           // Strip properties not in DTO
    transform: true,           // Auto-transform to DTO types
    forbidNonWhitelisted: false, // Don't throw on extra props (safer for frontend compat)
  }));

  // Allow multiple origins
  app.enableCors({
    origin: '*',
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
