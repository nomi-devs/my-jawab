import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { Email, EmailStatus } from '../entities/email.entity';
import { EmailService } from '../email.service';
import { TemplatesService } from '../../templates/templates.service';

@Injectable()
export class EmailSenderService {
  private readonly logger = new Logger(EmailSenderService.name);
  private transporter: Transporter;
  private isTransporterVerified: boolean = false;
  private lastVerificationAttempt: Date | null = null;
  private readonly verificationCooldown = 60000; // 1 minute cooldown between verification attempts

  constructor(
    private configService: ConfigService,
    private emailService: EmailService,
    private templatesService: TemplatesService,
  ) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    // Check if email service is enabled
    const emailEnabled = this.configService.get<boolean>('email.enabled', true);
    if (!emailEnabled) {
      this.logger.warn('Email service is disabled. Emails will not be sent.');
      return;
    }

    const provider = this.configService.get<string>('email.provider', 'smtp');
    
    if (provider === 'smtp') {
      const smtpEnabled = this.configService.get<boolean>('email.smtp.enabled', true);
      if (!smtpEnabled) {
        this.logger.warn('SMTP is disabled. Emails will not be sent.');
        return;
      }

      const smtpUser = this.configService.get<string>('email.smtp.auth.user', '');
      const smtpPass = this.configService.get<string>('email.smtp.auth.pass', '');

      // Check if credentials are provided
      if (!smtpUser || !smtpPass) {
        this.logger.warn('SMTP credentials are not configured. Email sending will fail until credentials are set.');
        // Create transporter without auth for now (will fail on send, but won't crash on init)
        this.transporter = nodemailer.createTransport({
          host: this.configService.get<string>('email.smtp.host', 'smtp.gmail.com'),
          port: this.configService.get<number>('email.smtp.port', 587),
          secure: this.configService.get<boolean>('email.smtp.secure', false),
        });
        return;
      }

      const smtpConfig = {
        host: this.configService.get<string>('email.smtp.host', 'smtp.gmail.com'),
        port: this.configService.get<number>('email.smtp.port', 587),
        secure: this.configService.get<boolean>('email.smtp.secure', false),
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        pool: this.configService.get<boolean>('email.smtp.pool', false),
        maxConnections: this.configService.get<number>('email.smtp.maxConnections', 5),
        maxMessages: this.configService.get<number>('email.smtp.maxMessages', 100),
        connectionTimeout: this.configService.get<number>('email.smtp.connectionTimeout', 10000),
        socketTimeout: this.configService.get<number>('email.smtp.socketTimeout', 30000),
        greetingTimeout: this.configService.get<number>('email.smtp.greetingTimeout', 5000),
        tls: {
          rejectUnauthorized: this.configService.get<boolean>('email.smtp.tls.rejectUnauthorized', true),
          ciphers: this.configService.get<string>('email.smtp.tls.ciphers', 'SSLv3'),
        },
      };

      this.transporter = nodemailer.createTransport(smtpConfig);
      
      // Verify connection asynchronously (don't block initialization)
      this.verifyTransporter().catch((error) => {
        this.logger.error('Initial SMTP verification failed:', error.message);
      });
    } else if (provider === 'sendgrid') {
      const sendgridEnabled = this.configService.get<boolean>('email.sendgrid.enabled', false);
      if (!sendgridEnabled) {
        this.logger.warn('SendGrid is disabled. Emails will not be sent.');
        return;
      }
      this.logger.warn('SendGrid provider is not yet fully implemented. Using SMTP fallback.');
      // TODO: Implement SendGrid
    } else if (provider === 'ses') {
      const sesEnabled = this.configService.get<boolean>('email.awsSes.enabled', false);
      if (!sesEnabled) {
        this.logger.warn('AWS SES is disabled. Emails will not be sent.');
        return;
      }
      this.logger.warn('AWS SES provider is not yet fully implemented. Using SMTP fallback.');
      // TODO: Implement AWS SES
    } else {
      this.logger.warn(`Email provider "${provider}" is not yet implemented. Using SMTP fallback.`);
    }
  }

  /**
   * Verify transporter connection
   * @private
   */
  private async verifyTransporter(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    // Avoid too frequent verification attempts
    const now = new Date();
    if (
      this.lastVerificationAttempt &&
      now.getTime() - this.lastVerificationAttempt.getTime() < this.verificationCooldown
    ) {
      return this.isTransporterVerified;
    }

    this.lastVerificationAttempt = now;

    try {
      await this.transporter.verify();
      this.isTransporterVerified = true;
      this.logger.log('SMTP server is ready to send emails');
      return true;
    } catch (error) {
      this.isTransporterVerified = false;
      this.logger.error('SMTP connection verification failed:', error.message || error);
      return false;
    }
  }

  /**
   * Ensure transporter is ready, recreate if needed
   * @private
   */
  private async ensureTransporterReady(): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn('Transporter not initialized, attempting to reinitialize...');
      this.initializeTransporter();
      if (!this.transporter) {
        return false;
      }
    }

    // Verify connection if not recently verified
    if (!this.isTransporterVerified) {
      const verified = await this.verifyTransporter();
      if (!verified) {
        this.logger.warn('Transporter verification failed, but will attempt to send anyway');
      }
    }

    return true;
  }

  /**
   * Send email with retry logic
   * @private
   */
  private async sendEmailWithRetry(
    mailOptions: any,
    emailId: number,
    retryCount: number = 0,
  ): Promise<any> {
    const maxRetries = this.configService.get<number>('email.retry.maxRetries', 3);
    const retryDelay = this.configService.get<number>('email.retry.retryDelay', 5000);
    const useExponentialBackoff = this.configService.get<boolean>(
      'email.retry.exponentialBackoff',
      false,
    );
    const timeout = this.configService.get<number>('email.smtp.socketTimeout', 30000); // 30 seconds default

    try {
      // Create a promise with timeout
      const sendPromise = this.transporter.sendMail(mailOptions);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Email send timeout')), timeout);
      });

      const info = await Promise.race([sendPromise, timeoutPromise]);
      return info;
    } catch (error) {
      const shouldRetry = retryCount < maxRetries;
      const isRetryableError =
        error.code === 'ECONNREFUSED' ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ESOCKET' ||
        error.message?.includes('timeout') ||
        error.message?.includes('connection') ||
        error.responseCode === 421 || // Service not available
        error.responseCode === 450 || // Mailbox unavailable
        error.responseCode === 451 || // Local error
        error.responseCode === 452 || // Insufficient storage
        error.responseCode === 552 || // Exceeded storage allocation
        error.responseCode === 553 || // Mailbox name not allowed
        error.responseCode === 554; // Transaction failed

      if (shouldRetry && isRetryableError) {
        const delay = useExponentialBackoff
          ? retryDelay * Math.pow(2, retryCount)
          : retryDelay;

        this.logger.warn(
          `Email ${emailId} send failed (attempt ${retryCount + 1}/${maxRetries + 1}), retrying in ${delay}ms:`,
          error.message,
        );

        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, delay));

        // Re-verify connection before retry
        await this.ensureTransporterReady();

        return this.sendEmailWithRetry(mailOptions, emailId, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * Send email - if template_name is provided, render template first
   */
  async sendEmail(email: Email): Promise<boolean> {
    // Check if email service is enabled
    const emailEnabled = this.configService.get<boolean>('email.enabled', true);
    if (!emailEnabled) {
      this.logger.warn(`Email service is disabled. Email ${email.id} will not be sent.`);
      await this.emailService.updateStatus(email.id, EmailStatus.FAILED, {
        error_message: 'Email service is disabled',
      });
      return false;
    }

    // Ensure transporter is ready
    const isReady = await this.ensureTransporterReady();
    if (!isReady || !this.transporter) {
      this.logger.error(`SMTP transporter is not ready. Email ${email.id} will not be sent.`);
      await this.emailService.updateStatus(email.id, EmailStatus.FAILED, {
        error_message: 'SMTP transporter is not ready. Please check SMTP configuration.',
      });
      return false;
    }

    // Check if SMTP credentials are configured
    const smtpUser = this.configService.get<string>('email.smtp.auth.user', '');
    const smtpPass = this.configService.get<string>('email.smtp.auth.pass', '');
    if (!smtpUser || !smtpPass) {
      this.logger.error(`SMTP credentials are not configured. Email ${email.id} will not be sent.`);
      await this.emailService.updateStatus(email.id, EmailStatus.FAILED, {
        error_message: 'SMTP credentials are not configured. Please set SMTP_USER and SMTP_PASSWORD in .env file.',
      });
      return false;
    }

    // Check if templates are enabled
    const templatesEnabled = this.configService.get<boolean>('email.templates.enabled', true);
    if (email.template_name && !templatesEnabled) {
      this.logger.warn(`Email templates are disabled. Email ${email.id} will not use template.`);
    }

    try {
      const defaultFrom = {
        email: this.configService.get<string>('email.from', 'noreply@jawab.com'),
        name: this.configService.get<string>('email.fromName', 'Jawab'),
      };

      // If template_name is provided, render the template
      let htmlContent = email.body_html;
      let textContent = email.body_text;

      if (email.template_name && templatesEnabled) {
        try {
          const templateData = {
            ...email.template_data,
            name: email.recipient_name,
            email: email.recipient_email,
            appName: this.configService.get<string>('app.name', 'Jawab'),
            appUrl: this.configService.get<string>('app.url', 'https://demo.jantrah.com/jawaab'),
            year: new Date().getFullYear(),
          };
          
          htmlContent = await this.templatesService.renderEmail(
            email.template_name,
            templateData,
          );
          
          // Generate text version from HTML if not provided
          if (!textContent) {
            textContent = this.stripHtml(htmlContent);
          }
        } catch (error) {
          this.logger.warn(`Failed to render template ${email.template_name}, using provided body:`, error);
          // Fall back to provided body_html/body_text
        }
      }

      const mailOptions: any = {
        from: email.from_name
          ? `${email.from_name} <${email.from_email}>`
          : `${defaultFrom.name} <${email.from_email || defaultFrom.email}>`,
        to: email.recipient_name
          ? `${email.recipient_name} <${email.recipient_email}>`
          : email.recipient_email,
        subject: email.subject,
        html: htmlContent || textContent || undefined,
        text: textContent || this.stripHtml(htmlContent || ''),
        replyTo: email.reply_to || this.configService.get<string>('email.replyTo'),
        cc: email.cc_emails?.length ? email.cc_emails.join(', ') : undefined,
        bcc: email.bcc_emails?.length ? email.bcc_emails.join(', ') : undefined,
        // attachments: email.attachments, // Handle attachments if needed
      };

      // Send email with retry logic and timeout
      const info = await this.sendEmailWithRetry(mailOptions, email.id);

      // Update email status
      await this.emailService.updateStatus(email.id, EmailStatus.SENT, {
        provider: 'smtp',
        provider_message_id: info?.messageId || undefined,
        sent_at: new Date(),
      });

      this.logger.log(`Email sent successfully: ${email.id} to ${email.recipient_email}`);
      return true;
    } catch (error) {
      const errorMessage = error.message || error.toString() || 'Unknown error';
      this.logger.error(`Failed to send email ${email.id} after all retries:`, errorMessage);
      
      // Log full error details for debugging
      if (error.stack) {
        this.logger.debug(`Error stack for email ${email.id}:`, error.stack);
      }
      if (error.response) {
        this.logger.debug(`SMTP response for email ${email.id}:`, error.response);
      }
      
      // Update email status with error
      await this.emailService.updateStatus(email.id, EmailStatus.FAILED, {
        error_message: errorMessage,
      });

      // Mark transporter as unverified if it's a connection error
      if (
        error.code === 'ECONNREFUSED' ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ESOCKET' ||
        error.message?.includes('timeout')
      ) {
        this.isTransporterVerified = false;
        this.logger.warn('Transporter marked as unverified due to connection error');
      }

      return false;
    }
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  }

  async sendPendingEmails(limit: number = 10): Promise<void> {
    // This method can be called by a scheduled job to process pending emails
    // Implementation would fetch pending emails and send them
    this.logger.log(`Processing pending emails (limit: ${limit})`);
    // TODO: Implement batch email sending
  }
}
