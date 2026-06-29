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
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { UserSubscription } from './user-subscription.entity';
import { Currency } from '../../currency/entities/currency.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  PAYPAL = 'paypal',
  BANK_TRANSFER = 'bank_transfer',
  CASH = 'cash',
}

@Entity('payments')
@Unique(['users_subscriptions_id', 'user_id'])
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', comment: 'Users subscriptions ID' })
  @Index()
  users_subscriptions_id: number;

  @ManyToOne(() => UserSubscription, (userSubscription) => userSubscription.payments)
  @JoinColumn({ name: 'users_subscriptions_id' })
  user_subscription: UserSubscription;

  @Column({ type: 'int', comment: 'User ID' })
  @Index()
  user_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
    comment: 'Payment amount',
  })
  payment_amount: number;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    nullable: false,
    comment: 'Payment status',
  })
  @Index()
  payment_status: PaymentStatus;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    nullable: false,
    comment: 'Payment method',
  })
  @Index()
  payment_method: PaymentMethod;

  @Column({
    type: 'varchar',
    length: 10,
    nullable: false,
    comment: 'Payment currency',
  })
  payment_currency: string;

  @Column({ type: 'int', nullable: true, comment: 'Currency ID' })
  @Index()
  currency_id: number | null;

  @ManyToOne(() => Currency, { nullable: true })
  @JoinColumn({ name: 'currency_id' })
  currency: Currency | null;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    comment: 'Payment gateway',
  })
  payment_gateway: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    comment: 'Payment transaction ID',
  })
  payment_transaction_id: string;

  @Column({ type: 'int', nullable: true, comment: 'Created by user ID' })
  created_by: number | null;

  @Column({ type: 'int', nullable: true, comment: 'Updated by user ID' })
  updated_by: number | null;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    comment: 'When payment was created',
  })
  @Index()
  created_at: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
    comment: 'Last update timestamp',
  })
  @Index()
  updated_at: Date;
}

