import { SetMetadata } from '@nestjs/common';
import { FeatureKey } from '../entitlements.constants';

export const REQUIRES_FEATURE_KEY = 'requires_feature';

/**
 * Mark a route/handler as requiring a specific feature entitlement.
 *
 * Usage:
 *   @RequiresFeature('can_create_polls')
 *   @Post('/polls')
 *   createPoll() { ... }
 *
 * When `FeatureGuard` is applied (either globally or via @UseGuards),
 * it checks the user's merged features and throws 403 if the flag is false.
 */
export const RequiresFeature = (feature: FeatureKey | string) =>
    SetMetadata(REQUIRES_FEATURE_KEY, feature);
