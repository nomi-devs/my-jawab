import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Media, MediaType, MediaStatus, StorageType } from './entities/media.entity';
import { StorageService } from './services/storage.service';
import { MediaProcessingService } from './services/media-processing.service';
import { ListMediaDto } from './dto/list-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { UploadFileDto } from './dto/upload-file.dto';
import { MediaResponseDto } from './dto/media-response.dto';
import { OptimizeImageDto } from './dto/optimize-image.dto';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly DEFAULT_FOLDER = 'other';

  constructor(
    @InjectRepository(Media)
    private mediaRepository: Repository<Media>,
    private storageService: StorageService,
    private mediaProcessingService: MediaProcessingService,
  ) {}

  async uploadFile(
    file: Express.Multer.File,
    uploadDto: UploadFileDto,
    userId?: number,
  ): Promise<MediaResponseDto> {
    // Validate file buffer exists
    if (!file.buffer) {
      throw new BadRequestException(
        'File buffer is missing. Please ensure file is uploaded correctly.',
      );
    }

    // Validate file
    await this.mediaProcessingService.validateFile(file);

    // Detect media type
    const mediaType =
      uploadDto.media_type ||
      (await this.mediaProcessingService.detectMediaType(file.mimetype, file.originalname));

    // Determine storage type
    const storageType = uploadDto.storage_type || this.storageService.getStorageType();

    // Use default folder if not provided
    const folder = uploadDto.folder || this.DEFAULT_FOLDER;

    // Upload file
    const uploadResult = await this.storageService.uploadFile(
      file,
      folder,
      storageType,
    );

    // Process image if needed
    let optimizedPath: string | null = null;
    let thumbnailPath: string | null = null;
    let width: number | null = null;
    let height: number | null = null;
    let duration: number | null = null;

    if (mediaType === MediaType.IMAGE && uploadDto.optimize !== false) {
      try {
        const processedImage = await this.mediaProcessingService.processImage(file.buffer);
        width = processedImage.metadata.width;
        height = processedImage.metadata.height;

        const savedPaths = await this.mediaProcessingService.saveProcessedImage(
          processedImage,
          file.originalname,
          folder,
          storageType,
        );
        optimizedPath = savedPaths.optimizedPath;
        thumbnailPath = savedPaths.thumbnailPath;
      } catch (error) {
        this.logger.warn(`Image optimization failed: ${error.message}`);
        // Continue without optimization
        const metadata = await this.mediaProcessingService.extractImageMetadata(file.buffer);
        width = metadata.width;
        height = metadata.height;
      }
    } else if (mediaType === MediaType.IMAGE) {
      // Extract metadata without optimization
      const metadata = await this.mediaProcessingService.extractImageMetadata(file.buffer);
      width = metadata.width;
      height = metadata.height;
    } else if (mediaType === MediaType.VIDEO) {
      // Generate thumbnail for video
      try {
        const videoThumbnail = await this.mediaProcessingService.generateVideoThumbnail(
          file.buffer,
          file.originalname,
          folder,
          storageType,
        );
        thumbnailPath = videoThumbnail.thumbnailPath;
        duration = videoThumbnail.duration;
        width = videoThumbnail.width;
        height = videoThumbnail.height;
        this.logger.log(`Video thumbnail generated: ${thumbnailPath}`);
      } catch (error) {
        this.logger.warn(`Video thumbnail generation failed: ${error.message}`);
        // Continue without thumbnail
      }
    }

    // Create media record
    const media = this.mediaRepository.create({
      original_filename: file.originalname,
      filename: uploadResult.fileName,
      file_path: uploadResult.filePath,
      mime_type: file.mimetype,
      file_size: file.size,
      media_type: mediaType,
      storage_type: storageType,
      status: MediaStatus.READY,
      width,
      height,
      duration,
      thumbnail_path: thumbnailPath,
      optimized_path: optimizedPath,
      uuid: uuidv4(),
      file_hash: uploadResult.fileHash,
      uploaded_by: userId || null,
      folder: folder,
      is_public: uploadDto.is_public ?? false,
      is_active: true,
    });

    const savedMedia = await this.mediaRepository.save(media);
    this.logger.log(`Media uploaded: ${savedMedia.uuid}`);

    return MediaResponseDto.fromEntity(savedMedia);
  }

  async listMedia(listDto: ListMediaDto, userId?: number): Promise<{
    data: MediaResponseDto[];
    meta: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  }> {
    const { page = 1, limit = 20, search, media_type, status, folder, sort_by = 'created_at', sort_order = 'DESC' } = listDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.mediaRepository.createQueryBuilder('media');

    // Filter by user if provided
    if (userId) {
      queryBuilder.where('media.uploaded_by = :userId', { userId });
    }

    // Apply filters
    if (search) {
      queryBuilder.andWhere(
        '(media.original_filename LIKE :search OR media.filename LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (media_type) {
      queryBuilder.andWhere('media.media_type = :media_type', { media_type });
    }

    if (status) {
      queryBuilder.andWhere('media.status = :status', { status });
    }

    if (folder) {
      queryBuilder.andWhere('media.folder = :folder', { folder });
    }

    // Only show active media
    queryBuilder.andWhere('media.is_active = :is_active', { is_active: true });

    // Apply sorting
    queryBuilder.orderBy(`media.${sort_by}`, sort_order);

    // Apply pagination
    queryBuilder.skip(skip).take(limit);

    const [mediaList, total] = await queryBuilder.getManyAndCount();

    return {
      data: mediaList.map((media) => MediaResponseDto.fromEntity(media)),
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  async getMediaById(id: number, userId?: number): Promise<MediaResponseDto> {
    const media = await this.mediaRepository.findOne({
      where: { id, is_active: true },
    });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    // Check access
    if (!media.is_public && userId && media.uploaded_by !== userId) {
      throw new NotFoundException('Media not found');
    }

    // Increment view count
    media.view_count += 1;
    await this.mediaRepository.save(media);

    return MediaResponseDto.fromEntity(media);
  }

  async getMediaByUuid(uuid: string, userId?: number): Promise<MediaResponseDto> {
    const media = await this.mediaRepository.findOne({
      where: { uuid, is_active: true },
    });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    // Check access
    if (!media.is_public && userId && media.uploaded_by !== userId) {
      throw new NotFoundException('Media not found');
    }

    // Increment view count
    media.view_count += 1;
    await this.mediaRepository.save(media);

    return MediaResponseDto.fromEntity(media);
  }

  async updateMedia(
    id: number,
    updateDto: UpdateMediaDto,
    userId?: number,
  ): Promise<MediaResponseDto> {
    const media = await this.mediaRepository.findOne({
      where: { id, is_active: true },
    });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    // Check ownership
    if (userId && media.uploaded_by !== userId) {
      throw new BadRequestException('You do not have permission to update this media');
    }

    if (updateDto.folder !== undefined) {
      media.folder = updateDto.folder;
    }
    if (updateDto.is_public !== undefined) {
      media.is_public = updateDto.is_public;
    }
    if (updateDto.is_active !== undefined) {
      media.is_active = updateDto.is_active;
    }

    const updatedMedia = await this.mediaRepository.save(media);
    return MediaResponseDto.fromEntity(updatedMedia);
  }

  async deleteMedia(id: number, userId?: number): Promise<{ message: string }> {
    const media = await this.mediaRepository.findOne({
      where: { id },
    });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    // Check ownership
    if (userId && media.uploaded_by !== userId) {
      throw new BadRequestException('You do not have permission to delete this media');
    }

    // Delete files from storage
    try {
      await this.storageService.deleteFile(media.file_path, media.storage_type);
      if (media.optimized_path) {
        await this.storageService.deleteFile(media.optimized_path, media.storage_type);
      }
      if (media.thumbnail_path) {
        await this.storageService.deleteFile(media.thumbnail_path, media.storage_type);
      }
    } catch (error) {
      this.logger.warn(`Failed to delete files for media ${id}: ${error.message}`);
    }

    // Soft delete (mark as inactive)
    media.is_active = false;
    await this.mediaRepository.save(media);

    return { message: 'Media deleted successfully' };
  }

  async optimizeImage(
    id: number,
    optimizeDto: OptimizeImageDto,
    userId?: number,
  ): Promise<MediaResponseDto> {
    const media = await this.mediaRepository.findOne({
      where: { id, is_active: true },
    });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    if (media.media_type !== MediaType.IMAGE) {
      throw new BadRequestException('Only images can be optimized');
    }

    // Check ownership
    if (userId && media.uploaded_by !== userId) {
      throw new BadRequestException('You do not have permission to optimize this media');
    }

    // Read original file
    const fileBuffer = await this.storageService.readFile(media.file_path, media.storage_type);

    // Process image
    const processedImage = await this.mediaProcessingService.processImage(fileBuffer, optimizeDto);

    // Save optimized version (use default folder if not set)
    const folder = media.folder || this.DEFAULT_FOLDER;
    const savedPaths = await this.mediaProcessingService.saveProcessedImage(
      processedImage,
      media.original_filename,
      folder,
      media.storage_type,
    );

    // Update media record
    media.optimized_path = savedPaths.optimizedPath;
    if (savedPaths.thumbnailPath) {
      media.thumbnail_path = savedPaths.thumbnailPath;
    }
    media.width = processedImage.metadata.width;
    media.height = processedImage.metadata.height;

    const updatedMedia = await this.mediaRepository.save(media);
    return MediaResponseDto.fromEntity(updatedMedia);
  }

  async getFileUrl(id: number, optimized: boolean = false, expiresIn: number = 3600): Promise<string> {
    const media = await this.mediaRepository.findOne({
      where: { id, is_active: true },
    });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    const filePath = optimized && media.optimized_path ? media.optimized_path : media.file_path;
    return this.storageService.getFileUrl(filePath, media.storage_type, expiresIn);
  }

  async getFileBuffer(id: number, optimized: boolean = false): Promise<Buffer> {
    const media = await this.mediaRepository.findOne({
      where: { id, is_active: true },
    });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    const filePath = optimized && media.optimized_path ? media.optimized_path : media.file_path;
    return this.storageService.readFile(filePath, media.storage_type);
  }

  async findMediaByPath(filePath: string): Promise<Media | null> {
    const media = await this.mediaRepository.findOne({
      where: [
        { file_path: filePath, is_active: true },
        { optimized_path: filePath, is_active: true },
        { thumbnail_path: filePath, is_active: true },
      ],
    });

    return media;
  }

  async getFileBufferByPath(filePath: string, storageType: StorageType): Promise<Buffer> {
    return this.storageService.readFile(filePath, storageType);
  }

  async incrementDownloadCount(id: number): Promise<void> {
    const media = await this.mediaRepository.findOne({
      where: { id },
    });

    if (media) {
      media.download_count += 1;
      await this.mediaRepository.save(media);
    }
  }
}

