import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { getCorsConfig } from './config/origins';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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
        mediaSrc: ["'self'", 'data:', 'https:', 'http:'],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false, // Disable default CORP, we set it explicitly in media controller
  }));

  // Performance: Compression middleware
  app.use(compression());

  // Security: Configure CORS using shared origins configuration
  const corsOrigins = configService.get<string>('CORS_ORIGINS');
  const corsConfig = getCorsConfig(corsOrigins);
  app.enableCors(corsConfig);
  
  logger.log(`🔒 CORS configured with origins: ${corsOrigins || 'default (localhost ports)'}`);

  // Security: Request size limits for file uploads
  app.use((req, res, next) => {
    const maxSize = configService.get<number>('MAX_FILE_SIZE', 50 * 1024 * 1024); // 50MB
    if (req.headers['content-length']) {
      const contentLength = parseInt(req.headers['content-length'], 10);
      if (contentLength > maxSize) {
        return res.status(413).json({
          statusCode: 413,
          message: 'Request entity too large',
        });
      }
    }
    next();
  });

  // Enable validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      stopAtFirstError: true,
      disableErrorMessages: configService.get('NODE_ENV') === 'production',
    }),
  );

  // Set global prefix
  app.setGlobalPrefix('api');

  // Graceful shutdown
  app.enableShutdownHooks();

  // Use app config for easy access
  const appConfig = configService.get('app');
  const port = appConfig?.port || configService.get<number>('PORT', 3000);
  const appUrl = appConfig?.url || `http://0.0.0.0:${port}`;
  const apiUrl = appConfig?.apiUrl || `${appUrl}/api`;
  const uploadDir = appConfig?.upload?.uploadDir || configService.get<string>('UPLOAD_DIR', './uploads');

  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 ${appConfig?.name || 'Jawab Media Service'} is running on: ${appUrl}`);
  logger.log(`📡 API endpoints: ${apiUrl}`);
  logger.log(`📁 Upload directory: ${uploadDir}`);
  logger.log(`🔒 Security: Helmet, CORS, Rate Limiting enabled`);
  logger.log(`⚡ Performance: Compression, Connection Pooling enabled`);
}
bootstrap();
