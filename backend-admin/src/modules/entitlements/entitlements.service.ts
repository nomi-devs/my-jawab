import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { RedisService } from '../shared/services/redis.service';
import {
  DEFAULT_FREE_FEATURES,
  ENTITLEMENTS_CACHE_TTL,
  ENTITLEMENTS_CACHE_PREFIX,
  FeatureKey,
} from './entitlements.constants';
import { PrismaService } from '../../prisma/prisma.service';

export interface UserEntitlements {
  plan: {
    id: number | null;
    name: string;
    type: string;
  } | null;
  features: Record<string, any>;
}

@Injectable()
export class EntitlementsService {
  private readonly logger = new Logger(EntitlementsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Get the full entitlement snapshot for a user.
   * Uses Redis cache (5 min TTL) when available.
   * Falls back to DEFAULT_FREE_FEATURES when user has no active subscription.
   */
  async getUserEntitlements(userId: number | null): Promise<UserEntitlements> {
    if (!userId) {
      return { plan: null, features: { ...DEFAULT_FREE_FEATURES } };
    }

    // 1. Try Redis cache first
    const cacheKey = `${ENTITLEMENTS_CACHE_PREFIX}:${userId}`;
    const cached = await this.redisService.execute(async (client) => {
      return client.get(cacheKey);
    });
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        /* fall through */
      }
    }

    // 2. Look up the user's CURRENT active subscription
    const now = new Date();
    const userSub = await this.prisma.userSubscription.findFirst({
      where: {
        user_id: userId,
        is_active: true,
        subscription_status: 'active',
        OR: [
          { subscription_end_date: null },
          { subscription_end_date: { gt: now } },
        ],
      },
      include: { subscription: true },
      orderBy: { created_at: 'desc' },
    });

    let entitlements: UserEntitlements;

    if (userSub?.subscription) {
      const plan = userSub.subscription;
      // Merge plan features OVER defaults plan wins for any defined keys
      const mergedFeatures = {
        ...DEFAULT_FREE_FEATURES,
        ...((plan as any).features || {}),
      };
      entitlements = {
        plan: {
          id: plan.id,
          name: (plan as any).subscription_name,
          type: (plan as any).subscription_type,
        },
        features: mergedFeatures,
      };
    } else {
      entitlements = { plan: null, features: { ...DEFAULT_FREE_FEATURES } };
    }

    // 3. Cache in Redis (best-effort)
    await this.redisService.execute(async (client) => {
      return client.set(
        cacheKey,
        JSON.stringify(entitlements),
        'EX',
        ENTITLEMENTS_CACHE_TTL,
      );
    });

    return entitlements;
  }

  /**
   * Shortcut: return just a feature value (or default) for a user.
   */
  async getFeature(
    userId: number | null,
    key: FeatureKey | string,
  ): Promise<any> {
    const { features } = await this.getUserEntitlements(userId);
    return features[key] ?? DEFAULT_FREE_FEATURES[key];
  }

  /**
   * Boolean check for an entitlement. Throws if false.
   * Use from services when you need an imperative check.
   */
  async requireFeature(
    userId: number,
    key: FeatureKey | string,
    errorMessage?: string,
  ): Promise<void> {
    const value = await this.getFeature(userId, key);
    if (!value) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Feature Gated',
        message: errorMessage || `Your current plan doesn't include: ${key}`,
        upgrade_required: true,
        feature: key,
      });
    }
  }

  /**
   * Numeric limit check. Returns the limit (or -1 for unlimited).
   * Callers then compare to current usage to decide whether to allow.
   */
  async getLimit(
    userId: number | null,
    key: FeatureKey | string,
  ): Promise<number> {
    const value = await this.getFeature(userId, key);
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && !isNaN(Number(value)))
      return Number(value);
    return 0;
  }

  /**
   * Invalidate a user's cache. Call whenever:
   *  - A subscription is created, cancelled, or expires
   *  - A plan's features JSON is updated
   */
  async invalidate(userId: number): Promise<void> {
    await this.redisService.execute(async (client) => {
      return client.del(`${ENTITLEMENTS_CACHE_PREFIX}:${userId}`);
    });
    this.logger.debug(`Invalidated entitlements cache for user ${userId}`);
  }

  /**
   * Invalidate ALL users on a plan (call when plan features change).
   */
  async invalidatePlan(subscriptionId: number): Promise<void> {
    const activeSubs = await this.prisma.userSubscription.findMany({
      where: { subscription_id: subscriptionId, is_active: true },
      select: { user_id: true },
    });
    await Promise.all(activeSubs.map((s) => this.invalidate(s.user_id)));
    this.logger.debug(
      `Invalidated cache for ${activeSubs.length} users on plan ${subscriptionId}`,
    );
  }
}
