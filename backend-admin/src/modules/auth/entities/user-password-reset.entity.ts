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
import { User } from './user.entity';

@Entity('user_password_reset')
export class UserPasswordReset {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', comment: 'User ID' })
  @Index()
  user_id: number;

  @ManyToOne(() => User, (user) => user.password_resets)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Phone number',
  })
  @Index()
  phone_number: string | null;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Email',
  })
  @Index()
  email: string | null;

  @Column({
    type: 'varchar',
    length: 255,
    comment: 'Reset code',
  })
  @Index()
  reset_code: string;

  @Column({
    type: 'timestamp',
    comment: 'Reset code expiration time',
  })
  @Index()
  expires_at: Date;

  @Column({
    type: 'tinyint',
    width: 1,
    default: 0,
    comment: 'Reset code used status (0 = not used, 1 = used)',
  })
  @Index()
  is_used: boolean;

  @Column({ type: 'int', nullable: true, comment: 'Created by user ID' })
  created_by: number | null;

  @Column({ type: 'int', nullable: true, comment: 'Updated by user ID' })
  updated_by: number | null;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    comment: 'When reset code was created',
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
