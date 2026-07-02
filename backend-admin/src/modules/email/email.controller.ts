import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
  Post,
  Body,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { EmailService } from './email.service';
import { EmailTemplatesService } from './services/email-templates.service';
import { EmailSenderService } from './services/email-sender.service';
import { EmailQueueService } from './services/email-queue.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EmailType, EmailStatus } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@ApiTags('Email')
@ApiBearerAuth('JWT-auth')
@Controller('emails')
@UseGuards(JwtAuthGuard)
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @ApiOperation({ summary: 'Get user emails' })
  @ApiQuery({ name: 'status', required: false, enum: EmailStatus })
  @ApiQuery({ name: 'type', required: false, enum: EmailType })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @Get()
  async getEmails(
    @Request() req: any,
    @Query('status') status?: EmailStatus,
    @Query('type') type?: EmailType,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const user_id = req.user.userId;
    const emails = await this.emailService.findByUserId(user_id, {
      status,
      email_type: type,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });

    return {
      success: true,
      data: emails,
    };
  }

  @ApiOperation({ summary: 'Get email by ID' })
  @ApiParam({ name: 'id', type: String })
  @Get(':id')
  async getEmail(@Param('id') id: string, @Request() req: any) {
    const user_id = req.user.userId;
    const email = await this.emailService.findById(parseInt(id));

    if (!email || (email.user_id && email.user_id !== user_id)) {
      return {
        success: false,
        message: 'Email not found',
      };
    }

    return {
      success: true,
      data: email,
    };
  }
}

@ApiTags('Email')
@Controller('mail')
export class MailTestController {
  constructor(
    private readonly emailService: EmailService,
    private readonly emailTemplatesService: EmailTemplatesService,
    private readonly emailSenderService: EmailSenderService,
    private readonly emailQueueService: EmailQueueService,
    private readonly configService: ConfigService,
  ) {}

  @ApiOperation({ summary: 'Send a test email' })
  @ApiQuery({ name: 'test', required: false, type: String })
  @ApiQuery({ name: 'email', required: false, type: String })
  @Get('test')
  async testEmail(
    @Query('test') testParam?: string,
    @Query('email') email?: string,
  ) {
    try {
      // Check if email service is enabled
      const emailEnabled = this.configService.get<boolean>(
        'email.enabled',
        true,
      );
      if (!emailEnabled) {
        return {
          success: false,
          message: 'Email service is disabled',
          config: {
            emailEnabled: false,
          },
        };
      }

      // Get test email from query param or use default
      const testEmail =
        email ||
        this.configService.get<string>('email.from', 'contact@bablojs.com');

      // Get email configuration
      // Debug: Check raw environment variables
      const rawSmtpUser = process.env.SMTP_USER || 'NOT_SET';
      const rawSmtpPass = process.env.SMTP_PASSWORD ? 'SET' : 'NOT_SET';

      const emailConfig = {
        enabled: this.configService.get<boolean>('email.enabled', true),
        provider: this.configService.get<string>('email.provider', 'smtp'),
        smtp: {
          enabled: this.configService.get<boolean>('email.smtp.enabled', true),
          host: this.configService.get<string>(
            'email.smtp.host',
            'smtp.hostinger.com',
          ),
          port: this.configService.get<number>('email.smtp.port', 465),
          secure: this.configService.get<boolean>('email.smtp.secure', true),
          user: this.configService.get<string>('email.smtp.auth.user', ''),
        },
        from: this.configService.get<string>(
          'email.from',
          'contact@bablojs.com',
        ),
        fromName: this.configService.get<string>('email.fromName', 'Jawab'),
        features: {
          notifications: this.configService.get<boolean>(
            'email.features.notifications',
            true,
          ),
        },
        // Debug info
        _debug: {
          rawEnvUser: rawSmtpUser,
          rawEnvPass: rawSmtpPass,
          configUser: this.configService.get<string>(
            'email.smtp.auth.user',
            '',
          ),
        },
      };

      // Send test email
      const emailSent = await this.emailTemplatesService.sendNotificationEmail({
        recipientEmail: testEmail,
        recipientName: 'Test User',
        title: 'Email Test - Jawab',
        body: `This is a test email from Jawab API.${testParam ? ` Test parameter: ${testParam}` : ''}\n\nIf you received this email, your email configuration is working correctly!`,
        actionUrl: this.configService.get<string>(
          'app.url',
          'https://demo.jantrah.com/jawaab',
        ),
        actionText: 'Visit Jawab',
      });

      return {
        success: emailSent,
        message: emailSent
          ? 'Test email sent successfully'
          : 'Failed to send test email. Check logs for details.',
        config: {
          ...emailConfig,
          smtp: {
            ...emailConfig.smtp,
            pass: this.configService.get<string>('email.smtp.auth.pass', '')
              ? '***configured***'
              : 'not configured',
          },
        },
        testEmail,
        timestamp: new Date().toISOString(),
        // Debug information (remove in production)
        debug: emailConfig._debug,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error sending test email',
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @ApiOperation({ summary: 'Send a test email via POST' })
  @Post('test')
  async testEmailPost(@Body() body?: { email?: string; test?: string }) {
    return this.testEmail(body?.test, body?.email);
  }

  /**
   * Get email queue statistics
   * GET /api/mail/queue/stats
   */
  @ApiOperation({ summary: 'Get email queue statistics' })
  @Get('queue/stats')
  async getQueueStats() {
    const stats = await this.emailQueueService.getQueueStats();
    return {
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get failed jobs from queue
   * GET /api/mail/queue/failed
   */
  @ApiOperation({ summary: 'Get failed email queue jobs' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Get('queue/failed')
  async getFailedJobs(@Query('limit') limit?: string) {
    const failedJobs = await this.emailQueueService.getFailedJobs(
      limit ? parseInt(limit) : 50,
    );
    return {
      success: true,
      data: failedJobs,
      count: failedJobs.length,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Retry a failed job
   * POST /api/mail/queue/retry/:jobId
   */
  @ApiOperation({ summary: 'Retry a failed email queue job' })
  @ApiParam({ name: 'jobId', type: String })
  @Post('queue/retry/:jobId')
  async retryJob(@Param('jobId') jobId: string) {
    try {
      const result = await this.emailQueueService.retryFailedJob(jobId);
      return {
        success: true,
        message: 'Job queued for retry',
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Clear all jobs from queue (use with caution!)
   * DELETE /api/mail/queue/clear
   */
  @ApiOperation({ summary: 'Clear all jobs from email queue' })
  @Delete('queue/clear')
  @UseGuards(JwtAuthGuard) // Protect this endpoint
  async clearQueue() {
    try {
      const result = await this.emailQueueService.clearQueue();
      return {
        success: true,
        message: 'Queue cleared successfully',
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}

@ApiTags('Email')
@Controller('test-mail')
export class TestMailController {
  constructor(
    private readonly emailTemplatesService: EmailTemplatesService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Send a dynamic test email with customizable parameters
   * GET /api/test-mail/dynamicmail?email=...&subject=...&body=...&actionUrl=...&actionText=...
   */
  @ApiOperation({ summary: 'Send a dynamic test email' })
  @ApiQuery({ name: 'email', required: false, type: String })
  @ApiQuery({ name: 'subject', required: false, type: String })
  @ApiQuery({ name: 'body', required: false, type: String })
  @ApiQuery({ name: 'actionUrl', required: false, type: String })
  @ApiQuery({ name: 'actionText', required: false, type: String })
  @Get('dynamicmail')
  async sendDynamicMail(
    @Query('email') email?: string,
    @Query('subject') subject?: string,
    @Query('body') body?: string,
    @Query('actionUrl') actionUrl?: string,
    @Query('actionText') actionText?: string,
  ) {
    try {
      const emailEnabled = this.configService.get<boolean>(
        'email.enabled',
        true,
      );
      if (!emailEnabled) {
        return {
          success: false,
          message: 'Email service is disabled',
        };
      }

      const recipientEmail =
        email ||
        this.configService.get<string>('email.from', 'contact@bablojs.com');
      const emailSubject = subject || 'Dynamic Test Email - Jawab';
      const emailBody =
        body ||
        'This is a dynamic test email sent from the Jawab API. If you received this, your email configuration is working correctly!';
      const emailActionUrl =
        actionUrl ||
        this.configService.get<string>(
          'app.url',
          'https://demo.jantrah.com/jawaab',
        );
      const emailActionText = actionText || 'Visit Jawab';

      const result = await this.emailTemplatesService.sendNotificationEmail({
        recipientEmail,
        recipientName: 'Test User',
        title: emailSubject,
        body: emailBody,
        actionUrl: emailActionUrl,
        actionText: emailActionText,
      });

      return {
        success: result,
        message: result
          ? 'Dynamic test email sent successfully'
          : 'Failed to send dynamic test email. Check logs for details.',
        sentTo: recipientEmail,
        emailDetails: {
          subject: emailSubject,
          body: emailBody,
          actionUrl: emailActionUrl,
          actionText: emailActionText,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error sending dynamic test email',
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Send a dynamic test email via POST
   * POST /api/test-mail/dynamicmail
   */
  @ApiOperation({ summary: 'Send a dynamic test email via POST' })
  @Post('dynamicmail')
  async sendDynamicMailPost(
    @Body()
    body?: {
      email?: string;
      subject?: string;
      body?: string;
      actionUrl?: string;
      actionText?: string;
    },
  ) {
    return this.sendDynamicMail(
      body?.email,
      body?.subject,
      body?.body,
      body?.actionUrl,
      body?.actionText,
    );
  }

  /**
   * Send a test email to a specific address directly
   * GET /api/test-mail/:email
   */
  @ApiOperation({ summary: 'Send test email to specific address' })
  @ApiParam({ name: 'email', type: String })
  @Get(':email')
  async sendMailDirectly(@Param('email') email: string) {
    return this.sendDynamicMail(email);
  }
}
