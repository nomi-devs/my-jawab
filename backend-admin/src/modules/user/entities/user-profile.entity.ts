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
import { User } from '../../auth/entities/user.entity';

export enum ProfileGender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

@Entity('user_profile')
@Unique(['user_id'])
export class UserProfile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', comment: 'User ID' })
  user_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Full name',
  })
  full_name: string | null;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: 'Profile picture URL',
  })
  profile_picture: string | null;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: 'Profile background URL',
  })
  profile_background: string | null;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'User tagline or profile tagline',
  })
  tagline: string | null;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Profile bio',
  })
  profile_bio: string | null;

  @Column({
    type: 'enum',
    enum: ProfileGender,
    nullable: true,
    comment: 'Profile gender',
  })
  profile_gender: ProfileGender | null;

  @Column({
    type: 'date',
    nullable: true,
    comment: 'Profile birthday',
  })
  profile_birthday: Date | null;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: 'Profile website',
  })
  profile_website: string | null;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Profile location',
  })
  profile_location: string | null;

  @Column({ type: 'int', nullable: true, comment: 'Created by user ID' })
  created_by: number | null;

  @Column({ type: 'int', nullable: true, comment: 'Updated by user ID' })
  updated_by: number | null;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    comment: 'When profile was created',
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

