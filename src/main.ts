import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, BadRequestException } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const { port, globalPrefix } = configService.get('app');
  const configuredOrigins =
    configService.get<string[]>('cors.origins') ?? [];
  const frontendUrl =
    configService.get<string>('frontend.url') ??
    'https://frontend.onrender.com';
  const originWhitelist = Array.from(
    new Set([
      'http://localhost:3000',
      frontendUrl,
      ...configuredOrigins,
    ]),
  );

  app.setGlobalPrefix(globalPrefix);
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }
      if (originWhitelist.includes('*') || originWhitelist.includes(origin)) {
        return callback(null, true);
      }
      return callback(
        new Error(`Origin ${origin} is not allowed by CORS policy`),
        false,
      );
    },
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      forbidNonWhitelisted: false,
      disableErrorMessages: false,
      exceptionFactory: (errors) => {
        const messages = errors.map((error) => {
          const constraints = error.constraints;
          if (constraints) {
            return Object.values(constraints).join(', ');
          }
          return `${error.property} has invalid value`;
        });
        return new BadRequestException({
          message: messages.join('; '),
          error: 'Validation failed',
          statusCode: 400,
        });
      },
    }),
  );

  await app.listen(port);
}
bootstrap();
