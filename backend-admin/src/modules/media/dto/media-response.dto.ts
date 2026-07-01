import { MediaType, StorageType, MediaStatus } from '../entities/media.entity';

export class MediaResponseDto {
  id!: number;
  original_filename!: string;
  filename!: string;
  file_path!: string;
  mime_type!: string;
  file_size!: number;
  file_size_formatted!: string;
  media_type!: MediaType;
  storage_type!: StorageType;
  status!: MediaStatus;
  width!: number | null;
  height!: number | null;
  duration!: number | null;
  thumbnail_path!: string | null;
  optimized_path!: string | null;
  uuid!: string;
  folder!: string | null;
  uploaded_by!: number | null;
  download_count!: number;
  view_count!: number;
  is_active!: boolean;
  is_public!: boolean;
  created_at!: Date;
  updated_at!: Date;

  private static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  static fromEntity(media: any): MediaResponseDto {
    return {
      id: media.id,
      original_filename: media.original_filename,
      filename: media.filename,
      file_path: media.file_path,
      mime_type: media.mime_type,
      file_size: media.file_size,
      file_size_formatted: this.formatFileSize(media.file_size),
      media_type: media.media_type,
      storage_type: media.storage_type,
      status: media.status,
      width: media.width,
      height: media.height,
      duration: media.duration,
      thumbnail_path: media.thumbnail_path,
      optimized_path: media.optimized_path,
      uuid: media.uuid,
      folder: media.folder,
      uploaded_by: media.uploaded_by,
      download_count: media.download_count,
      view_count: media.view_count,
      is_active: media.is_active,
      is_public: media.is_public,
      created_at: media.created_at,
      updated_at: media.updated_at,
    };
  }
}
