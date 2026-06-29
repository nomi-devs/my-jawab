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
import { UserSubscription } from './user-subscription.entity';
import { Currency } from '../../currency/entities/currency.entity';

export enum SubscriptionType {
  FREE = 'free',
  PRO = 'pro',
  PREMIUM = 'premium',
}

export enum SubscriptionDurationType {
  DAYS = 'days',
  WEEKS = 'weeks',
  MONTHS = 'months',
  YEARS = 'years',
}

@Entity('subscriptions')
@Unique(['subscription_name'])
export class Subscription {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: SubscriptionType,
    nullable: false,
    comment: 'Subscription type',
  })
  subscription_type: SubscriptionType;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    comment: 'Subscription name',
  })
  subscription_name: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Subscription description',
  })
  subscription_description: string | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
    comment: 'Subscription price',
  })
  subscription_price: number;

  @Column({
    type: 'int',
    nullable: false,
    comment: 'Subscription duration in days',
  })
  subscription_duration: number;

  @Column({
    type: 'enum',
    enum: SubscriptionDurationType,
    nullable: false,
    comment: 'Subscription duration type',
  })
  subscription_duration_type: SubscriptionDurationType;

  @Column({
    type: 'varchar',
    length: 10,
    nullable: true,
    comment: 'Subscription currency code/symbol',
  })
  subscription_currency: string | null;

  @Column({ type: 'int', nullable: true, comment: 'Currency ID' })
  currency_id: number | null;

  @ManyToOne(() => Currency, { nullable: true })
  @JoinColumn({ name: 'currency_id' })
  currency: Currency | null;

  @Column({
    type: 'json',
    nullable: true,
    comment: 'Feature flags and numeric limits for this plan (entitlements)',
  })
  features: Record<string, any> | null;

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

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: User | null;

  @Column({ type: 'int', nullable: true, comment: 'Updated by user ID' })
  updated_by: number | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updater: User | null;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    comment: 'When subscription was created',
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

  @OneToMany(() => UserSubscription, (userSubscription) => userSubscription.subscription)
  user_subscriptions: UserSubscription[];
}

