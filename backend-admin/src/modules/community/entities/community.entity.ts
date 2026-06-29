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
import { CommunityTopic } from './community-topic.entity';
import { CommunityUser } from './community-user.entity';

@Entity('communities')
// Note: @Unique removed - slugs now include ID hash to ensure uniqueness
export class Community {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    comment: 'Community slug',
  })
  @Index()
  community_slug: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    comment: 'Community name',
  })
  @Index()
  community_name: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Community description',
  })
  community_description: string | null;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: 'Community image URL',
  })
  community_image: string | null;

  @Column({
    type: 'tinyint',
    width: 1,
    default: 1,
    comment: 'Community active status (0 = inactive, 1 = active)',
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
    comment: 'When community was created',
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

  @OneToMany(() => CommunityTopic, (communityTopic) => communityTopic.community)
  topics: CommunityTopic[];

  @OneToMany(() => CommunityUser, (communityUser) => communityUser.community)
  members: CommunityUser[];
}

