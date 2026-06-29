import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { SubscriptionReminderService } from './services/subscription-reminder.service';
import { Subscription, UserSubscription, Payment } from './entities';
import { User } from '../auth/entities/user.entity';
import { Currency } from '../currency/entities/currency.entity';
import { EmailModule } from '../email/email.module';
import { EntitlementsModule } from '../entitlements/entitlements.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription, UserSubscription, Payment, User, Currency]),
    EmailModule, // Import EmailModule to use EmailTemplatesService
    EntitlementsModule,
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService, SubscriptionReminderService],
  exports: [SubscriptionService],
})
export class SubscriptionModule { }

