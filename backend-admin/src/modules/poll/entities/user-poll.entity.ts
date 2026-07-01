import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { PollOption } from './poll-option.entity';
import { PollVote } from './poll-vote.entity';
import { PollLike } from './poll-like.entity';

export enum PollStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ENDED = 'ended',
}

@Entity('user_polls')
export class UserPoll {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false, comment: 'User ID' })
  @Index()
  user_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment:
      'Comma-separated community IDs if the poll is in one or more communities',
  })
  community_ids: string | null;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    comment: 'Poll slug',
  })
  @Index()
  poll_slug: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    comment: 'Poll title',
  })
  poll_title: string;

  @Column({
    type: 'text',
    nullable: false,
    comment: 'Poll description',
  })
  poll_description: string;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Poll expiration time',
  })
  @Index()
  poll_expires_at: Date | null;

  @Column({
    type: 'enum',
    enum: PollStatus,
    default: PollStatus.DRAFT,
    comment: 'Poll status',
  })
  @Index()
  poll_status: PollStatus;

  @Column({
    type: 'int',
    nullable: true,
    default: null,
    comment: 'Poll winner option ID',
  })
  poll_winner_option_id: number | null;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Total vote count',
  })
  @Index()
  vote_count: number;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Poll view count',
  })
  view_count: number;

  @Column({
    type: 'tinyint',
    width: 1,
    default: 0,
    comment: 'Featured poll status (0 = not featured, 1 = featured)',
  })
  @Index()
  is_featured: boolean;

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
    comment: 'When user poll was created',
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

  @OneToMany(() => PollOption, (option) => option.poll)
  options: PollOption[];

  @OneToMany(() => PollVote, (vote) => vote.poll)
  votes: PollVote[];

  @OneToMany(() => PollLike, (like) => like.poll)
  likes: PollLike[];
}
