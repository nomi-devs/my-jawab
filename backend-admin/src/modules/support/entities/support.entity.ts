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

@Entity('support')
export class Support {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    comment: 'Support email',
  })
  email: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: false,
    comment: 'Support phone',
  })
  phone: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: false,
    comment: 'Support whatsapp',
  })
  whatsapp: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    comment: 'Support website',
  })
  website: string;

  @Column({
    type: 'text',
    nullable: false,
    comment: 'Support address',
  })
  address: string;

  @Column({
    type: 'tinyint',
    width: 1,
    default: 1,
    comment: 'Support active status (0 = inactive, 1 = active)',
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
    comment: 'When record was created',
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
