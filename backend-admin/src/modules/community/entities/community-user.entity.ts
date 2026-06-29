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
import { User } from '../../auth/entities/user.entity';

export enum CommunityUserRole {
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  MEMBER = 'member',
}

@Entity('community_users')
@Unique(['community_id', 'user_id'])
export class CommunityUser {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', comment: 'Community ID' })
  @Index()
  community_id: number;

  @ManyToOne(() => Community, (community) => community.members)
  @JoinColumn({ name: 'community_id' })
  community: Community;

  @Column({ type: 'int', comment: 'User ID' })
  @Index()
  user_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: CommunityUserRole,
    default: CommunityUserRole.MEMBER,
    comment: 'User role in community',
  })
  @Index()
  role: CommunityUserRole;

  @Column({
    type: 'tinyint',
    width: 1,
    default: 1,
    comment: 'Membership active status (0 = inactive, 1 = active)',
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
    comment: 'When community user was created',
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

