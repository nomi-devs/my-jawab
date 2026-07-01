import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
  OneToMany,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Subscription } from './subscription.entity';
import { Payment } from './payment.entity';

export enum SubscriptionRenewalType {
  AUTO = 'auto',
  MANUAL = 'manual',
}

export enum SubscriptionStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
}

@Entity('users_subscriptions')
@Unique(['user_id', 'subscription_id'])
export class UserSubscription {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', comment: 'User ID' })
  @Index()
  user_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'int', comment: 'Subscription ID' })
  @Index()
  subscription_id: number;

  @ManyToOne(
    () => Subscription,
    (subscription) => subscription.user_subscriptions,
  )
  @JoinColumn({ name: 'subscription_id' })
  subscription: Subscription;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Subscription start date',
  })
  subscription_start_date: Date | null;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Subscription end date',
  })
  subscription_end_date: Date | null;

  @Column({
    type: 'enum',
    enum: SubscriptionRenewalType,
    nullable: false,
    comment: 'Subscription renewal type',
  })
  subscription_renewal_type: SubscriptionRenewalType;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Subscription renewal date',
  })
  subscription_renewal_date: Date | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
    comment: 'Subscription renewal amount',
  })
  subscription_renewal_amount: number;

  @Column({
    type: 'varchar',
    length: 10,
    nullable: false,
    comment: 'Subscription renewal currency',
  })
  subscription_renewal_currency: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    comment: 'Subscription renewal gateway',
  })
  subscription_renewal_gateway: string;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    nullable: false,
    comment: 'Subscription status',
  })
  subscription_status: SubscriptionStatus;

  @Column({
    type: 'tinyint',
    width: 1,
    default: 1,
    comment: 'Subscription active status (0 = inactive, 1 = active)',
  })
  @Index()
  is_active: boolean;

  @Column({ type: 'int', nullable: true, comment: 'Created by user ID' })
  created_by: number | null;

  @Column({ type: 'int', nullable: true, comment: 'Updated by user ID' })
  updated_by: number | null;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    comment: 'When user subscription was created',
  })
  created_at: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
    comment: 'Last update timestamp',
  })
  updated_at: Date;

  @OneToMany(() => Payment, (payment) => payment.user_subscription)
  payments: Payment[];
}
