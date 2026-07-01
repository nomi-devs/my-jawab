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
import { Email } from '../../email/entities/email.entity';

export enum NotificationType {
  COMMENT = 'comment',
  REPLY = 'reply',
  LIKE = 'like',
  FOLLOW = 'follow',
  MENTION = 'mention',
  POST_APPROVED = 'post_approved',
  COMMENT_APPROVED = 'comment_approved',
  COMMUNITY_INVITE = 'community_invite',
  POLL_ENDED = 'poll_ended',
  SUBSCRIPTION_EXPIRED = 'subscription_expired',
  SYSTEM = 'system',
  ADMIN = 'admin',
}

export enum PushStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  BOUNCED = 'bounced',
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum DeviceType {
  ANDROID = 'android',
  IOS = 'ios',
  WEB = 'web',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn({ comment: 'Unique notification ID' })
  id: number;

  @Column({ type: 'int', comment: 'User ID who receives the notification' })
  @Index()
  user_id: number;

  @Column({
    type: 'enum',
    enum: NotificationType,
    comment: 'Type of notification',
  })
  @Index()
  notification_type: NotificationType;

  @Column({ type: 'varchar', length: 255, comment: 'Notification title' })
  title: string;

  @Column({ type: 'text', comment: 'Notification body/content' })
  body: string;

  @Column({
    type: 'json',
    nullable: true,
    comment: 'Additional notification data',
  })
  data: Record<string, any> | null;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: 'URL to navigate when notification is clicked',
  })
  action_url: string | null;

  // Delivery channels
  @Column({
    type: 'tinyint',
    width: 1,
    default: 1,
    comment: 'In-app notification enabled',
  })
  in_app_enabled: boolean;

  @Column({
    type: 'tinyint',
    width: 1,
    default: 1,
    comment: 'Push notification enabled',
  })
  push_enabled: boolean;

  @Column({
    type: 'tinyint',
    width: 1,
    default: 1,
    comment: 'Email notification enabled',
  })
  email_enabled: boolean;

  // In-app status
  @Column({ type: 'tinyint', width: 1, default: 0, comment: 'Read status' })
  @Index()
  is_read: boolean;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'When notification was read',
  })
  read_at: Date | null;

  // Push notification tracking
  @Column({
    type: 'enum',
    enum: PushStatus,
    nullable: true,
    comment: 'Push notification status',
  })
  @Index()
  push_status: PushStatus | null;

  @Column({
    type: 'int',
    nullable: true,
    comment: 'Device ID for push notification',
  })
  @Index()
  device_id: number | null;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: 'Device token for push notification',
  })
  device_token: string | null;

  @Column({
    type: 'enum',
    enum: DeviceType,
    nullable: true,
    comment: 'Device type for push',
  })
  device_type: DeviceType | null;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'FCM message ID',
  })
  fcm_message_id: string | null;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'APNS message ID',
  })
  apns_id: string | null;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'When push notification was sent',
  })
  push_sent_at: Date | null;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'When push notification was delivered',
  })
  push_delivered_at: Date | null;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Push notification error message',
  })
  push_error_message: string | null;

  // Email tracking
  @Column({ type: 'int', nullable: true, comment: 'Related email ID' })
  @Index()
  email_id: number | null;

  @ManyToOne(() => Email, { nullable: true })
  @JoinColumn({ name: 'email_id' })
  email: Email | null;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'When email notification was sent',
  })
  email_sent_at: Date | null;

  // Metadata
  @Column({
    type: 'enum',
    enum: NotificationPriority,
    default: NotificationPriority.NORMAL,
    comment: 'Notification priority',
  })
  @Index()
  priority: NotificationPriority;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Notification expiration time',
  })
  expires_at: Date | null;

  @Column({ type: 'int', nullable: true, comment: 'Created by user ID' })
  created_by: number | null;

  @Column({ type: 'int', nullable: true, comment: 'Updated by user ID' })
  updated_by: number | null;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    comment: 'When notification was created',
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
