import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { RedisService } from '../shared/services/redis.service';
import { EntitlementsService } from './entitlements.service';
import { FeatureKey } from './entitlements.constants';

export interface QuotaStatus {
  key: string;
  used: number;
  limit: number; // -1 = unlimited
  remaining: number; // -1 = unlimited
  resetsAt: string | null; // ISO date string
  unlimited: boolean;
}

/**
 * Tracks per-user daily quotas using Redis counters.
 * Keys expire at midnight UTC (daily rollover).
 *
 * Usage:
 *   const status = await quotaService.check(userId, 'daily_post_limit');
 *   if (status.exceeded) throw ForbiddenException(...)
 *
 *   // or combined:
 *   await quotaService.consume(userId, 'daily_post_limit');  // throws if over
 */
@Injectable()
export class QuotaService {
  private readonly logger = new Logger(QuotaService.name);
  private readonly PREFIX = 'quota:user';

  constructor(
    private readonly redis: RedisService,
    private readonly entitlements: EntitlementsService,
  ) {}

  /** Today's date string (UTC) used in Redis keys. */
  private today(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  }

  /** Seconds until midnight UTC — TTL for daily counters. */
  private secondsUntilMidnightUtc(): number {
    const now = new Date();
    const tomorrow = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1,
        0,
        0,
        0,
        0,
      ),
    );
    return Math.floor((tomorrow.getTime() - now.getTime()) / 1000);
  }

  /** Next UTC midnight ISO string — used for the "resetsAt" field shown to clients. */
  private resetsAtIso(): string {
    const now = new Date();
    const midnight = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1,
        0,
        0,
        0,
        0,
      ),
    );
    return midnight.toISOString();
  }

  private buildKey(userId: number, featureKey: string): string {
    return `${this.PREFIX}:${userId}:${featureKey}:${this.today()}`;
  }

  /**
   * Read-only — how many uses has the user spent today for this feature?
   */
  async getUsed(
    userId: number,
    featureKey: FeatureKey | string,
  ): Promise<number> {
    const key = this.buildKey(userId, featureKey);
    const val = await this.redis.execute((client) => client.get(key));
    return val ? parseInt(val, 10) : 0;
  }

  /**
   * Full quota status for a user+feature. Does not consume.
   */
  async status(
    userId: number,
    featureKey: FeatureKey | string,
  ): Promise<QuotaStatus> {
    const limit = await this.entitlements.getLimit(userId, featureKey);
    const used = await this.getUsed(userId, featureKey);
    const unlimited = limit === -1;
    return {
      key: String(featureKey),
      used,
      limit,
      remaining: unlimited ? -1 : Math.max(0, limit - used),
      resetsAt: unlimited ? null : this.resetsAtIso(),
      unlimited,
    };
  }

  /**
   * Check whether the user is still within quota (without consuming).
   * Returns true if allowed, false if would exceed.
   */
  async canConsume(
    userId: number,
    featureKey: FeatureKey | string,
  ): Promise<boolean> {
    const { unlimited, limit, used } = await this.status(userId, featureKey);
    if (unlimited) return true;
    if (limit <= 0) return false; // 0 = explicitly disabled
    return used < limit;
  }

  /**
   * Atomically increment the counter and enforce the limit.
   * Throws ForbiddenException if the user is over limit.
   * Returns the updated status.
   */
  async consume(
    userId: number,
    featureKey: FeatureKey | string,
    errorMessage?: string,
  ): Promise<QuotaStatus> {
    const limit = await this.entitlements.getLimit(userId, featureKey);

    // Unlimited — no tracking needed (but still increment for analytics)
    if (limit === -1) {
      await this.incrementCounter(userId, featureKey);
      const used = await this.getUsed(userId, featureKey);
      return {
        key: String(featureKey),
        used,
        limit: -1,
        remaining: -1,
        resetsAt: null,
        unlimited: true,
      };
    }

    if (limit <= 0) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Feature Gated',
        message: errorMessage || `Your plan does not allow: ${featureKey}`,
        upgrade_required: true,
        feature: String(featureKey),
      });
    }

    // Increment first, then check. Redis ensures atomicity.
    const newCount = await this.incrementCounter(userId, featureKey);

    if (newCount > limit) {
      // Roll back the over-the-limit increment
      await this.redis.execute((client) =>
        client.decr(this.buildKey(userId, featureKey)),
      );

      throw new ForbiddenException({
        statusCode: 403,
        error: 'Quota Exceeded',
        message:
          errorMessage ||
          `Daily limit reached for ${featureKey} (${limit}/day). Resets at midnight UTC.`,
        upgrade_required: true,
        feature: String(featureKey),
        quota: {
          limit,
          used: limit,
          resetsAt: this.resetsAtIso(),
        },
      });
    }

    return {
      key: String(featureKey),
      used: newCount,
      limit,
      remaining: Math.max(0, limit - newCount),
      resetsAt: this.resetsAtIso(),
      unlimited: false,
    };
  }

  /**
   * Decrement — rarely needed, but useful if the consumer's downstream action fails
   * AFTER the quota was consumed and you want to refund.
   */
  async refund(userId: number, featureKey: FeatureKey | string): Promise<void> {
    try {
      await this.redis.execute((client) =>
        client.decr(this.buildKey(userId, featureKey)),
      );
    } catch (err) {
      this.logger.warn(`Quota refund failed: ${err.message}`);
    }
  }

  /**
   * Internal: INCR with TTL. Sets TTL only on the first increment of the day.
   */
  private async incrementCounter(
    userId: number,
    featureKey: string,
  ): Promise<number> {
    const key = this.buildKey(userId, featureKey);
    const result = await this.redis.execute(async (client) => {
      const count = await client.incr(key);
      if (count === 1) {
        // First increment — set TTL to midnight UTC
        await client.expire(key, this.secondsUntilMidnightUtc());
      }
      return count;
    });
    return result ?? 0;
  }

  /**
   * Fetch multiple quota statuses in one call — handy for the entitlements endpoint.
   */
  async getMultipleStatuses(
    userId: number,
    featureKeys: (FeatureKey | string)[],
  ): Promise<Record<string, QuotaStatus>> {
    const results = await Promise.all(
      featureKeys.map(
        async (key) => [key, await this.status(userId, key)] as const,
      ),
    );
    return Object.fromEntries(results);
  }
}
