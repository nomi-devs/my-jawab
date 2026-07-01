import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Email, EmailType, EmailStatus } from './entities/email.entity';

@Injectable()
export class EmailService {
  constructor(
    @InjectRepository(Email)
    private emailRepository: Repository<Email>,
  ) {}

  async create(data: {
    user_id?: number;
    notification_id?: number;
    email_type: EmailType;
    recipient_email: string;
    recipient_name?: string;
    subject: string;
    body_html?: string;
    body_text?: string;
    template_name?: string;
    template_data?: Record<string, any>;
    from_email: string;
    from_name?: string;
    reply_to?: string;
    cc_emails?: string[];
    bcc_emails?: string[];
    attachments?: string[];
    created_by?: number;
  }): Promise<Email> {
    const email = this.emailRepository.create({
      ...data,
      status: EmailStatus.PENDING,
    });

    return await this.emailRepository.save(email);
  }

  async findById(id: number): Promise<Email | null> {
    return await this.emailRepository.findOne({ where: { id } });
  }

  async findByUserId(
    user_id: number,
    options?: {
      status?: EmailStatus;
      email_type?: EmailType;
      limit?: number;
      offset?: number;
    },
  ): Promise<Email[]> {
    const query = this.emailRepository
      .createQueryBuilder('email')
      .where('email.user_id = :user_id', { user_id })
      .orderBy('email.created_at', 'DESC');

    if (options?.status) {
      query.andWhere('email.status = :status', { status: options.status });
    }

    if (options?.email_type) {
      query.andWhere('email.email_type = :type', { type: options.email_type });
    }

    if (options?.limit) {
      query.limit(options.limit);
    }

    if (options?.offset) {
      query.offset(options.offset);
    }

    return await query.getMany();
  }

  async updateStatus(
    id: number,
    status: EmailStatus,
    data?: {
      provider?: string;
      provider_message_id?: string;
      error_message?: string;
      sent_at?: Date;
      delivered_at?: Date;
      opened_at?: Date;
      clicked_at?: Date;
      queued_at?: Date;
      processing_started_at?: Date;
      failed_at?: Date;
      queue_job_id?: string;
    },
  ): Promise<Email> {
    const email = await this.emailRepository.findOne({ where: { id } });

    if (!email) {
      throw new Error('Email not found');
    }

    email.status = status;
    if (data) {
      Object.assign(email, data);
    }

    return await this.emailRepository.save(email);
  }

  async incrementRetry(id: number): Promise<Email> {
    const email = await this.emailRepository.findOne({ where: { id } });

    if (!email) {
      throw new Error('Email not found');
    }

    email.retry_count += 1;

    return await this.emailRepository.save(email);
  }
}

