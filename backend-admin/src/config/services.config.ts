import { registerAs, ConfigService } from '@nestjs/config';
import { RedisOptions } from 'ioredis';

/**
 * Shared Services Configuration
 *
 * Centralized configuration for all external services (media, redis, ...).
 * Hardcoded per-environment — no reliance on .env.
 *
 * To switch environments, change the `hostType` constant below.
 */

// ─── SWITCH ME ────────────────────────────────────────────────
// "local" → localhost URLs
// "live"  → production (jawab.jantrah.io / redis_container)
export const hostType: 'local' | 'live' = 'local';
// ──────────────────────────────────────────────────────────────

const CONFIGS = {
  local: {
    media: {
      url: 'http://localhost:3000',
      apiUrl: 'http://localhost:3000/api',
    },
    redis: {
      host: 'localhost',
    },
  },
  live: {
    media: {
      url: 'https://jawab.jantrah.io/jawab-media',
      apiUrl: 'https://jawab.jantrah.io/jawab-media/api',
    },
    redis: {
      host: 'redis_container',
    },
  },
} as const;

const active = CONFIGS[hostType];

/**
 * Directly-exported media config. Use this instead of `configService.get('services')`
 * in constructor-scoped code to avoid NestJS registerAs namespace timing issues.
 */
export const MEDIA_CONFIG = {
  url: active.media.url,
  apiUrl: active.media.apiUrl,
  timeout: 120000, // 2 minutes for large file uploads
};

export default registerAs('services', () => ({
  media: MEDIA_CONFIG,

  redis: {
    host: active.redis.host,
    port: 6379,
    password: undefined,
    db: 0,
    maxRetriesPerRequest: 3,
  },
}));

/**
 * Get Redis configuration from centralized services config.
 * Used by RedisService, BullMQ (EmailModule), and CacheModule (AppModule).
 *
 * Reads directly from the hardcoded CONFIGS object — no env fallback.
 */
export const getRedisConfig = (_configService: ConfigService): RedisOptions | null => {
  return {
    host: active.redis.host,
    port: 6379,
    password: undefined,
    db: 0,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  };
};
