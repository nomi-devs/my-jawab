import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Notification } from '../../notification/entities/notification.entity';
import { Email } from '../../email/entities/email.entity';

export enum JobType {
  NOTIFICATION = 'notification',
  EMAIL = 'email',
  PUSH = 'push',
  SMS = 'sms',
  BULK_NOTIFICATION = 'bulk_notification',
  BULK_EMAIL = 'bulk_email',
  SCHEDULED_NOTIFICATION = 'scheduled_notification',
  EMAIL_RETRY = 'email_retry',
  TEMPLATE_RENDER = 'template_render',
}

export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity('jobs')
export class Job {
  @PrimaryGeneratedColumn({ comment: 'Unique job ID' })
  id: number;

  @Column({
    type: 'enum',
    enum: JobType,
    comment: 'Type of job',
  })
  @Index()
  job_type: JobType;

  @Column({
    type: 'enum',
    enum: JobStatus,
    default: JobStatus.PENDING,
    comment: 'Job status',
  })
  @Index()
  job_status: JobStatus;

  @Column({
    type: 'int',
    default: 5,
    comment: 'Job priority (1 = highest, 10 = lowest)',
  })
  @Index()
  priority: number;

  // Job payload and references
  @Column({ type: 'json', comment: 'Job payload/data' })
  payload: Record<string, any>;

  @Column({ type: 'int', nullable: true, comment: 'Related notification ID' })
  @Index()
  notification_id: number | null;

  @ManyToOne(() => Notification, { nullable: true })
  @JoinColumn({ name: 'notification_id' })
  notification: Notification | null;

  @Column({ type: 'int', nullable: true, comment: 'Related email ID' })
  @Index()
  email_id: number | null;

  @ManyToOne(() => Email, { nullable: true })
  @JoinColumn({ name: 'email_id' })
  email: Email | null;

  // Retry mechanism
  @Column({ type: 'int', default: 0, comment: 'Number of attempts made' })
  attempts: number;

  @Column({ type: 'int', default: 3, comment: 'Maximum number of attempts' })
  max_attempts: number;

  @Column({ type: 'text', nullable: true, comment: 'Error message if failed' })
  error_message: string | null;

  @Column({
    type: 'json',
    nullable: true,
    comment: 'Detailed error information',
  })
  error_details: Record<string, any> | null;

  // Execution tracking
  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'When job processing started',
  })
  started_at: Date | null;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'When job was completed',
  })
  completed_at: Date | null;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'When job is scheduled to run',
  })
  @Index()
  scheduled_at: Date | null;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Next retry attempt time',
  })
  @Index()
  next_retry_at: Date | null;

  // Logs
  @Column({ type: 'json', nullable: true, comment: 'Job execution logs' })
  logs: Array<{
    level: string;
    message: string;
    timestamp: Date;
    details?: Record<string, any>;
  }> | null;

  // Metadata
  @Column({ type: 'int', nullable: true, comment: 'Created by user ID' })
  created_by: number | null;

  @Column({ type: 'int', nullable: true, comment: 'Updated by user ID' })
  updated_by: number | null;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    comment: 'When job was created',
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
}
