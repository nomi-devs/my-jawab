import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email.service';
import { EmailSenderService } from './email-sender.service';
import { EmailQueueService } from './email-queue.service';
import { TemplatesService } from '../../templates/templates.service';
import { EmailType, EmailStatus } from '../entities/email.entity';

@Injectable()
export class EmailTemplatesService {
  private readonly logger = new Logger(EmailTemplatesService.name);

  constructor(
    private emailService: EmailService,
    private emailSenderService: EmailSenderService,
    private emailQueueService: EmailQueueService,
    private templatesService: TemplatesService,
    private configService: ConfigService,
  ) { }

  /**
   * Send account creation email
   */
  async sendAccountCreationEmail(data: {
    recipientEmail: string;
    recipientName?: string;
    username: string;
    verificationCode?: string;
    verificationUrl?: string;
  }): Promise<boolean> {
    // Check if email service and feature are enabled
    const emailEnabled = this.configService.get<boolean>('email.enabled', true);
    const featureEnabled = this.configService.get<boolean>('email.features.accountCreation', true);

    if (!emailEnabled || !featureEnabled) {
      this.logger.warn('Account creation email is disabled');
      return false;
    }

    try {
      const appName = this.configService.get<string>('app.name', 'Jawab');
      const appUrl = this.configService.get<string>('app.url', 'https://demo.jantrah.com/jawaab');

      const email = await this.emailService.create({
        email_type: EmailType.WELCOME,
        recipient_email: data.recipientEmail,
        recipient_name: data.recipientName,
        subject: `Welcome to ${appName}!`,
        template_name: 'welcome',
        template_data: {
          name: data.recipientName || data.username,
          username: data.username,
          appName,
          appUrl,
          features: [
            'Create and share posts',
            'Join communities',
            'Participate in polls',
            'Connect with others',
          ],
        },
        from_email: this.configService.get<string>('email.from', 'noreply@jawab.com'),
        from_name: this.configService.get<string>('email.fromName', appName),
        reply_to: this.configService.get<string>('email.replyTo'),
      });

      return await this.sendEmail(email);
    } catch (error) {
      this.logger.error('Error sending account creation email:', error);
      return false;
    }
  }

  /**
   * Send email verification code
   */
  async sendVerificationEmail(data: {
    recipientEmail: string;
    recipientName?: string;
    verificationCode: string;
    verificationUrl?: string;
  }): Promise<boolean> {
    // Check if email service and feature are enabled
    const emailEnabled = this.configService.get<boolean>('email.enabled', true);
    const featureEnabled = this.configService.get<boolean>('email.features.verification', true);

    if (!emailEnabled || !featureEnabled) {
      this.logger.warn('Verification email is disabled');
      return false;
    }

    try {
      const appName = this.configService.get<string>('app.name', 'Jawab');
      const appUrl = this.configService.get<string>('app.url', 'https://demo.jantrah.com/jawaab');
      const verificationUrl = data.verificationUrl || `${appUrl}/verify?code=${data.verificationCode}&email=${encodeURIComponent(data.recipientEmail)}`;

      const email = await this.emailService.create({
        email_type: EmailType.VERIFICATION,
        recipient_email: data.recipientEmail,
        recipient_name: data.recipientName,
        subject: `Verify your email address - ${appName}`,
        template_name: 'email-verification',
        template_data: {
          name: data.recipientName || data.recipientEmail,
          verificationCode: data.verificationCode,
          verificationUrl,
          appName,
          appUrl,
        },
        from_email: this.configService.get<string>('email.from', 'noreply@jawab.com'),
        from_name: this.configService.get<string>('email.fromName', appName),
        reply_to: this.configService.get<string>('email.replyTo'),
      });

      return await this.sendEmail(email);
    } catch (error) {
      this.logger.error('Error sending verification email:', {
        error: error.message,
        stack: error.stack,
        recipientEmail: data.recipientEmail,
        templateName: 'email-verification',
      });
      return false;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(data: {
    recipientEmail: string;
    recipientName?: string;
    resetCode: string;
    resetUrl?: string;
  }): Promise<boolean> {
    // Check if email service and feature are enabled
    const emailEnabled = this.configService.get<boolean>('email.enabled', true);
    const featureEnabled = this.configService.get<boolean>('email.features.passwordReset', true);

    if (!emailEnabled || !featureEnabled) {
      this.logger.warn('Password reset email is disabled');
      return false;
    }

    try {
      const appName = this.configService.get<string>('app.name', 'Jawab');
      const appUrl = this.configService.get<string>('app.url', 'https://demo.jantrah.com/jawaab');
      const resetUrl = data.resetUrl || `${appUrl}/reset-password?code=${data.resetCode}&email=${encodeURIComponent(data.recipientEmail)}`;

      const email = await this.emailService.create({
        email_type: EmailType.PASSWORD_RESET,
        recipient_email: data.recipientEmail,
        recipient_name: data.recipientName,
        subject: `Reset your password - ${appName}`,
        template_name: 'password-reset',
        template_data: {
          name: data.recipientName || data.recipientEmail,
          resetCode: data.resetCode,
          resetUrl,
          appName,
          appUrl,
        },
        from_email: this.configService.get<string>('email.from', 'noreply@jawab.com'),
        from_name: this.configService.get<string>('email.fromName', appName),
        reply_to: this.configService.get<string>('email.replyTo'),
      });

      return await this.sendEmail(email);
    } catch (error) {
      this.logger.error('Error sending password reset email:', error);
      return false;
    }
  }

  /**
   * Send subscription confirmation email
   */
  async sendSubscriptionConfirmationEmail(data: {
    recipientEmail: string;
    recipientName?: string;
    subscriptionName: string;
    amount: number;
    currency: string;
    startDate: Date | string;
    endDate: Date | string;
    renewalDate?: Date | string;
    subscriptionType?: string;
  }): Promise<boolean> {
    // Check if email service and feature are enabled
    const emailEnabled = this.configService.get<boolean>('email.enabled', true);
    const featureEnabled = this.configService.get<boolean>('email.features.subscriptionConfirmation', true);

    if (!emailEnabled || !featureEnabled) {
      this.logger.warn('Subscription confirmation email is disabled');
      return false;
    }

    try {
      const appName = this.configService.get<string>('app.name', 'Jawab');
      const appUrl = this.configService.get<string>('app.url', 'https://demo.jantrah.com/jawaab');

      const email = await this.emailService.create({
        email_type: EmailType.ADMIN,
        recipient_email: data.recipientEmail,
        recipient_name: data.recipientName,
        subject: `Subscription Confirmed - ${data.subscriptionName}`,
        template_name: 'subscription-confirmation',
        template_data: {
          name: data.recipientName || data.recipientEmail,
          subscriptionName: data.subscriptionName,
          subscriptionType: data.subscriptionType || data.subscriptionName,
          amount: data.amount,
          currency: data.currency,
          startDate: typeof data.startDate === 'string' ? data.startDate : data.startDate.toISOString().split('T')[0],
          endDate: typeof data.endDate === 'string' ? data.endDate : data.endDate.toISOString().split('T')[0],
          renewalDate: data.renewalDate
            ? (typeof data.renewalDate === 'string' ? data.renewalDate : data.renewalDate.toISOString().split('T')[0])
            : null,
          appName,
          appUrl,
        },
        from_email: this.configService.get<string>('email.from', 'noreply@jawab.com'),
        from_name: this.configService.get<string>('email.fromName', appName),
        reply_to: this.configService.get<string>('email.replyTo'),
      });

      return await this.sendEmail(email);
    } catch (error) {
      this.logger.error('Error sending subscription confirmation email:', error);
      return false;
    }
  }

  /**
   * Send subscription expired email
   */
  async sendSubscriptionExpiredEmail(data: {
    recipientEmail: string;
    recipientName?: string;
    subscriptionName: string;
    expiredDate: Date | string;
  }): Promise<boolean> {
    // Check if email service and feature are enabled
    const emailEnabled = this.configService.get<boolean>('email.enabled', true);
    const featureEnabled = this.configService.get<boolean>('email.features.subscriptionExpired', true);

    if (!emailEnabled || !featureEnabled) {
      this.logger.warn('Subscription expired email is disabled');
      return false;
    }

    try {
      const appName = this.configService.get<string>('app.name', 'Jawab');
      const appUrl = this.configService.get<string>('app.url', 'https://demo.jantrah.com/jawaab');

      const email = await this.emailService.create({
        email_type: EmailType.ADMIN,
        recipient_email: data.recipientEmail,
        recipient_name: data.recipientName,
        subject: `Your ${data.subscriptionName} subscription has expired`,
        template_name: 'subscription-expired',
        template_data: {
          name: data.recipientName || data.recipientEmail,
          subscriptionName: data.subscriptionName,
          expiredDate: typeof data.expiredDate === 'string'
            ? data.expiredDate
            : data.expiredDate.toISOString().split('T')[0],
          appName,
          appUrl,
        },
        from_email: this.configService.get<string>('email.from', 'noreply@jawab.com'),
        from_name: this.configService.get<string>('email.fromName', appName),
        reply_to: this.configService.get<string>('email.replyTo'),
      });

      return await this.sendEmail(email);
    } catch (error) {
      this.logger.error('Error sending subscription expired email:', error);
      return false;
    }
  }

  /**
   * Send subscription reminder email (pending payment)
   */
  async sendSubscriptionReminderEmail(data: {
    recipientEmail: string;
    recipientName?: string;
    subscriptionName: string;
    amount: number;
    currency: string;
    paymentUrl?: string;
    hoursRemaining?: number;
  }): Promise<boolean> {
    // Check if email service and feature are enabled
    const emailEnabled = this.configService.get<boolean>('email.enabled', true);
    const featureEnabled = this.configService.get<boolean>('email.features.subscriptionReminder', true);

    if (!emailEnabled || !featureEnabled) {
      this.logger.warn('Subscription reminder email is disabled');
      return false;
    }

    try {
      const appName = this.configService.get<string>('app.name', 'Jawab');
      const appUrl = this.configService.get<string>('app.url', 'https://demo.jantrah.com/jawaab');
      const paymentUrl = data.paymentUrl || `${appUrl}/subscriptions/payment`;

      const email = await this.emailService.create({
        email_type: EmailType.NOTIFICATION,
        recipient_email: data.recipientEmail,
        recipient_name: data.recipientName,
        subject: `Complete your ${data.subscriptionName} subscription payment`,
        template_name: 'notification',
        template_data: {
          name: data.recipientName || data.recipientEmail,
          title: `Complete Your Subscription Payment`,
          body: `Your ${data.subscriptionName} subscription is pending payment of ${data.currency} ${data.amount}.${data.hoursRemaining ? ` Please complete payment within ${data.hoursRemaining} hours.` : ' Please complete payment to activate your subscription.'}`,
          actionUrl: paymentUrl,
          actionText: 'Complete Payment',
          appName,
          appUrl,
        },
        from_email: this.configService.get<string>('email.from', 'noreply@jawab.com'),
        from_name: this.configService.get<string>('email.fromName', appName),
        reply_to: this.configService.get<string>('email.replyTo'),
      });

      return await this.sendEmail(email);
    } catch (error) {
      this.logger.error('Error sending subscription reminder email:', error);
      return false;
    }
  }

  /**
   * Send generic notification email
   */
  async sendNotificationEmail(data: {
    recipientEmail: string;
    recipientName?: string;
    title: string;
    body: string;
    actionUrl?: string;
    actionText?: string;
  }): Promise<boolean> {
    // Check if email service and feature are enabled
    const emailEnabled = this.configService.get<boolean>('email.enabled', true);
    const featureEnabled = this.configService.get<boolean>('email.features.notifications', true);

    if (!emailEnabled || !featureEnabled) {
      this.logger.warn('Notification email is disabled');
      return false;
    }

    try {
      const appName = this.configService.get<string>('app.name', 'Jawab');
      const appUrl = this.configService.get<string>('app.url', 'https://demo.jantrah.com/jawaab');

      const email = await this.emailService.create({
        email_type: EmailType.NOTIFICATION,
        recipient_email: data.recipientEmail,
        recipient_name: data.recipientName,
        subject: data.title,
        template_name: 'notification',
        template_data: {
          name: data.recipientName || data.recipientEmail,
          title: data.title,
          body: data.body,
          actionUrl: data.actionUrl,
          actionText: data.actionText,
          appName,
          appUrl,
        },
        from_email: this.configService.get<string>('email.from', 'noreply@jawab.com'),
        from_name: this.configService.get<string>('email.fromName', appName),
        reply_to: this.configService.get<string>('email.replyTo'),
      });

      return await this.sendEmail(email);
    } catch (error) {
      this.logger.error('Error sending notification email:', error);
      return false;
    }
  }

  /**
   * Send email - uses queue if enabled, otherwise sends immediately
   * @private
   */
  private async sendEmail(email: any): Promise<boolean> {
    // Check if queue is enabled
    if (this.emailQueueService.isEnabled()) {
      try {
        // Add to queue for background processing
        const jobId = await this.emailQueueService.addEmailToQueue(email);
        if (jobId) {
          this.logger.log(`Email ${email.id} added to queue with job ID: ${jobId}`);
          // Update status to queued
          await this.emailService.updateStatus(email.id, EmailStatus.QUEUED, {
            queued_at: new Date(),
            queue_job_id: jobId,
          });
          return true; // Return true immediately since it's queued
        }
      } catch (error) {
        this.logger.error(`Failed to queue email ${email.id}:`, error.message);
        // Fall back to immediate sending if queue fails
      }
    }

    // Queue is disabled or queueing failed - send immediately
    return await this.emailSenderService.sendEmail(email);
  }
}
