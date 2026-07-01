import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum TemplateType {
  EMAIL = 'email',
  PDF = 'pdf',
  HTML = 'html',
  SMS = 'sms',
}

export enum TemplateCategory {
  VERIFICATION = 'verification',
  PASSWORD_RESET = 'password_reset',
  WELCOME = 'welcome',
  NOTIFICATION = 'notification',
  INVOICE = 'invoice',
  REPORT = 'report',
  CUSTOM = 'custom',
}

@Entity('templates')
export class Template {
  @PrimaryGeneratedColumn({ comment: 'Unique template ID' })
  id: number;

  @Column({ type: 'varchar', length: 255, comment: 'Template name' })
  @Index()
  name: string;

  @Column({
    type: 'varchar',
    length: 255,
    unique: true,
    comment: 'Template slug/identifier',
  })
  slug: string;

  @Column({
    type: 'enum',
    enum: TemplateType,
    comment: 'Template type (email, pdf, html, sms)',
  })
  @Index()
  type: TemplateType;

  @Column({
    type: 'enum',
    enum: TemplateCategory,
    default: TemplateCategory.CUSTOM,
    comment: 'Template category',
  })
  @Index()
  category: TemplateCategory;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: 'Template subject (for emails)',
  })
  subject: string | null;

  @Column({ type: 'text', comment: 'Template HTML content' })
  content: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Plain text version (for emails)',
  })
  text_content: string | null;

  @Column({
    type: 'json',
    nullable: true,
    comment: 'Template variables/placeholders schema',
  })
  variables: Record<string, any> | null;

  @Column({ type: 'json', nullable: true, comment: 'Default template data' })
  default_data: Record<string, any> | null;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Template description',
  })
  description: string | null;

  @Column({ type: 'boolean', default: true, comment: 'Is template active' })
  @Index()
  is_active: boolean;

  @Column({ type: 'int', nullable: true, comment: 'Created by user ID' })
  created_by: number | null;

  @Column({ type: 'int', nullable: true, comment: 'Updated by user ID' })
  updated_by: number | null;

  @CreateDateColumn({
    type: 'timestamp',
    comment: 'Template creation timestamp',
  })
  created_at: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    comment: 'Template last update timestamp',
  })
  updated_at: Date;
}
