import { Module } from '@nestjs/common';
import { EntitlementsService } from './entitlements.service';
import { EntitlementsController } from './entitlements.controller';
import { FeatureGuard } from './guards/feature.guard';
import { QuotaService } from './quota.service';

@Module({
  imports: [],
  controllers: [EntitlementsController],
  providers: [EntitlementsService, FeatureGuard, QuotaService],
  exports: [EntitlementsService, FeatureGuard, QuotaService],
})
export class EntitlementsModule {}
