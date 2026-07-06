import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import compression from 'compression';
import helmet from 'helmet';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { getCorsConfig } from './config/origins';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'], // Enable all log levels including debug
  });
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Security: Helmet for security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:', 'http:'],
          mediaSrc: ["'self'", 'data:', 'https:', 'http:'],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: false, // Set explicitly in media controller per file
    }),
  );

  // Performance: Compression middleware
  app.use(compression());

  // Security: Configure CORS using shared origins configuration
  const corsOrigins = configService.get<string>('CORS_ORIGINS');
  const corsConfig = getCorsConfig(corsOrigins);
  app.enableCors(corsConfig);

  logger.log(
    `🔒 CORS configured with origins: ${corsOrigins || 'default (localhost ports)'}`,
  );

  // Log request origin for debugging
  app.use((req, res, next) => {
    const origin = req.headers.origin || req.headers.referer || 'No origin';
    logger.debug(
      `Request from origin: ${origin} | Method: ${req.method} | Path: ${req.path}`,
    );
    next();
  });

  // Security: Request size limits (50MB to support file uploads)
  app.use((req, res, next) => {
    if (req.headers['content-length']) {
      const contentLength = parseInt(req.headers['content-length'], 10);
      if (contentLength > 50 * 1024 * 1024) {
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

  // Swagger documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Jawab API')
    .setDescription(
      'Jawab backend REST API community platform with posts, polls, topics, subscriptions, and more.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT access token',
      },
      'JWT-auth',
    )
    .addTag('Auth', 'User authentication and account management')
    .addTag('Admin Auth', 'Admin authentication')
    .addTag('Devices', 'Device registration for push notifications')
    .addTag('Users', 'User profile and social features')
    .addTag('Posts', 'Post creation and management')
    .addTag('Comments', 'Comment management')
    .addTag('Polls', 'Poll creation, voting, and management')
    .addTag('Communities', 'Community management')
    .addTag('Topics', 'Topic/category management')
    .addTag('Feed', 'Personalised and trending feeds')
    .addTag('Search', 'Global search across content types')
    .addTag('Subscriptions', 'Subscription plans and payments')
    .addTag('Banners', 'Banner management')
    .addTag('Notifications', 'User notifications')
    .addTag('Media', 'File upload and media management')
    .addTag('Admin', 'Admin panel operations')
    .addTag('App Settings', 'Application-level settings')
    .addTag('Currencies', 'Currency management')
    .addTag('Templates', 'Email and PDF templates')
    .addTag('Privacy Policy', 'Privacy policy content')
    .addTag('Support', 'Support contact information')
    .addTag('Entitlements', 'User plan entitlements and quotas')
    .addTag('Jobs', 'Background job tracking')
    .addTag('Email', 'Email queue and testing')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  // Graceful shutdown
  app.enableShutdownHooks();

  const port = configService.get<number>('PORT', 3001);
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 Jawab Backend is running on: http://0.0.0.0:${port}`);
  logger.log(`📡 API endpoints: http://0.0.0.0:${port}/api`);
  logger.log(`📖 Swagger docs: http://0.0.0.0:${port}/api/docs`);
  logger.log(`🔒 Security: Helmet, CORS, Rate Limiting enabled`);
  logger.log(`⚡ Performance: Compression, Connection Pooling enabled`);
}
bootstrap();
