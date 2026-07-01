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
import { UserPoll } from './user-poll.entity';
import { User } from '../../auth/entities/user.entity';

@Entity('poll_comments')
export class PollComment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false, comment: 'Poll ID' })
  @Index()
  poll_id: number;

  @ManyToOne(() => UserPoll)
  @JoinColumn({ name: 'poll_id' })
  poll: UserPoll;

  @Column({ type: 'int', nullable: false, comment: 'User ID' })
  @Index()
  user_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'int',
    nullable: true,
    default: null,
    comment: 'Parent comment ID for nested comments',
  })
  @Index()
  parent_comment_id: number | null;

  @ManyToOne(() => PollComment, (comment) => comment.replies, {
    nullable: true,
  })
  @JoinColumn({ name: 'parent_comment_id' })
  parent_comment: PollComment | null;

  @OneToMany(() => PollComment, (comment) => comment.parent_comment)
  replies: PollComment[];

  @Column({
    type: 'text',
    nullable: false,
    comment: 'Comment content',
  })
  comment_content: string;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Comment like count',
  })
  @Index()
  like_count: number;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Comment dislike count',
  })
  dislike_count: number;

  @Column({
    type: 'tinyint',
    width: 1,
    default: 1,
    comment: 'Comment approval status (0 = not approved, 1 = approved)',
  })
  @Index()
  is_approved: boolean;

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
    comment: 'When poll comment was created',
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
