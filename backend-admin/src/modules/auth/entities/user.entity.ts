import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { UserVerification } from './user-verification.entity';
import { UserPasswordReset } from './user-password-reset.entity';
import { UserDevice } from './user-device.entity';

export enum UserRole {
  ADMIN = 'admin',
  SUB_ADMIN = 'sub_admin',
  PRO_USER = 'pro_user',
  USER = 'user',
}

export enum AuthType {
  EMAIL = 'email',
  PHONE = 'phone',
  GOOGLE = 'google',
  APPLE = 'apple',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
    comment: 'User role in the system',
  })
  @Index()
  role: UserRole;

  @Column({ type: 'varchar', length: 255, comment: 'Unique username for login' })
  @Index()
  username: string;

  @Column({ type: 'varchar', length: 255, comment: 'User email address' })
  @Index()
  email: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Hashed password stored securely',
  })
  password_hash: string | null;

  @Column({
    type: 'enum',
    enum: AuthType,
    default: AuthType.EMAIL,
    comment: 'Authentication method used by the user',
  })
  @Index()
  auth_type: AuthType;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: 'Access token for auth sessions',
  })
  access_token: string | null;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: 'Refresh token for renewing sessions',
  })
  refresh_token: string | null;

  @Column({
    type: 'int',
    default: 3600,
    comment: 'Token expiry time in seconds',
  })
  expires_in: number;

  @Column({
    type: 'tinyint',
    width: 1,
    default: 0,
    comment: 'User active status (0 = inactive, 1 = active)',
  })
  @Index()
  is_active: boolean;

  @Column({
    type: 'tinyint',
    width: 1,
    default: 0,
    comment: 'User verified status (0 = not verified, 1 = verified)',
  })
  @Index()
  is_verified: boolean;

  @Column({
    type: 'tinyint',
    width: 1,
    default: 0,
    comment: 'Soft delete flag (0 = active, 1 = deleted)',
  })
  @Index()
  is_deleted: boolean;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Timestamp when user was soft-deleted',
  })
  deleted_at: Date | null;

  @Column({ type: 'int', nullable: true, comment: 'Created by user ID' })
  created_by: number | null;

  @Column({ type: 'int', nullable: true, comment: 'Updated by user ID' })
  updated_by: number | null;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    comment: 'When account was created',
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

  @OneToMany(() => UserVerification, (verification) => verification.user)
  verifications: UserVerification[];

  @OneToMany(() => UserPasswordReset, (reset) => reset.user)
  password_resets: UserPasswordReset[];

  @OneToMany(() => UserDevice, (device) => device.user)
  devices: UserDevice[];
}

