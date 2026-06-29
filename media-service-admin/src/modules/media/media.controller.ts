import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Options,
  Param,
  Query,
  Body,
  UseInterceptors,
  UploadedFile,
  Res,
  Req,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  ParseBoolPipe,
  DefaultValuePipe,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response, Request } from 'express';
import { MediaService } from './media.service';
import { ListMediaDto } from './dto/list-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { UploadFileDto } from './dto/upload-file.dto';
import { OptimizeImageDto } from './dto/optimize-image.dto';
import { MediaResponseDto } from './dto/media-response.dto';
import { OptionalParseIntPipe } from './pipes/optional-parse-int.pipe';

@Controller('media')
export class MediaController {
  private readonly logger = new Logger(MediaController.name);

  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: UploadFileDto,
    @Query('userId', OptionalParseIntPipe) userId?: number,
  ): Promise<MediaResponseDto> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    return this.mediaService.uploadFile(file, uploadDto, userId);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async listMedia(
    @Query() listDto: ListMediaDto,
    @Query('userId', OptionalParseIntPipe) userId?: number,
  ) {
    return this.mediaService.listMedia(listDto, userId);
  }

  // Handle OPTIONS preflight requests for CORS
  @Options('files/*')
  @HttpCode(HttpStatus.NO_CONTENT)
  async serveFileOptions(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    // Always allow all origins for public file serving
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
    // CORP header for cross-origin embedding
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.send();
  }

  // IMPORTANT: files/* route must come BEFORE :id routes to ensure proper matching
  @Get('files/*')
  async serveFile(
    @Req() req: Request,
    @Res() res: Response,
    @Query('userId', OptionalParseIntPipe) userId?: number,
  ): Promise<void> {
    let filePath: string | undefined;
    try {
      // Extract file path from request URL
      // URL format: /api/media/files/profile-pictures/filename.jpg
      // We need to extract: profile-pictures/filename.jpg
      // Note: NestJS strips the global prefix (/api) before routing, so req.url might be /media/files/...
      const fullPath = req.url;
      this.logger.debug(`Raw request URL: ${fullPath}`);
      
      // Try different path patterns
      const patterns = [
        '/api/media/files/',  // With global prefix
        '/media/files/',      // Without global prefix (stripped by NestJS)
        'files/',            // Just the route part
      ];
      
      for (const pattern of patterns) {
        if (fullPath.includes(pattern)) {
          const index = fullPath.indexOf(pattern);
          filePath = fullPath.substring(index + pattern.length);
          break;
        }
      }
      
      // Fallback: extract everything after 'files/'
      if (!filePath) {
        const filesIndex = fullPath.indexOf('files/');
        if (filesIndex !== -1) {
          filePath = fullPath.substring(filesIndex + 'files/'.length);
        }
      }
      
      // Remove query parameters if present
      if (filePath) {
        const queryIndex = filePath.indexOf('?');
        if (queryIndex !== -1) {
          filePath = filePath.substring(0, queryIndex);
        }
        // Decode URL encoding
        filePath = decodeURIComponent(filePath);
      }
      
      this.logger.debug(`Serving file request - fullPath: ${fullPath}, extracted filePath: ${filePath}`);
      
      if (!filePath || filePath.trim() === '') {
        this.logger.error(`File path is undefined or empty. Full URL: ${fullPath}`);
        res.status(404).json({ message: 'File path is required' });
        return;
      }

      // Find media by any path (file_path, optimized_path, or thumbnail_path)
      const media = await this.mediaService.findMediaByPath(filePath);

      if (!media) {
        this.logger.warn(`Media not found for path: ${filePath}`);
        res.status(404).json({ message: 'File not found' });
        return;
      }

      this.logger.debug(`Media found - ID: ${media.id}, file_path: ${media.file_path}, is_public: ${media.is_public}`);

      // Check access: file must be public OR user must be the owner
      const isOwner = userId && media.uploaded_by === userId;
      
      if (!media.is_public && !isOwner) {
        this.logger.warn(`Access denied for file ${media.id} - not public and user ${userId || 'anonymous'} is not owner`);
        res.status(403).json({ message: 'File is not public and you are not the owner' });
        return;
      }

      // Determine which path was matched and get the buffer
      let buffer: Buffer;
      let mimeType: string;

      if (media.optimized_path === filePath) {
        buffer = await this.mediaService.getFileBuffer(media.id, true);
        // For optimized images, determine mime type from file extension
        const ext = filePath.split('.').pop()?.toLowerCase();
        const mimeTypes: Record<string, string> = {
          webp: 'image/webp',
          avif: 'image/avif',
          jpg: 'image/jpeg',
          jpeg: 'image/jpeg',
          png: 'image/png',
        };
        mimeType = mimeTypes[ext || ''] || media.mime_type;
      } else if (media.thumbnail_path === filePath) {
        buffer = await this.mediaService.getFileBufferByPath(filePath, media.storage_type);
        mimeType = 'image/jpeg'; // Thumbnails are always JPEG
      } else {
        buffer = await this.mediaService.getFileBuffer(media.id, false);
        mimeType = media.mime_type;
      }

      // CORS headers - always allow all origins for public file serving
      // Using '*' allows any origin to access the files (no credentials needed for public files)
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      res.setHeader('Access-Control-Expose-Headers', 'Content-Type, Content-Length');
      res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
      
      // CORP (Cross-Origin Resource Policy) - allow cross-origin embedding for public images
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      
      // Set content headers
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Length', buffer.length.toString());
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year cache
      res.setHeader('X-Content-Type-Options', 'nosniff');

      res.send(buffer);
      this.logger.debug(`File served successfully - ID: ${media.id}, size: ${buffer.length} bytes`);
    } catch (error) {
      this.logger.error(`Error serving file ${filePath}: ${error.message}`, error.stack);
      res.status(404).json({ message: 'File not found' });
    }
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getMediaById(
    @Param('id', ParseIntPipe) id: number,
    @Query('userId', OptionalParseIntPipe) userId?: number,
  ): Promise<MediaResponseDto> {
    return this.mediaService.getMediaById(id, userId);
  }

  @Get('uuid/:uuid')
  @HttpCode(HttpStatus.OK)
  async getMediaByUuid(
    @Param('uuid') uuid: string,
    @Query('userId', OptionalParseIntPipe) userId?: number,
  ): Promise<MediaResponseDto> {
    return this.mediaService.getMediaByUuid(uuid, userId);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updateMedia(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateMediaDto,
    @Query('userId', OptionalParseIntPipe) userId?: number,
  ): Promise<MediaResponseDto> {
    return this.mediaService.updateMedia(id, updateDto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteMedia(
    @Param('id', ParseIntPipe) id: number,
    @Query('userId', OptionalParseIntPipe) userId?: number,
  ): Promise<{ message: string }> {
    return this.mediaService.deleteMedia(id, userId);
  }

  @Post(':id/optimize')
  @HttpCode(HttpStatus.OK)
  async optimizeImage(
    @Param('id', ParseIntPipe) id: number,
    @Body() optimizeDto: OptimizeImageDto,
    @Query('userId', OptionalParseIntPipe) userId?: number,
  ): Promise<MediaResponseDto> {
    return this.mediaService.optimizeImage(id, optimizeDto, userId);
  }

  @Get(':id/url')
  @HttpCode(HttpStatus.OK)
  async getFileUrl(
    @Param('id', ParseIntPipe) id: number,
    @Query('optimized', new DefaultValuePipe(false), ParseBoolPipe) optimized: boolean,
    @Query('expiresIn', new DefaultValuePipe(3600), ParseIntPipe) expiresIn: number,
  ): Promise<{ url: string }> {
    const url = await this.mediaService.getFileUrl(id, optimized, expiresIn);
    return { url };
  }

  @Get(':id/download')
  async downloadFile(
    @Param('id', ParseIntPipe) id: number,
    @Query('optimized', new DefaultValuePipe(false), ParseBoolPipe) optimized: boolean,
    @Res() res: Response,
  ): Promise<void> {
    const media = await this.mediaService.getMediaById(id);
    const buffer = await this.mediaService.getFileBuffer(id, optimized);

    // Increment download count
    await this.mediaService.incrementDownloadCount(id);

    // Set headers
    res.setHeader('Content-Type', media.mime_type);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${media.original_filename}"`,
    );
    res.setHeader('Content-Length', buffer.length);

    res.send(buffer);
  }
}

