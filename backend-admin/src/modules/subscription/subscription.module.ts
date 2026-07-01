import { Module } from '@nestjs/common';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { SubscriptionReminderService } from './services/subscription-reminder.service';
import { EmailModule } from '../email/email.module';
import { EntitlementsModule } from '../entitlements/entitlements.module';

@Module({
  imports: [EmailModule, EntitlementsModule],
  controllers: [SubscriptionController],
  providers: [SubscriptionService, SubscriptionReminderService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
