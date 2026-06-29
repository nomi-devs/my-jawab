import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { StorageService } from './storage.service';
import { StorageType, MediaType } from '../entities/media.entity';
import { OptimizeImageDto } from '../dto/optimize-image.dto';

// Set ffmpeg path
if (ffmpegInstaller && ffmpegInstaller.path) {
  ffmpeg.setFfmpegPath(ffmpegInstaller.path);
}

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
}

export interface ProcessedImage {
  buffer: Buffer;
  metadata: ImageMetadata;
  thumbnail?: Buffer;
}

@Injectable()
export class MediaProcessingService {
  private readonly logger = new Logger(MediaProcessingService.name);
  private readonly maxImageSize: number;
  private readonly maxThumbnailSize: number;
  private readonly thumbnailQuality: number;

  constructor(
    private configService: ConfigService,
    private storageService: StorageService,
  ) {
    this.maxImageSize = this.configService.get<number>('MAX_IMAGE_SIZE', 2048);
    this.maxThumbnailSize = this.configService.get<number>('MAX_THUMBNAIL_SIZE', 300);
    this.thumbnailQuality = this.configService.get<number>('THUMBNAIL_QUALITY', 80);
  }

  async processImage(
    buffer: Buffer,
    options: OptimizeImageDto = {},
  ): Promise<ProcessedImage> {
    try {
      const image = sharp(buffer);
      const metadata = await image.metadata();

      if (!metadata.width || !metadata.height) {
        throw new BadRequestException('Invalid image format');
      }

      // Determine output format
      const outputFormat = options.format || this.getBestFormat(metadata.format);

      // Resize if needed
      let processedImage = image;
      if (options.width || options.height) {
        processedImage = image.resize(options.width, options.height, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      } else if (metadata.width > this.maxImageSize || metadata.height > this.maxImageSize) {
        processedImage = image.resize(this.maxImageSize, this.maxImageSize, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      }

      // Optimize based on format
      const quality = options.quality || this.thumbnailQuality;
      let optimizedBuffer: Buffer;

      switch (outputFormat) {
        case 'webp':
          optimizedBuffer = await processedImage
            .webp({ quality, effort: 6 })
            .toBuffer();
          break;
        case 'avif':
          optimizedBuffer = await processedImage
            .avif({ quality, effort: 4 })
            .toBuffer();
          break;
        case 'png':
          optimizedBuffer = await processedImage
            .png({ quality, compressionLevel: 9 })
            .toBuffer();
          break;
        case 'jpeg':
        default:
          optimizedBuffer = await processedImage
            .jpeg({ quality, mozjpeg: true })
            .toBuffer();
          break;
      }

      // Generate thumbnail
      const thumbnail = await this.generateThumbnail(buffer);

      // Get final metadata
      const finalMetadata = await sharp(optimizedBuffer).metadata();

      return {
        buffer: optimizedBuffer,
        metadata: {
          width: finalMetadata.width || metadata.width,
          height: finalMetadata.height || metadata.height,
          format: outputFormat,
          size: optimizedBuffer.length,
        },
        thumbnail,
      };
    } catch (error) {
      this.logger.error(`Image processing failed: ${error.message}`, error.stack);
      throw new BadRequestException(`Image processing failed: ${error.message}`);
    }
  }

  private async generateThumbnail(buffer: Buffer): Promise<Buffer> {
    try {
      return await sharp(buffer)
        .resize(this.maxThumbnailSize, this.maxThumbnailSize, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality: this.thumbnailQuality, mozjpeg: true })
        .toBuffer();
    } catch (error) {
      this.logger.warn(`Thumbnail generation failed: ${error.message}`);
      return buffer; // Return original if thumbnail fails
    }
  }

  async extractImageMetadata(buffer: Buffer): Promise<ImageMetadata> {
    try {
      const metadata = await sharp(buffer).metadata();
      return {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || 'unknown',
        size: buffer.length,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to extract image metadata: ${error.message}`);
    }
  }

  async saveProcessedImage(
    processedImage: ProcessedImage,
    originalFileName: string,
    folder: string = '',
    storageType: StorageType,
  ): Promise<{ optimizedPath: string; thumbnailPath: string }> {
    const ext = path.extname(originalFileName);
    const baseName = path.basename(originalFileName, ext);
    const timestamp = Date.now();

    // Save optimized image
    const optimizedFileName = `${baseName}_optimized_${timestamp}.${processedImage.metadata.format}`;
    const optimizedPath = folder
      ? `optimized/${folder}/${optimizedFileName}`
      : `optimized/${optimizedFileName}`;

    await this.storageService.uploadFile(
      {
        buffer: processedImage.buffer,
        originalname: optimizedFileName,
        mimetype: this.getMimeType(processedImage.metadata.format),
        size: processedImage.buffer.length,
        fieldname: 'file',
        encoding: '7bit',
        filename: optimizedFileName,
      } as Express.Multer.File,
      path.dirname(optimizedPath),
      storageType,
    );

    // Save thumbnail
    let thumbnailPath: string | null = null;
    if (processedImage.thumbnail) {
      const thumbnailFileName = `${baseName}_thumb_${timestamp}.jpg`;
      thumbnailPath = folder
        ? `thumbnails/${folder}/${thumbnailFileName}`
        : `thumbnails/${thumbnailFileName}`;

      await this.storageService.uploadFile(
        {
          buffer: processedImage.thumbnail,
          originalname: thumbnailFileName,
          mimetype: 'image/jpeg',
          size: processedImage.thumbnail.length,
          fieldname: 'file',
          encoding: '7bit',
          filename: thumbnailFileName,
        } as Express.Multer.File,
        path.dirname(thumbnailPath),
        storageType,
      );
    }

    return {
      optimizedPath,
      thumbnailPath: thumbnailPath || '',
    };
  }

  private getBestFormat(originalFormat?: string): 'jpeg' | 'png' | 'webp' | 'avif' {
    // Prefer modern formats for better compression
    const supportsWebP = this.configService.get<boolean>('SUPPORT_WEBP', true);
    const supportsAVIF = this.configService.get<boolean>('SUPPORT_AVIF', false);

    if (originalFormat === 'png' && supportsAVIF) {
      return 'avif';
    }
    if (supportsWebP) {
      return 'webp';
    }
    return originalFormat === 'png' ? 'png' : 'jpeg';
  }

  private getMimeType(format: string): string {
    const mimeTypes: Record<string, string> = {
      jpeg: 'image/jpeg',
      jpg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      avif: 'image/avif',
      gif: 'image/gif',
    };
    return mimeTypes[format.toLowerCase()] || 'image/jpeg';
  }

  async detectMediaType(mimeType: string, fileName: string): Promise<MediaType> {
    if (mimeType.startsWith('image/')) {
      return MediaType.IMAGE;
    }
    if (mimeType.startsWith('video/')) {
      return MediaType.VIDEO;
    }
    if (mimeType.startsWith('audio/')) {
      return MediaType.AUDIO;
    }
    if (
      mimeType.includes('pdf') ||
      mimeType.includes('document') ||
      mimeType.includes('text') ||
      fileName.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt)$/i)
    ) {
      return MediaType.DOCUMENT;
    }
    return MediaType.OTHER;
  }

  async validateFile(file: Express.Multer.File): Promise<void> {
    const maxFileSize = this.configService.get<number>('MAX_FILE_SIZE', 50 * 1024 * 1024); // 50MB
    const allowedMimeTypes = this.configService
      .get<string>('ALLOWED_MIME_TYPES', 'image/*,video/*,application/pdf')
      .split(',');

    if (file.size > maxFileSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${maxFileSize / 1024 / 1024}MB`,
      );
    }

    const isAllowed = allowedMimeTypes.some((pattern) => {
      if (pattern.includes('*')) {
        const baseType = pattern.split('/')[0];
        return file.mimetype.startsWith(baseType);
      }
      return file.mimetype === pattern.trim();
    });

    if (!isAllowed) {
      throw new BadRequestException(`File type ${file.mimetype} is not allowed`);
    }
  }

  /**
   * Generate thumbnail from video file
   */
  async generateVideoThumbnail(
    videoBuffer: Buffer,
    originalFileName: string,
    folder: string = '',
    storageType: StorageType,
  ): Promise<{ thumbnailPath: string; duration: number | null; width: number | null; height: number | null }> {
    const tempDir = os.tmpdir();
    const tempVideoPath = path.join(tempDir, `video_${Date.now()}_${Math.random().toString(36).substring(7)}.mp4`);
    const tempThumbnailPath = path.join(tempDir, `thumb_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`);

    try {
      // Write video buffer to temporary file
      await fs.writeFile(tempVideoPath, videoBuffer);

      // Extract video metadata and generate thumbnail
      const metadata = await this.extractVideoMetadata(tempVideoPath);
      
      // Generate thumbnail at 1 second (or 10% of duration if video is longer)
      const seekTime = metadata.duration > 10 ? metadata.duration * 0.1 : 1;

      await new Promise<void>((resolve, reject) => {
        ffmpeg(tempVideoPath)
          .seekInput(seekTime)
          .frames(1)
          .output(tempThumbnailPath)
          .size(`${this.maxThumbnailSize}x${this.maxThumbnailSize}`)
          .on('end', () => {
            this.logger.log(`Video thumbnail generated: ${tempThumbnailPath}`);
            resolve();
          })
          .on('error', (err) => {
            this.logger.error(`Video thumbnail generation failed: ${err.message}`);
            reject(err);
          })
          .run();
      });

      // Read thumbnail buffer
      const thumbnailBuffer = await fs.readFile(tempThumbnailPath);

      // Process thumbnail with sharp to ensure proper format and size
      const processedThumbnail = await sharp(thumbnailBuffer)
        .resize(this.maxThumbnailSize, this.maxThumbnailSize, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality: this.thumbnailQuality, mozjpeg: true })
        .toBuffer();

      // Save thumbnail to storage
      const ext = path.extname(originalFileName);
      const baseName = path.basename(originalFileName, ext);
      const timestamp = Date.now();
      const thumbnailFileName = `${baseName}_thumb_${timestamp}.jpg`;
      const thumbnailPath = folder
        ? `thumbnails/${folder}/${thumbnailFileName}`
        : `thumbnails/${thumbnailFileName}`;

      await this.storageService.uploadFile(
        {
          buffer: processedThumbnail,
          originalname: thumbnailFileName,
          mimetype: 'image/jpeg',
          size: processedThumbnail.length,
          fieldname: 'file',
          encoding: '7bit',
          filename: thumbnailFileName,
        } as Express.Multer.File,
        path.dirname(thumbnailPath),
        storageType,
      );

      return {
        thumbnailPath,
        duration: metadata.duration,
        width: metadata.width,
        height: metadata.height,
      };
    } catch (error) {
      this.logger.error(`Video thumbnail generation error: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to generate video thumbnail: ${error.message}`);
    } finally {
      // Clean up temporary files
      try {
        await fs.unlink(tempVideoPath).catch(() => {});
        await fs.unlink(tempThumbnailPath).catch(() => {});
      } catch (error) {
        this.logger.warn(`Failed to clean up temp files: ${error.message}`);
      }
    }
  }

  /**
   * Extract video metadata (duration, dimensions)
   */
  private async extractVideoMetadata(videoPath: string): Promise<{
    duration: number;
    width: number | null;
    height: number | null;
  }> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          reject(new BadRequestException(`Failed to extract video metadata: ${err.message}`));
          return;
        }

        const videoStream = metadata.streams.find((stream) => stream.codec_type === 'video');
        const duration = metadata.format.duration ? Math.floor(metadata.format.duration) : 0;

        resolve({
          duration,
          width: videoStream?.width || null,
          height: videoStream?.height || null,
        });
      });
    });
  }
}

