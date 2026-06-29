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

export enum BannerType {
  PROMOTION = 'promotion',
  AD = 'ad',
  ANNOUNCEMENT = 'announcement',
}

@Entity('banners')
export class Banner {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: 'Banner title (optional)' })
  banner_title: string | null;

  @Column({ type: 'text', nullable: true, comment: 'Banner text/description (optional)' })
  banner_description: string | null;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: false,
    comment: 'Banner image URL (required, uploaded via media service)',
  })
  banner_image: string;

  @Column({ type: 'varchar', length: 500, nullable: true, comment: 'Optional URL/deep-link opened when banner tapped' })
  banner_link: string | null;

  @Column({
    type: 'enum',
    enum: BannerType,
    default: BannerType.PROMOTION,
    comment: 'Banner type',
  })
  @Index()
  banner_type: BannerType;

  // ─── Targeting Conditions (CSV, NULL = all) ───────────────────
  @Column({ type: 'varchar', length: 500, nullable: true, comment: 'CSV ISO country codes to show banner' })
  target_countries: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, comment: 'CSV topic IDs (user interests) to show banner' })
  target_topic_ids: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, comment: 'CSV subscription IDs to show banner' })
  target_subscription_ids: string | null;

  // ─── Exclusion Conditions (CSV, NULL = no exclusions) ─────────
  @Column({ type: 'varchar', length: 500, nullable: true, comment: 'CSV ISO country codes where banner is HIDDEN' })
  excluded_countries: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, comment: 'CSV topic IDs where banner is HIDDEN' })
  excluded_topic_ids: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, comment: 'CSV subscription IDs where banner is HIDDEN' })
  excluded_subscription_ids: string | null;

  // ─── Scheduling ───────────────────────────────────────────────
  @Column({ type: 'timestamp', nullable: true, comment: 'Banner becomes visible from this date' })
  valid_from: Date | null;

  @Column({ type: 'timestamp', nullable: true, comment: 'Banner stops showing after this date' })
  valid_until: Date | null;

  // ─── Display ──────────────────────────────────────────────────
  @Column({ type: 'int', default: 0, comment: 'Order for showing multiple banners (higher = shown first)' })
  @Index()
  display_order: number;

  @Column({ type: 'tinyint', width: 1, default: 1, comment: 'Active status (0 = inactive, 1 = active)' })
  @Index()
  is_active: boolean;

  // ─── Audit ────────────────────────────────────────────────────
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
    comment: 'When banner was created',
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
