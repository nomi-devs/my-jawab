import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { Email, EmailType } from '../entities/email.entity';

/**
 * Email Queue Service
 * 
 * Handles adding emails to the queue for background processing.
 * When queue is enabled, emails are added to the queue instead of being sent immediately.
 */
@Injectable()
export class EmailQueueService {
  private readonly logger = new Logger(EmailQueueService.name);
  private readonly queueEnabled: boolean;

  constructor(
    @InjectQueue('email') private readonly emailQueue: Queue,
    private readonly configService: ConfigService,
  ) {
    this.queueEnabled = this.configService.get<boolean>('email.queue.enabled', false);
  }

  /**
   * Add email to queue for background processing
   * @param email Email entity to send
   * @returns Job ID if queued, null if queue is disabled
   */
  async addEmailToQueue(email: Email): Promise<string | null> {
    if (!this.queueEnabled) {
      this.logger.debug('Email queue is disabled, email will be sent immediately');
      return null;
    }

    try {
      const maxConcurrent = this.configService.get<number>('email.queue.maxConcurrent', 5);
      const batchSize = this.configService.get<number>('email.queue.batchSize', 10);

      // Add job to queue with priority (higher priority = sent first)
      // You can set priority based on email type if needed
      const priority = this.getEmailPriority(email);

      const job = await this.emailQueue.add(
        'send-email',
        { emailId: email.id },
        {
          jobId: `email-${email.id}`, // Unique job ID to prevent duplicates
          priority,
          attempts: this.configService.get<number>('email.retry.maxRetries', 3),
          backoff: {
            type: 'exponential',
            delay: this.configService.get<number>('email.retry.retryDelay', 5000),
          },
          removeOnComplete: {
            age: 24 * 3600, // Keep completed jobs for 24 hours
            count: 1000, // Keep last 1000 completed jobs
          },
          removeOnFail: {
            age: 7 * 24 * 3600, // Keep failed jobs for 7 days
          },
        },
      );

      this.logger.log(`Email ${email.id} added to queue with job ID: ${job.id}`);

      return job.id as string;
    } catch (error) {
      this.logger.error(`Failed to add email ${email.id} to queue:`, error.message);
      throw error;
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    if (!this.queueEnabled) {
      return {
        enabled: false,
        message: 'Email queue is disabled',
      };
    }

    try {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        this.emailQueue.getWaitingCount(),
        this.emailQueue.getActiveCount(),
        this.emailQueue.getCompletedCount(),
        this.emailQueue.getFailedCount(),
        this.emailQueue.getDelayedCount(),
      ]);

      return {
        enabled: true,
        waiting,
        active,
        completed,
        failed,
        delayed,
        total: waiting + active + completed + failed + delayed,
      };
    } catch (error) {
      this.logger.error('Failed to get queue stats:', error.message);
      return {
        enabled: true,
        error: error.message,
      };
    }
  }

  /**
   * Retry failed email job
   */
  async retryFailedJob(jobId: string) {
    try {
      const job = await this.emailQueue.getJob(jobId);
      if (!job) {
        throw new Error(`Job ${jobId} not found`);
      }

      await job.retry();
      this.logger.log(`Retrying failed job ${jobId}`);
      return { success: true, jobId };
    } catch (error) {
      this.logger.error(`Failed to retry job ${jobId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get all failed jobs
   */
  async getFailedJobs(limit = 50) {
    try {
      const failed = await this.emailQueue.getFailed(0, limit - 1);
      return failed.map((job) => ({
        id: job.id,
        data: job.data,
        failedReason: job.failedReason,
        timestamp: job.timestamp,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
      }));
    } catch (error) {
      this.logger.error('Failed to get failed jobs:', error.message);
      return [];
    }
  }

  /**
   * Clear all jobs from queue
   */
  async clearQueue() {
    try {
      await this.emailQueue.obliterate({ force: true });
      this.logger.log('Email queue cleared');
      return { success: true };
    } catch (error) {
      this.logger.error('Failed to clear queue:', error.message);
      throw error;
    }
  }

  /**
   * Get email priority based on type
   * Higher priority = sent first
   */
  private getEmailPriority(email: Email): number {
    // Priority levels (higher = more important):
    // 100: Critical (password reset, verification)
    // 50: Important (subscription, notifications)
    // 10: Normal (general emails)
    // 1: Low (newsletters, marketing)

    switch (email.email_type) {
      case EmailType.VERIFICATION:
      case EmailType.PASSWORD_RESET:
        return 100;
      case EmailType.NOTIFICATION:
      case EmailType.ADMIN:
        return 50;
      case EmailType.WELCOME:
      case EmailType.SYSTEM:
        return 10;
      case EmailType.BULK:
      default:
        return 1;
    }
  }

  /**
   * Check if queue is enabled
   */
  isEnabled(): boolean {
    return this.queueEnabled;
  }
}
