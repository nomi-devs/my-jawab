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

@Entity('topics')
@Unique(['topic_slug'])
export class Topic {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Parent topic ID for nested topics',
  })
  @Index()
  parent_id: number;

  @ManyToOne(() => Topic, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: Topic | null;

  @OneToMany(() => Topic, (topic) => topic.parent)
  children: Topic[];

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    comment: 'Topic slug',
  })
  topic_slug: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    comment: 'Topic name',
  })
  @Index()
  topic_name: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Topic description',
  })
  topic_description: string | null;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: 'Topic image URL',
  })
  topic_image: string | null;

  @Column({
    type: 'tinyint',
    width: 1,
    default: 1,
    comment: 'Topic active status (0 = inactive, 1 = active)',
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
    comment: 'When topic was created',
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

