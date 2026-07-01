import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Notification } from '../../notification/entities/notification.entity';
import { Job } from '../../job/entities/job.entity';

export enum EmailType {
  VERIFICATION = 'verification',
  PASSWORD_RESET = 'password_reset',
  WELCOME = 'welcome',
  NOTIFICATION = 'notification',
  ADMIN = 'admin',
  BULK = 'bulk',
  SYSTEM = 'system',
}

export enum EmailStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  PROCESSING = 'processing',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  BOUNCED = 'bounced',
  OPENED = 'opened',
  CLICKED = 'clicked',
}

@Entity('emails')
export class Email {
  @PrimaryGeneratedColumn({ comment: 'Unique email ID' })
  id: number;

  @Column({ type: 'int', nullable: true, comment: 'Related notification ID' })
  @Index()
  notification_id: number | null;

  @ManyToOne(() => Notification, { nullable: true })
  @JoinColumn({ name: 'notification_id' })
  notification: Notification | null;

  @Column({ type: 'int', nullable: true, comment: 'User ID' })
  @Index()
  user_id: number | null;

  @Column({
    type: 'enum',
    enum: EmailType,
    comment: 'Type of email',
  })
  @Index()
  email_type: EmailType;

  // Recipient information
  @Column({ type: 'varchar', length: 255, comment: 'Recipient email address' })
  @Index()
  recipient_email: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Recipient name',
  })
  recipient_name: string | null;

  // Email content
  @Column({ type: 'varchar', length: 500, comment: 'Email subject' })
  subject: string;

  @Column({ type: 'text', nullable: true, comment: 'Email HTML body' })
  body_html: string | null;

  @Column({ type: 'text', nullable: true, comment: 'Email plain text body' })
  body_text: string | null;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Email template name used',
  })
  template_name: string | null;

  @Column({
    type: 'json',
    nullable: true,
    comment: 'Template data/variables used',
  })
  template_data: Record<string, any> | null;

  // Sender information
  @Column({ type: 'varchar', length: 255, comment: 'Sender email address' })
  from_email: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Sender name',
  })
  from_name: string | null;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Reply-to email address',
  })
  reply_to: string | null;

  @Column({ type: 'json', nullable: true, comment: 'CC email addresses' })
  cc_emails: string[] | null;

  @Column({ type: 'json', nullable: true, comment: 'BCC email addresses' })
  bcc_emails: string[] | null;

  @Column({ type: 'json', nullable: true, comment: 'Email attachments' })
  attachments: string[] | null;

  // Status and tracking
  @Column({
    type: 'enum',
    enum: EmailStatus,
    default: EmailStatus.PENDING,
    comment: 'Email status',
  })
  @Index()
  status: EmailStatus;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Email provider used',
  })
  @Index()
  provider: string | null;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Provider message ID',
  })
  provider_message_id: string | null;

  @Column({ type: 'text', nullable: true, comment: 'Error message if failed' })
  error_message: string | null;

  // Timestamps
  @Column({ type: 'timestamp', nullable: true, comment: 'When email was sent' })
  sent_at: Date | null;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'When email was delivered',
  })
  delivered_at: Date | null;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'When email was opened',
  })
  opened_at: Date | null;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'When email link was clicked',
  })
  clicked_at: Date | null;

  // Retry mechanism
  @Column({ type: 'int', default: 0, comment: 'Number of retry attempts' })
  retry_count: number;

  @Column({ type: 'int', default: 3, comment: 'Maximum retry attempts' })
  max_retries: number;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Next retry attempt time',
  })
  @Index()
  next_retry_at: Date | null;

  // Metadata
  @Column({ type: 'int', nullable: true, comment: 'Created by user ID' })
  created_by: number | null;

  @Column({ type: 'int', nullable: true, comment: 'Updated by user ID' })
  updated_by: number | null;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    comment: 'When email was created',
  })
  @Index()
  created_at: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
    comment: 'Last update timestamp',
  })
  updated_at: Date;

  @OneToMany(() => Job, (job) => job.email)
  jobs: Job[];
}
