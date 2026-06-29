import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';

@Entity('privacy_policy')
export class PrivacyPolicy {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    comment: 'Privacy policy slug',
  })
  @Index()
  slug: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    comment: 'Privacy policy title',
  })
  title: string;

  @Column({
    type: 'text',
    nullable: false,
    comment: 'Privacy policy content (HTML format)',
  })
  content: string;

  @Column({
    type: 'tinyint',
    width: 1,
    default: 1,
    comment: 'Privacy policy active status (0 = inactive, 1 = active)',
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
    comment: 'When privacy policy was created',
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
