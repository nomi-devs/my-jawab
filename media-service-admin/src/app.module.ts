import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { CacheModule } from '@nestjs/cache-manager';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MediaModule } from './modules/media/media.module';
import { getDatabaseConfig } from './database/config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      cache: true, // Cache environment variables
      load: [
        () => require('./config/app.config').default,
      ],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getDatabaseConfig,
      inject: [ConfigService],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get<number>('THROTTLE_TTL', 60000),
          limit: configService.get<number>('THROTTLE_LIMIT', 100),
        },
      ],
    }),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const redisHost = configService.get<string>('REDIS_HOST');
        const redisPort = configService.get<number>('REDIS_PORT', 6379);
        
        if (redisHost) {
          try {
            const redisStore = require('cache-manager-redis-store');
            return {
              store: redisStore.default || redisStore,
              host: redisHost,
              port: redisPort,
              password: configService.get<string>('REDIS_PASSWORD'),
              ttl: configService.get<number>('CACHE_TTL', 300),
              max: configService.get<number>('CACHE_MAX', 1000),
            };
          } catch (error) {
            console.warn('Redis store not available, using in-memory cache');
          }
        }
        
        return {
          ttl: configService.get<number>('CACHE_TTL', 300),
          max: configService.get<number>('CACHE_MAX', 1000),
        };
      },
      isGlobal: true,
    }),
    MediaModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
