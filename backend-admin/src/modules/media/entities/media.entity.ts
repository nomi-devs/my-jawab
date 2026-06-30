import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  DOCUMENT = 'document',
  AUDIO = 'audio',
  OTHER = 'other',
}

export enum StorageType {
  LOCAL = 'local',
  S3 = 's3',
  CLOUDINARY = 'cloudinary',
}

export enum MediaStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  READY = 'ready',
  FAILED = 'failed',
}

@Entity('media')
export class Media {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, comment: 'Original filename' })
  original_filename: string;

  @Column({ type: 'varchar', length: 255, comment: 'Stored filename' })
  @Index()
  filename: string;

  @Column({ type: 'varchar', length: 500, comment: 'File path or URL' })
  file_path: string;

  @Column({ type: 'varchar', length: 100, comment: 'MIME type' })
  mime_type: string;

  @Column({ type: 'bigint', comment: 'File size in bytes' })
  file_size: number;

  @Column({
    type: 'enum',
    enum: MediaType,
    comment: 'Media type category',
  })
  @Index()
  media_type: MediaType;

  @Column({
    type: 'enum',
    enum: StorageType,
    default: StorageType.LOCAL,
    comment: 'Storage provider',
  })
  storage_type: StorageType;

  @Column({
    type: 'enum',
    enum: MediaStatus,
    default: MediaStatus.PENDING,
    comment: 'Processing status',
  })
  @Index()
  status: MediaStatus;

  @Column({ type: 'int', nullable: true, comment: 'Image width (pixels)' })
  width: number | null;

  @Column({ type: 'int', nullable: true, comment: 'Image height (pixels)' })
  height: number | null;

  @Column({ type: 'int', nullable: true, comment: 'Video duration (seconds)' })
  duration: number | null;

  @Column({ type: 'varchar', length: 500, nullable: true, comment: 'Thumbnail path' })
  thumbnail_path: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, comment: 'Optimized version path' })
  optimized_path: string | null;

  @Column({ type: 'varchar', length: 36, unique: true, comment: 'Unique identifier' })
  uuid: string;

  @Column({ type: 'varchar', length: 64, nullable: true, comment: 'File hash (MD5/SHA256)' })
  @Index()
  file_hash: string | null;

  @Column({ type: 'int', nullable: true, comment: 'User ID who uploaded' })
  @Index()
  uploaded_by: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: 'Folder/category' })
  @Index()
  folder: string | null;

  @Column({ type: 'text', nullable: true, comment: 'Additional metadata (JSON)' })
  metadata: string | null;

  @Column({ type: 'int', default: 0, comment: 'Download count' })
  download_count: number;

  @Column({ type: 'int', default: 0, comment: 'View count' })
  view_count: number;

  @Column({ type: 'tinyint', width: 1, default: 1, comment: 'Is active' })
  @Index()
  is_active: boolean;

  @Column({ type: 'tinyint', width: 1, default: 0, comment: 'Is public' })
  @Index()
  is_public: boolean;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    comment: 'When media was uploaded',
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
}
