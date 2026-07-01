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
import { Community } from './community.entity';
import { Topic } from '../../general/entities/topic.entity';
import { User } from '../../auth/entities/user.entity';

@Entity('community_topics')
@Unique(['community_id', 'topic_id'])
export class CommunityTopic {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', comment: 'Community ID' })
  @Index()
  community_id: number;

  @ManyToOne(() => Community, (community) => community.topics)
  @JoinColumn({ name: 'community_id' })
  community: Community;

  @Column({ type: 'int', comment: 'Topic ID' })
  @Index()
  topic_id: number;

  @ManyToOne(() => Topic)
  @JoinColumn({ name: 'topic_id' })
  topic: Topic;

  @Column({
    type: 'tinyint',
    width: 1,
    default: 1,
    comment: 'Association active status (0 = inactive, 1 = active)',
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
    comment: 'When community topic was created',
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
