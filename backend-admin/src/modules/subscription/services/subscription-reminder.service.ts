import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../prisma/prisma.service';
import { EmailTemplatesService } from '../../email/services/email-templates.service';

@Injectable()
export class SubscriptionReminderService {
  private readonly logger = new Logger(SubscriptionReminderService.name);

  constructor(
    private prisma: PrismaService,
    private emailTemplatesService: EmailTemplatesService,
    private configService: ConfigService,
  ) {}

  /**
   * Check and send reminders for pending subscriptions
   * Runs every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async checkPendingSubscriptions() {
    this.logger.log(
      'Checking for pending subscriptions that need reminders...',
    );

    try {
      const reminderHours = this.configService.get<number>(
        'app.subscription.pendingReminderHours',
        24,
      );

      // Find pending subscriptions that need reminders
      const pendingSubscriptions = await this.prisma.userSubscription.findMany({
        where: {
          subscription_status: 'pending',
          is_active: true,
        },
        include: { subscription: true },
      });

      for (const userSubscription of pendingSubscriptions) {
        const createdHoursAgo =
          (Date.now() - userSubscription.created_at.getTime()) /
          (1000 * 60 * 60);

        // Send reminder if subscription is pending for more than reminderHours
        if (createdHoursAgo >= reminderHours) {
          try {
            const user = await this.prisma.user.findUnique({
              where: { id: userSubscription.user_id },
              select: { id: true, email: true, username: true },
            });

            if (user && user.email) {
              await this.emailTemplatesService.sendSubscriptionReminderEmail({
                recipientEmail: user.email,
                recipientName: user.username,
                subscriptionName:
                  userSubscription.subscription?.subscription_name ||
                  'Subscription',
                amount:
                  (userSubscription.subscription_renewal_amount?.toNumber() ??
                    0) ||
                  (userSubscription.subscription?.subscription_price?.toNumber() ??
                    0),
                currency:
                  userSubscription.subscription_renewal_currency || 'USD',
                hoursRemaining: Math.max(0, reminderHours - createdHoursAgo),
              });

              this.logger.log(
                `Sent reminder email for pending subscription ${userSubscription.id}`,
              );
            }
          } catch (error) {
            this.logger.error(
              `Failed to send reminder for subscription ${userSubscription.id}:`,
              error,
            );
          }
        }
      }
    } catch (error) {
      this.logger.error('Error checking pending subscriptions:', error);
    }
  }

  /**
   * Check and mark expired subscriptions
   * Runs daily at midnight
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkExpiredSubscriptions() {
    this.logger.log('Checking for expired subscriptions...');

    try {
      const now = new Date();

      // Find active subscriptions that have expired
      const expiredSubscriptions = await this.prisma.userSubscription.findMany({
        where: {
          subscription_status: 'active',
          is_active: true,
          subscription_end_date: { lt: now },
        },
        include: { subscription: true },
      });

      for (const userSubscription of expiredSubscriptions) {
        // Mark as expired
        await this.prisma.userSubscription.update({
          where: { id: userSubscription.id },
          data: { subscription_status: 'expired', is_active: false },
        });

        // Send expiration email
        try {
          const user = await this.prisma.user.findUnique({
            where: { id: userSubscription.user_id },
            select: { id: true, email: true, username: true },
          });

          if (user && user.email && userSubscription.subscription_end_date) {
            await this.emailTemplatesService.sendSubscriptionExpiredEmail({
              recipientEmail: user.email,
              recipientName: user.username,
              subscriptionName:
                userSubscription.subscription?.subscription_name ||
                'Subscription',
              expiredDate: userSubscription.subscription_end_date,
            });

            this.logger.log(
              `Sent expiration email for subscription ${userSubscription.id}`,
            );
          }
        } catch (error) {
          this.logger.error(
            `Failed to send expiration email for subscription ${userSubscription.id}:`,
            error,
          );
        }
      }

      this.logger.log(
        `Processed ${expiredSubscriptions.length} expired subscriptions`,
      );
    } catch (error) {
      this.logger.error('Error checking expired subscriptions:', error);
    }
  }

  /**
   * Send reminder emails for subscriptions expiring soon
   * Runs daily at 9 AM
   */
  @Cron('0 9 * * *') // Daily at 9 AM
  async checkExpiringSoonSubscriptions() {
    this.logger.log('Checking for subscriptions expiring soon...');

    try {
      const reminderDays = this.configService.get<number>(
        'app.subscription.reminderDaysBeforeExpiry',
        3,
      );
      const now = new Date();

      // Find active subscriptions expiring within reminderDays
      const expiringSubscriptions = await this.prisma.userSubscription.findMany(
        {
          where: {
            subscription_status: 'active',
            is_active: true,
            subscription_end_date: { gt: now },
          },
          include: { subscription: true },
        },
      );

      for (const userSubscription of expiringSubscriptions) {
        if (!userSubscription.subscription_end_date) continue;

        const daysUntilExpiry = Math.ceil(
          (userSubscription.subscription_end_date.getTime() - Date.now()) /
            (1000 * 60 * 60 * 24),
        );

        // Send reminder if expiring within reminderDays
        if (daysUntilExpiry <= reminderDays && daysUntilExpiry > 0) {
          try {
            const user = await this.prisma.user.findUnique({
              where: { id: userSubscription.user_id },
              select: { id: true, email: true, username: true },
            });

            if (user && user.email) {
              await this.emailTemplatesService.sendNotificationEmail({
                recipientEmail: user.email,
                recipientName: user.username,
                title: `Your ${userSubscription.subscription?.subscription_name || 'Subscription'} expires in ${daysUntilExpiry} day(s)`,
                body: `Your subscription will expire on ${userSubscription.subscription_end_date.toLocaleDateString()}. Renew now to continue enjoying premium features.`,
                actionUrl: `${this.configService.get<string>('app.url', 'https://demo.jantrah.com/jawaab')}/subscriptions`,
                actionText: 'Renew Subscription',
              });

              this.logger.log(
                `Sent expiry reminder for subscription ${userSubscription.id}`,
              );
            }
          } catch (error) {
            this.logger.error(
              `Failed to send expiry reminder for subscription ${userSubscription.id}:`,
              error,
            );
          }
        }
      }
    } catch (error) {
      this.logger.error('Error checking expiring subscriptions:', error);
    }
  }
}
