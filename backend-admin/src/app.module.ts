import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { AdminModule } from './modules/admin/admin.module';
import { GeneralModule } from './modules/general/general.module';
import { CommunityModule } from './modules/community/community.module';
import { PostModule } from './modules/post/post.module';
import { CommentModule } from './modules/comment/comment.module';
import { PollModule } from './modules/poll/poll.module';
import { FeedModule } from './modules/feed/feed.module';
import { SubscriptionModule } from './modules/subscription/subscription.module';
import { SharedModule } from './modules/shared/shared.module';
import { NotificationModule } from './modules/notification/notification.module';
import { EmailModule } from './modules/email/email.module';
import { JobModule } from './modules/job/job.module';
import { SearchModule } from './modules/search/search.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { getRedisConfig } from './config/services.config';
import { CurrencyModule } from './modules/currency/currency.module';
import { AppSettingsModule } from './modules/app-settings/app-settings.module';
import { PrivacyPolicyModule } from './modules/privacy-policy/privacy-policy.module';
import { SupportModule } from './modules/support/support.module';
import { BannerModule } from './modules/banner/banner.module';
import { EntitlementsModule } from './modules/entitlements/entitlements.module';
import { MediaModule } from './modules/media/media.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      cache: true,
      load: [
        () => require('./config/app.config').default,
        () => require('./config/services.config').default,
      ],
    }),
    PrismaModule,
    // Rate Limiting Configuration
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
    // Caching Configuration (Redis if available, otherwise in-memory)
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const redisConfig = getRedisConfig(configService);

        if (redisConfig) {
          try {
            const redisStore = require('cache-manager-redis-store');
            console.log(
              `CacheModule: Using Redis at ${redisConfig.host}:${redisConfig.port}`,
            );
            return {
              store: redisStore.default || redisStore,
              host: redisConfig.host,
              port: redisConfig.port,
              password: redisConfig.password,
              db: redisConfig.db,
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
    ScheduleModule.forRoot(),
    AuthModule,
    UserModule,
    AdminModule,
    GeneralModule,
    CommunityModule,
    PostModule,
    CommentModule,
    PollModule,
    FeedModule,
    SubscriptionModule,
    SharedModule,
    NotificationModule,
    EmailModule,
    JobModule,
    SearchModule,
    TemplatesModule,
    CurrencyModule,
    AppSettingsModule,
    PrivacyPolicyModule,
    SupportModule,
    BannerModule,
    EntitlementsModule,
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
