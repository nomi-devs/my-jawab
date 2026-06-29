import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { getCorsConfig } from './config/origins';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'], // Enable all log levels including debug
  });
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Security: Helmet for security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:', 'http:'],
      },
    },
    crossOriginEmbedderPolicy: false, // Allow embedding if needed
  }));

  // Performance: Compression middleware
  app.use(compression());

  // Security: Configure CORS using shared origins configuration
  const corsOrigins = configService.get<string>('CORS_ORIGINS');
  const corsConfig = getCorsConfig(corsOrigins);
  app.enableCors(corsConfig);
  
  logger.log(`🔒 CORS configured with origins: ${corsOrigins || 'default (localhost ports)'}`);

  // Log request origin for debugging
  app.use((req, res, next) => {
    const origin = req.headers.origin || req.headers.referer || 'No origin';
    logger.debug(`Request from origin: ${origin} | Method: ${req.method} | Path: ${req.path}`);
    next();
  });

  // Security: Request size limits
  app.use((req, res, next) => {
    // Limit request body size to 10MB
    if (req.headers['content-length']) {
      const contentLength = parseInt(req.headers['content-length'], 10);
      if (contentLength > 10 * 1024 * 1024) {
        return res.status(413).json({
          statusCode: 413,
          message: 'Request entity too large',
        });
      }
    }
    next();
  });

  // Enable validation pipe with enhanced security
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      // Stop at first validation error for performance
      stopAtFirstError: true,
      // Disable detailed error messages in production
      disableErrorMessages: configService.get('NODE_ENV') === 'production',
    }),
  );

  // Set global prefix
  app.setGlobalPrefix('api');

  // Graceful shutdown
  app.enableShutdownHooks();

  const port = configService.get<number>('PORT', 3001);
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 Jawab Backend is running on: http://0.0.0.0:${port}`);
  logger.log(`📡 API endpoints: http://0.0.0.0:${port}/api`);
  logger.log(`🔒 Security: Helmet, CORS, Rate Limiting enabled`);
  logger.log(`⚡ Performance: Compression, Connection Pooling enabled`);
}
bootstrap();
