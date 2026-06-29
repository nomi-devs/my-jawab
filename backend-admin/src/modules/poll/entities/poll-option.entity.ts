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
import { UserPoll } from './user-poll.entity';
import { User } from '../../auth/entities/user.entity';

@Entity('poll_options')
export class PollOption {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false, comment: 'Poll ID' })
  @Index()
  poll_id: number;

  @ManyToOne(() => UserPoll, (poll) => poll.options)
  @JoinColumn({ name: 'poll_id' })
  poll: UserPoll;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    comment: 'Option text',
  })
  option_text: string;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Option vote count',
  })
  @Index()
  vote_count: number;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Display order',
  })
  @Index()
  display_order: number;

  @Column({
    type: 'tinyint',
    width: 1,
    default: 1,
    comment: 'Option active status (0 = inactive, 1 = active)',
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
    comment: 'When poll option was created',
  })
  created_at: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
    comment: 'Last update timestamp',
  })
  updated_at: Date;
}

