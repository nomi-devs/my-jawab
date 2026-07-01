import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { EmailSenderService } from '../services/email-sender.service';
import { EmailService } from '../email.service';
import { EmailStatus } from '../entities/email.entity';

export interface EmailJobData {
  emailId: number;
}

/**
 * Email Queue Processor
 *
 * Processes email jobs from the queue and sends them via SMTP.
 * This runs in the background, allowing the API to return immediately.
 */
@Processor('email')
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(
    private readonly emailSenderService: EmailSenderService,
    private readonly emailService: EmailService,
  ) {
    super();
  }

  /**
   * Process email job
   * This method is called automatically when a job is added to the queue
   */
  async process(job: Job<EmailJobData>): Promise<boolean> {
    const { emailId } = job.data;

    this.logger.log(`Processing email job ${job.id} for email ${emailId}`);

    try {
      // Fetch email from database
      const email = await this.emailService.findById(emailId);

      if (!email) {
        this.logger.error(`Email ${emailId} not found`);
        throw new Error(`Email ${emailId} not found`);
      }

      // Update status to processing
      await this.emailService.updateStatus(emailId, EmailStatus.PROCESSING, {
        queued_at: job.timestamp ? new Date(job.timestamp) : new Date(),
        processing_started_at: new Date(),
      });

      // Send email
      const success = await this.emailSenderService.sendEmail(email);

      if (success) {
        this.logger.log(`Email ${emailId} sent successfully`);
        return true;
      } else {
        this.logger.warn(`Failed to send email ${emailId}`);
        throw new Error('Email sending failed');
      }
    } catch (error) {
      this.logger.error(`Error processing email ${emailId}:`, error.message);

      // Update email status to failed
      await this.emailService.updateStatus(emailId, EmailStatus.FAILED, {
        error_message: error.message || 'Unknown error occurred',
        failed_at: new Date(),
      });

      // Re-throw to mark job as failed
      throw error;
    }
  }

  /**
   * Called when a job completes successfully
   */
  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Email job ${job.id} completed successfully`);
  }

  /**
   * Called when a job fails
   */
  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Email job ${job.id} failed:`, error.message);
  }

  /**
   * Called when a job is retried
   */
  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.debug(`Email job ${job.id} is now active`);
  }
}
