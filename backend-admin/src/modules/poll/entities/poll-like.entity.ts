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
import { User } from '../../auth/entities/user.entity';

export enum LikeStatus {
  LIKE = 'like',
  DISLIKE = 'dislike',
}

@Entity('poll_likes')
@Unique(['poll_id', 'user_id'])
export class PollLike {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', comment: 'Poll ID' })
  @Index()
  poll_id: number;

  @ManyToOne(() => UserPoll, (poll) => poll.likes)
  @JoinColumn({ name: 'poll_id' })
  poll: UserPoll;

  @Column({ type: 'int', comment: 'User ID' })
  @Index()
  user_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: LikeStatus,
    nullable: false,
    comment: 'Like status',
  })
  @Index()
  like_status: LikeStatus;

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
    comment: 'When poll like was created',
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
