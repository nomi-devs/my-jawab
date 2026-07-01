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
import { UserPoll } from './user-poll.entity';
import { PollOption } from './poll-option.entity';
import { User } from '../../auth/entities/user.entity';

@Entity('poll_votes')
@Unique(['poll_id', 'user_id'])
export class PollVote {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false, comment: 'Poll ID' })
  @Index()
  poll_id: number;

  @ManyToOne(() => UserPoll, (poll) => poll.votes)
  @JoinColumn({ name: 'poll_id' })
  poll: UserPoll;

  @Column({ type: 'int', nullable: false, comment: 'User ID' })
  @Index()
  user_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'int', nullable: false, comment: 'Vote option ID' })
  @Index()
  vote_option_id: number;

  @ManyToOne(() => PollOption)
  @JoinColumn({ name: 'vote_option_id' })
  option: PollOption;

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
    comment: 'When poll vote was created',
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
