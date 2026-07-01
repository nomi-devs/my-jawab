import { registerAs, ConfigService } from '@nestjs/config';
import { RedisOptions } from 'ioredis';

/**
 * Shared Services Configuration
 *
 * To switch environments, change the `hostType` constant below.
 * "local" → localhost Redis
 * "live"  → redis_container (Docker)
 */

// ─── SWITCH ME ────────────────────────────────────────────────
export const hostType: 'local' | 'live' = 'local';
// ──────────────────────────────────────────────────────────────

const CONFIGS = {
  local: {
    redis: { host: 'localhost' },
  },
  live: {
    redis: { host: 'redis_container' },
  },
} as const;

const active = CONFIGS[hostType];

export default registerAs('services', () => ({
  redis: {
    host: active.redis.host,
    port: 6379,
    password: undefined,
    db: 0,
    maxRetriesPerRequest: 3,
  },
}));

export const getRedisConfig = (
  _configService: ConfigService,
): RedisOptions | null => {
  return {
    host: active.redis.host,
    port: 6379,
    password: undefined,
    db: 0,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    retryStrategy: (times) => Math.min(times * 50, 2000),
  };
};
