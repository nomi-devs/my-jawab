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

export class MediaResponseDto {
  id: number;
  original_filename: string;
  filename: string;
  file_path: string;
  mime_type: string;
  file_size: number;
  file_size_formatted: string;
  media_type: MediaType;
  storage_type: StorageType;
  status: MediaStatus;
  width: number | null;
  height: number | null;
  duration: number | null;
  thumbnail_path: string | null;
  optimized_path: string | null;
  uuid: string;
  folder: string | null;
  uploaded_by: number | null;
  download_count: number;
  view_count: number;
  is_active: boolean;
  is_public: boolean;
  created_at: Date;
  updated_at: Date;
}
