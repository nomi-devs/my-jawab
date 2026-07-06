/**
 * Default "free" feature set used as fallback when:
 *  - User has no active subscription
 *  - Plan's features JSON is NULL
 *  - Specific feature key isn't defined on the plan
 *
 * Convention: -1 = unlimited on numeric fields.
 * Keep all feature keys snake_case and strings for easy JSON lookup.
 */
export const DEFAULT_FREE_FEATURES: Record<string, any> = {
  // Entitlements (boolean)
  can_create_polls: false,
  can_create_communities: false,
  video_uploads: false,
  verified_badge: false,
  priority_support: false,
  early_access: false,
  ads_enabled: true,

  // Quotas (numeric; -1 = unlimited)
  daily_post_limit: 5,
  daily_comment_limit: 30,
  max_communities_joined: 10,
  max_topic_subscriptions: 10,
  max_video_size_mb: 0,
  max_bio_length: 200,
};

/**
 * All known feature keys reference list for typing / validation.
 * If you add a new feature, append it here.
 */
export type FeatureKey =
  | 'can_create_polls'
  | 'can_create_communities'
  | 'video_uploads'
  | 'verified_badge'
  | 'priority_support'
  | 'early_access'
  | 'ads_enabled'
  | 'daily_post_limit'
  | 'daily_comment_limit'
  | 'max_communities_joined'
  | 'max_topic_subscriptions'
  | 'max_video_size_mb'
  | 'max_bio_length';

/** Redis cache TTL (seconds) for user entitlements. */
export const ENTITLEMENTS_CACHE_TTL = 300; // 5 minutes

/** Redis key prefix. */
export const ENTITLEMENTS_CACHE_PREFIX = 'entitlements:user';
