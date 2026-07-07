import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { StorageType } from '@prisma/client';
import { StorageService } from './services/storage.service';
import { MediaProcessingService } from './services/media-processing.service';
import { ListMediaDto } from './dto/list-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { UploadFileDto } from './dto/upload-file.dto';
import { MediaResponseDto } from './dto/media-response.dto';
import { OptimizeImageDto } from './dto/optimize-image.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly DEFAULT_FOLDER = 'other';

  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    private mediaProcessingService: MediaProcessingService,
    private configService: ConfigService,
  ) { }

  async uploadFile(
    file: Express.Multer.File,
    uploadDto: UploadFileDto,
    userId?: number,
  ): Promise<MediaResponseDto> {
    if (!file.buffer) {
      throw new BadRequestException('File buffer is missing.');
    }

    await this.mediaProcessingService.validateFile(file);

    const mediaType =
      uploadDto.media_type ||
      (await this.mediaProcessingService.detectMediaType(
        file.mimetype,
        file.originalname,
      ));

    const storageType =
      uploadDto.storage_type || this.storageService.getStorageType();
    const folder = uploadDto.folder || this.DEFAULT_FOLDER;

    const uploadResult = await this.storageService.uploadFile(
      file,
      folder,
      storageType,
    );

    let optimizedPath: string | null = null;
    let thumbnailPath: string | null = null;
    let width: number | null = null;
    let height: number | null = null;
    let duration: number | null = null;

    if (mediaType === 'image' && uploadDto.optimize !== false) {
      try {
        const processedImage = await this.mediaProcessingService.processImage(
          file.buffer,
        );
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
      } catch (error: any) {
        this.logger.warn(`Image optimization failed: ${error.message}`);
        const metadata = await this.mediaProcessingService.extractImageMetadata(
          file.buffer,
        );
        width = metadata.width;
        height = metadata.height;
      }
    } else if (mediaType === 'image') {
      const metadata = await this.mediaProcessingService.extractImageMetadata(
        file.buffer,
      );
      width = metadata.width;
      height = metadata.height;
    } else if (mediaType === 'video') {
      try {
        const videoThumbnail =
          await this.mediaProcessingService.generateVideoThumbnail(
            file.buffer,
            file.originalname,
            folder,
            storageType,
          );
        thumbnailPath = videoThumbnail.thumbnailPath;
        duration = videoThumbnail.duration;
        width = videoThumbnail.width;
        height = videoThumbnail.height;
      } catch (error: any) {
        this.logger.warn(`Video thumbnail generation failed: ${error.message}`);
      }
    }

    const savedMedia = await this.prisma.media.create({
      data: {
        original_filename: file.originalname,
        filename: uploadResult.fileName,
        file_path: uploadResult.filePath,
        mime_type: file.mimetype,
        file_size: BigInt(file.size),
        media_type: mediaType,
        storage_type: storageType,
        status: 'ready',
        width,
        height,
        duration,
        thumbnail_path: thumbnailPath,
        optimized_path: optimizedPath,
        uuid: uuidv4(),
        file_hash: uploadResult.fileHash,
        uploaded_by: userId || null,
        folder,
        is_public: uploadDto.is_public ?? false,
        is_active: true,
      },
    });

    this.logger.log(`Media uploaded: ${savedMedia.uuid}`);
    return MediaResponseDto.fromEntity(savedMedia);
  }

  async listMedia(listDto: ListMediaDto, userId?: number) {
    const {
      page = 1,
      limit = 20,
      search,
      media_type,
      status,
      folder,
      sort_by = 'created_at',
      sort_order = 'DESC',
    } = listDto;
    const skip = (page - 1) * limit;

    const where: any = { is_active: true };

    if (userId) {
      where.uploaded_by = userId;
    }
    if (search) {
      where.OR = [
        { original_filename: { contains: search } },
        { filename: { contains: search } },
      ];
    }
    if (media_type) where.media_type = media_type;
    if (status) where.status = status;
    if (folder) where.folder = folder;

    const orderBy: any = { [sort_by]: sort_order.toLowerCase() as any };

    const [mediaList, total] = await Promise.all([
      this.prisma.media.findMany({ where, orderBy, skip, take: limit }),
      this.prisma.media.count({ where }),
    ]);

    return {
      data: mediaList.map((m) => MediaResponseDto.fromEntity(m)),
      meta: { total, page, limit, total_pages: Math.ceil(total / limit) },
    };
  }

  async getMediaById(id: number, userId?: number): Promise<MediaResponseDto> {
    const media = await this.prisma.media.findFirst({
      where: { id, is_active: true },
    });
    if (!media) throw new NotFoundException('Media not found');
    if (!media.is_public && userId && media.uploaded_by !== userId) {
      throw new NotFoundException('Media not found');
    }
    const updated = await this.prisma.media.update({
      where: { id },
      data: { view_count: { increment: 1 } },
    });
    return MediaResponseDto.fromEntity(updated);
  }

  async getMediaByUuid(
    uuid: string,
    userId?: number,
  ): Promise<MediaResponseDto> {
    const media = await this.prisma.media.findFirst({
      where: { uuid, is_active: true },
    });
    if (!media) throw new NotFoundException('Media not found');
    if (!media.is_public && userId && media.uploaded_by !== userId) {
      throw new NotFoundException('Media not found');
    }
    const updated = await this.prisma.media.update({
      where: { id: media.id },
      data: { view_count: { increment: 1 } },
    });
    return MediaResponseDto.fromEntity(updated);
  }

  async updateMedia(
    id: number,
    updateDto: UpdateMediaDto,
    userId?: number,
  ): Promise<MediaResponseDto> {
    const media = await this.prisma.media.findFirst({
      where: { id, is_active: true },
    });
    if (!media) throw new NotFoundException('Media not found');
    if (userId && media.uploaded_by !== userId) {
      throw new BadRequestException(
        'You do not have permission to update this media',
      );
    }
    const updateData: any = {};
    if (updateDto.folder !== undefined) updateData.folder = updateDto.folder;
    if (updateDto.is_public !== undefined)
      updateData.is_public = updateDto.is_public;
    if (updateDto.is_active !== undefined)
      updateData.is_active = updateDto.is_active;
    const updated = await this.prisma.media.update({
      where: { id },
      data: updateData,
    });
    return MediaResponseDto.fromEntity(updated);
  }

  async deleteMedia(id: number, userId?: number): Promise<{ message: string }> {
    const media = await this.prisma.media.findUnique({ where: { id } });
    if (!media) throw new NotFoundException('Media not found');
    if (userId && media.uploaded_by !== userId) {
      throw new BadRequestException(
        'You do not have permission to delete this media',
      );
    }
    try {
      await this.storageService.deleteFile(media.file_path, media.storage_type);
      if (media.optimized_path)
        await this.storageService.deleteFile(
          media.optimized_path,
          media.storage_type,
        );
      if (media.thumbnail_path)
        await this.storageService.deleteFile(
          media.thumbnail_path,
          media.storage_type,
        );
    } catch (error: any) {
      this.logger.warn(
        `Failed to delete files for media ${id}: ${error.message}`,
      );
    }
    await this.prisma.media.update({
      where: { id },
      data: { is_active: false },
    });
    return { message: 'Media deleted successfully' };
  }

  async optimizeImage(
    id: number,
    optimizeDto: OptimizeImageDto,
    userId?: number,
  ): Promise<MediaResponseDto> {
    const media = await this.prisma.media.findFirst({
      where: { id, is_active: true },
    });
    if (!media) throw new NotFoundException('Media not found');
    if (media.media_type !== 'image')
      throw new BadRequestException('Only images can be optimized');
    if (userId && media.uploaded_by !== userId) {
      throw new BadRequestException(
        'You do not have permission to optimize this media',
      );
    }
    const fileBuffer = await this.storageService.readFile(
      media.file_path,
      media.storage_type,
    );
    const processedImage = await this.mediaProcessingService.processImage(
      fileBuffer,
      optimizeDto,
    );
    const folder = media.folder || this.DEFAULT_FOLDER;
    const savedPaths = await this.mediaProcessingService.saveProcessedImage(
      processedImage,
      media.original_filename,
      folder,
      media.storage_type,
    );
    const updateData: any = {
      optimized_path: savedPaths.optimizedPath,
      width: processedImage.metadata.width,
      height: processedImage.metadata.height,
    };
    if (savedPaths.thumbnailPath)
      updateData.thumbnail_path = savedPaths.thumbnailPath;
    const updated = await this.prisma.media.update({
      where: { id },
      data: updateData,
    });
    return MediaResponseDto.fromEntity(updated);
  }

  async getFileUrl(
    id: number,
    optimized: boolean = false,
    expiresIn: number = 3600,
  ): Promise<string> {
    const media = await this.prisma.media.findFirst({
      where: { id, is_active: true },
    });
    if (!media) throw new NotFoundException('Media not found');
    const filePath =
      optimized && media.optimized_path
        ? media.optimized_path
        : media.file_path;
    return this.storageService.getFileUrl(
      filePath,
      media.storage_type,
      expiresIn,
    );
  }

  async getFileBuffer(id: number, optimized: boolean = false): Promise<Buffer> {
    const media = await this.prisma.media.findFirst({
      where: { id, is_active: true },
    });
    if (!media) throw new NotFoundException('Media not found');
    const filePath =
      optimized && media.optimized_path
        ? media.optimized_path
        : media.file_path;
    return this.storageService.readFile(filePath, media.storage_type);
  }

  async findMediaByPath(filePath: string): Promise<any | null> {
    return this.prisma.media.findFirst({
      where: {
        OR: [
          { file_path: filePath, is_active: true },
          { optimized_path: filePath, is_active: true },
          { thumbnail_path: filePath, is_active: true },
        ],
      },
    });
  }

  async getFileBufferByPath(
    filePath: string,
    storageType: StorageType,
  ): Promise<Buffer> {
    return this.storageService.readFile(filePath, storageType);
  }

  async incrementDownloadCount(id: number): Promise<void> {
    const media = await this.prisma.media.findUnique({ where: { id } });
    if (media) {
      await this.prisma.media.update({
        where: { id },
        data: { download_count: { increment: 1 } },
      });
    }
  }

  buildFileUrl(filePath: string): string {
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return filePath;
    }
    if (this.storageService.isS3Configured()) {
      return this.storageService.getPublicS3Url(filePath);
    }
    const appConfig = this.configService.get<{ apiUrl?: string }>('app');
    const apiUrl = appConfig?.apiUrl || 'https://jawab.jantrah.io/api';
    return `${apiUrl}/media/files/${filePath}`;
  }
}
