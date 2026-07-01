import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { getRedisConfig } from '../../../config/services.config';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | undefined;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const redisConfig = getRedisConfig(this.configService) || {
      host: 'redis_container',
      port: 6379,
    };

    if (!redisConfig) {
      this.logger.warn('Redis not configured, Redis features will be disabled');
      return;
    }

    this.logger.log(
      `Connecting to Redis at ${redisConfig.host}:${redisConfig.port} (db: ${redisConfig.db})`,
    );

    try {
      this.client = new Redis({
        ...redisConfig,
        lazyConnect: false,
      });

      this.client.on('connect', () => {
        this.logger.log('Redis client connected');
      });

      this.client.on('ready', () => {
        this.logger.log('Redis client ready');
      });

      this.client.on('error', (error) => {
        this.logger.error(`Redis client error: ${error.message}`);
      });

      this.client.on('close', () => {
        this.logger.warn('Redis client connection closed');
      });

      // Test connection
      await this.client.ping();
      this.logger.log('Redis connection established successfully');
    } catch (error) {
      this.logger.error(`Failed to connect to Redis: ${error.message}`);
      this.logger.warn('Redis features will be disabled');
      this.client = undefined;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
      this.logger.log('Redis client disconnected');
    }
  }

  /**
   * Get Redis client instance
   * Returns null if Redis is not available
   */
  getClient(): Redis | null {
    return this.client || null;
  }

  /**
   * Check if Redis is available
   */
  isAvailable(): boolean {
    return this.client !== undefined && this.client !== null;
  }

  /**
   * Execute Redis command with error handling
   */
  async execute<T>(command: (client: Redis) => Promise<T>): Promise<T | null> {
    if (!this.isAvailable()) {
      this.logger.warn('Redis is not available, operation skipped');
      return null;
    }

    try {
      return await command(this.client!);
    } catch (error) {
      this.logger.error(`Redis operation failed: ${error.message}`);
      return null;
    }
  }
}
