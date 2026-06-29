import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntitlementsService } from './entitlements.service';
import { EntitlementsController } from './entitlements.controller';
import { FeatureGuard } from './guards/feature.guard';
import { QuotaService } from './quota.service';
import { UserSubscription } from '../subscription/entities/user-subscription.entity';
import { Subscription } from '../subscription/entities/subscription.entity';

@Module({
    imports: [TypeOrmModule.forFeature([UserSubscription, Subscription])],
    controllers: [EntitlementsController],
    providers: [EntitlementsService, FeatureGuard, QuotaService],
    exports: [EntitlementsService, FeatureGuard, QuotaService],
})
export class EntitlementsModule { }
