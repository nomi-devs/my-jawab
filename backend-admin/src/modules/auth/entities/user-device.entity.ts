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
import { User } from './user.entity';

export enum DeviceType {
  ANDROID = 'android',
  IOS = 'ios',
  WEB = 'web',
}

@Entity('user_devices')
@Unique(['user_id', 'device_id'])
export class UserDevice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', comment: 'User ID' })
  @Index()
  user_id: number;

  @ManyToOne(() => User, (user) => user.devices)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'varchar',
    length: 255,
    comment: 'Device ID',
  })
  @Index()
  device_id: string;

  @Column({
    type: 'enum',
    enum: DeviceType,
    comment: 'Device type',
  })
  @Index()
  device_type: DeviceType;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: 'Device token for push notifications',
  })
  device_token: string | null;

  @Column({
    type: 'tinyint',
    width: 1,
    default: 1,
    comment: 'Device active status (0 = inactive, 1 = active)',
  })
  @Index()
  is_active: boolean;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Last active timestamp',
  })
  last_active_at: Date | null;

  @Column({ type: 'int', nullable: true, comment: 'Created by user ID' })
  created_by: number | null;

  @Column({ type: 'int', nullable: true, comment: 'Updated by user ID' })
  updated_by: number | null;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    comment: 'When device was created',
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

