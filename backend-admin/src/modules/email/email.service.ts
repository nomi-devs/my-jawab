import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailType, EmailStatus } from './entities/email.entity';

@Injectable()
export class EmailService {
  constructor(private prisma: PrismaService) {}

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
  }) {
    return await this.prisma.email.create({
      data: {
        user_id: data.user_id ?? null,
        notification_id: data.notification_id ?? null,
        email_type: data.email_type as any,
        recipient_email: data.recipient_email,
        recipient_name: data.recipient_name ?? null,
        subject: data.subject,
        body_html: data.body_html ?? null,
        body_text: data.body_text ?? null,
        template_name: data.template_name ?? null,
        template_data: data.template_data ?? undefined,
        from_email: data.from_email,
        from_name: data.from_name ?? null,
        reply_to: data.reply_to ?? null,
        cc_emails: data.cc_emails ?? undefined,
        bcc_emails: data.bcc_emails ?? undefined,
        attachments: data.attachments ?? undefined,
        status: 'pending',
        created_by: data.created_by ?? null,
      },
    });
  }

  async findById(id: number) {
    return await this.prisma.email.findUnique({ where: { id } });
  }

  async findByUserId(
    user_id: number,
    options?: {
      status?: EmailStatus;
      email_type?: EmailType;
      limit?: number;
      offset?: number;
    },
  ) {
    return await this.prisma.email.findMany({
      where: {
        user_id,
        ...(options?.status ? { status: options.status as any } : {}),
        ...(options?.email_type
          ? { email_type: options.email_type as any }
          : {}),
      },
      orderBy: { created_at: 'desc' },
      ...(options?.limit !== undefined ? { take: options.limit } : {}),
      ...(options?.offset !== undefined ? { skip: options.offset } : {}),
    });
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
  ) {
    const email = await this.prisma.email.findUnique({ where: { id } });

    if (!email) {
      throw new Error('Email not found');
    }

    return await this.prisma.email.update({
      where: { id },
      data: {
        status: status as any,
        ...(data ?? {}),
      },
    });
  }

  async incrementRetry(id: number) {
    const email = await this.prisma.email.findUnique({ where: { id } });

    if (!email) {
      throw new Error('Email not found');
    }

    return await this.prisma.email.update({
      where: { id },
      data: { retry_count: { increment: 1 } },
    });
  }
}
