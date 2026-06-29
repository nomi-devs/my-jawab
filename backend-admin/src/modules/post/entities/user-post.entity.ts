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
import { Topic } from '../../general/entities/topic.entity';
import { PostLike } from './post-like.entity';

export enum PostStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum PostType {
  POST = 'post',
  QUESTION = 'question',
}

@Entity('user_posts')
export class UserPost {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: 'Comma-separated community IDs if the post is in one or more communities',
  })
  community_ids: string | null;

  @Column({ type: 'int', nullable: false, comment: 'User ID' })
  @Index()
  user_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    comment: 'Post slug',
  })
  @Index()
  post_slug: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    comment: 'Post title',
  })
  post_title: string;

  @Column({
    type: 'text',
    nullable: false,
    comment: 'Post content',
  })
  post_content: string;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: 'Post image URL',
  })
  post_image: string | null;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: 'Post video URL',
  })
  post_video: string | null;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: 'Post audio URL',
  })
  post_audio: string | null;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: 'Post link URL',
  })
  post_link: string | null;

  @Column({
    type: 'enum',
    enum: PostStatus,
    default: PostStatus.DRAFT,
    comment: 'Post status',
  })
  @Index()
  post_status: PostStatus;

  @Column({
    type: 'enum',
    enum: PostType,
    default: PostType.POST,
    comment: 'Post type',
  })
  @Index()
  post_type: PostType;

  @Column({ type: 'int', nullable: true, comment: 'Post topic ID' })
  @Index()
  post_topic_id: number | null;

  @ManyToOne(() => Topic, { nullable: true })
  @JoinColumn({ name: 'post_topic_id' })
  topic: Topic | null;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: 'Comma-separated post tags',
  })
  post_tags: string | null;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Post view count',
  })
  @Index()
  view_count: number;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Post like count',
  })
  @Index()
  like_count: number;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Post dislike count',
  })
  dislike_count: number;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Post comment count',
  })
  comment_count: number;

  @Column({
    type: 'tinyint',
    width: 1,
    default: 0,
    comment: 'Featured post status (0 = not featured, 1 = featured)',
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
    comment: 'When post was created',
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

  @OneToMany(() => PostLike, (postLike) => postLike.post)
  likes: PostLike[];
}

