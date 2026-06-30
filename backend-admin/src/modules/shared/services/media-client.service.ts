import { Injectable } from '@nestjs/common';
import { MediaService } from '../../media/media.service';
import { MediaResponseDto } from '../../media/dto/media-response.dto';

export interface UploadFileOptions {
  folder?: string;
  media_type?: string;
  storage_type?: string;
  is_public?: boolean;
  optimize?: boolean;
  userId?: number;
}

/**
 * Thin wrapper around MediaService.
 * All callers (post, user, community, banner, admin services) remain unchanged.
 */
@Injectable()
export class MediaClientService {
  constructor(private readonly mediaService: MediaService) {}

  async uploadFile(
    file: Express.Multer.File,
    options: UploadFileOptions = {},
  ): Promise<MediaResponseDto> {
    const { userId, ...uploadDto } = options;
    return this.mediaService.uploadFile(file, uploadDto as any, userId);
  }

  async getMediaById(id: number, userId?: number): Promise<MediaResponseDto> {
    return this.mediaService.getMediaById(id, userId);
  }

  async getMediaByUuid(uuid: string, userId?: number): Promise<MediaResponseDto> {
    return this.mediaService.getMediaByUuid(uuid, userId);
  }

  async getFileUrl(id: number, optimized: boolean = false, expiresIn: number = 3600): Promise<string> {
    return this.mediaService.getFileUrl(id, optimized, expiresIn);
  }

  async deleteMedia(id: number, userId?: number): Promise<void> {
    await this.mediaService.deleteMedia(id, userId);
  }

  async updateMedia(
    id: number,
    updateData: { folder?: string; is_public?: boolean; is_active?: boolean },
    userId?: number,
  ): Promise<MediaResponseDto> {
    return this.mediaService.updateMedia(id, updateData, userId);
  }

  async optimizeImage(
    id: number,
    options: { width?: number; height?: number; quality?: number; format?: 'webp' | 'avif' | 'jpeg' | 'png' } = {},
    userId?: number,
  ): Promise<MediaResponseDto> {
    return this.mediaService.optimizeImage(id, options as any, userId);
  }

  buildFileUrl(filePath: string): string {
    return this.mediaService.buildFileUrl(filePath);
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}
