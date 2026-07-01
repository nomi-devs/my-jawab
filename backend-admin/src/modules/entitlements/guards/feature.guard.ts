import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRES_FEATURE_KEY } from '../decorators/requires-feature.decorator';
import { EntitlementsService } from '../entitlements.service';

/**
 * Guard that enforces @RequiresFeature('feature_key') on a handler.
 * Expects JwtAuthGuard to run first so req.user is populated.
 *
 * On failure throws a structured 403:
 *   {
 *     statusCode: 403,
 *     error: 'Feature Gated',
 *     message: 'Your current plan does not include this feature',
 *     upgrade_required: true,
 *     feature: 'can_create_polls'
 *   }
 *
 * The mobile app can detect `upgrade_required: true` and open the upgrade screen.
 */
@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly entitlementsService: EntitlementsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check both handler (method) and class-level metadata
    const required = this.reflector.getAllAndOverride<string>(
      REQUIRES_FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required) return true; // no gating on this route

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.userId) {
      throw new UnauthorizedException(
        'Authentication required for gated features',
      );
    }

    const value = await this.entitlementsService.getFeature(
      user.userId,
      required,
    );

    // Numeric fields: 0 and -1 are valid configs, treat only falsy booleans as blocking
    if (typeof value === 'number') {
      // For numeric features, 0 means "disabled" and blocks access.
      // Use -1 for "unlimited".
      if (value === 0) {
        throw new ForbiddenException({
          statusCode: 403,
          error: 'Feature Gated',
          message: `Your current plan does not include: ${required}`,
          upgrade_required: true,
          feature: required,
        });
      }
      return true;
    }

    if (!value) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Feature Gated',
        message: `Your current plan does not include: ${required}`,
        upgrade_required: true,
        feature: required,
      });
    }

    return true;
  }
}
