import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, IsNull } from 'typeorm';
import { UserSubscription, SubscriptionStatus } from '../subscription/entities/user-subscription.entity';
import { Subscription } from '../subscription/entities/subscription.entity';
import { RedisService } from '../shared/services/redis.service';
import {
    DEFAULT_FREE_FEATURES,
    ENTITLEMENTS_CACHE_TTL,
    ENTITLEMENTS_CACHE_PREFIX,
    FeatureKey,
} from './entitlements.constants';

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
        @InjectRepository(UserSubscription)
        private readonly userSubscriptionRepository: Repository<UserSubscription>,
        @InjectRepository(Subscription)
        private readonly subscriptionRepository: Repository<Subscription>,
        private readonly redisService: RedisService,
    ) { }

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
            try { return JSON.parse(cached); } catch { /* fall through */ }
        }

        // 2. Look up the user's CURRENT active subscription
        const now = new Date();
        const userSub = await this.userSubscriptionRepository
            .createQueryBuilder('us')
            .leftJoinAndSelect('us.subscription', 'sub')
            .where('us.user_id = :userId', { userId })
            .andWhere('us.is_active = :active', { active: true })
            .andWhere('us.subscription_status = :status', { status: SubscriptionStatus.ACTIVE })
            .andWhere('(us.subscription_end_date IS NULL OR us.subscription_end_date > :now)', { now })
            .orderBy('us.created_at', 'DESC')
            .getOne();

        let entitlements: UserEntitlements;

        if (userSub?.subscription) {
            const plan = userSub.subscription;
            // Merge plan features OVER defaults — plan wins for any defined keys
            const mergedFeatures = { ...DEFAULT_FREE_FEATURES, ...(plan.features || {}) };
            entitlements = {
                plan: {
                    id: plan.id,
                    name: plan.subscription_name,
                    type: plan.subscription_type,
                },
                features: mergedFeatures,
            };
        } else {
            entitlements = { plan: null, features: { ...DEFAULT_FREE_FEATURES } };
        }

        // 3. Cache in Redis (best-effort)
        await this.redisService.execute(async (client) => {
            return client.set(cacheKey, JSON.stringify(entitlements), 'EX', ENTITLEMENTS_CACHE_TTL);
        });

        return entitlements;
    }

    /**
     * Shortcut: return just a feature value (or default) for a user.
     */
    async getFeature(userId: number | null, key: FeatureKey | string): Promise<any> {
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
    async getLimit(userId: number | null, key: FeatureKey | string): Promise<number> {
        const value = await this.getFeature(userId, key);
        if (typeof value === 'number') return value;
        if (typeof value === 'string' && !isNaN(Number(value))) return Number(value);
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
        const activeSubs = await this.userSubscriptionRepository.find({
            where: { subscription_id: subscriptionId, is_active: true },
            select: ['user_id'],
        });
        await Promise.all(activeSubs.map((s) => this.invalidate(s.user_id)));
        this.logger.debug(`Invalidated cache for ${activeSubs.length} users on plan ${subscriptionId}`);
    }
}
