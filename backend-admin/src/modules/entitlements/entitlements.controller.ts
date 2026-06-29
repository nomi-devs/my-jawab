import { Controller, Get, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { EntitlementsService, UserEntitlements } from './entitlements.service';
import { QuotaService, QuotaStatus } from './quota.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('auth/me/entitlements')
@UseGuards(JwtAuthGuard)
export class EntitlementsController {
    constructor(
        private readonly entitlementsService: EntitlementsService,
        private readonly quotaService: QuotaService,
    ) { }

    /**
     * Returns the full entitlement snapshot for the current user.
     * Mobile app should call this on login/app-foreground to decide which UI to show.
     *
     * Response shape:
     *   {
     *     plan: { id, name, type } | null,
     *     features: { can_create_polls: true, daily_post_limit: 20, ... },
     *     usage: {
     *       daily_post_limit:    { used, limit, remaining, resetsAt, unlimited },
     *       daily_comment_limit: { used, limit, remaining, resetsAt, unlimited }
     *     }
     *   }
     *
     * When user has no active subscription, `plan` is null and `features` are the
     * default "free" values.
     */
    @Get()
    @HttpCode(HttpStatus.OK)
    async getMyEntitlements(
        @GetUser() user: any,
    ): Promise<UserEntitlements & { usage: Record<string, QuotaStatus> }> {
        const entitlements = await this.entitlementsService.getUserEntitlements(user.userId);

        // Return live usage counters for quota-based features
        const usage = await this.quotaService.getMultipleStatuses(user.userId, [
            'daily_post_limit',
            'daily_comment_limit',
        ]);

        return { ...entitlements, usage };
    }
}
