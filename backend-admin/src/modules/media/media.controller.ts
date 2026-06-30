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
    if (!file) throw new BadRequestException('No file provided');
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

  @Options('files/*')
  @HttpCode(HttpStatus.NO_CONTENT)
  async serveFileOptions(@Req() req: Request, @Res() res: Response): Promise<void> {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.send();
  }

  // Must be before :id route
  @Get('files/*')
  async serveFile(
    @Req() req: Request,
    @Res() res: Response,
    @Query('userId', OptionalParseIntPipe) userId?: number,
  ): Promise<void> {
    let filePath: string | undefined;
    try {
      const fullPath = req.url;
      const patterns = ['/api/media/files/', '/media/files/', 'files/'];
      for (const pattern of patterns) {
        if (fullPath.includes(pattern)) {
          const index = fullPath.indexOf(pattern);
          filePath = fullPath.substring(index + pattern.length);
          break;
        }
      }
      if (!filePath) {
        const filesIndex = fullPath.indexOf('files/');
        if (filesIndex !== -1) filePath = fullPath.substring(filesIndex + 'files/'.length);
      }
      if (filePath) {
        const queryIndex = filePath.indexOf('?');
        if (queryIndex !== -1) filePath = filePath.substring(0, queryIndex);
        filePath = decodeURIComponent(filePath);
      }

      if (!filePath || filePath.trim() === '') {
        res.status(404).json({ message: 'File path is required' });
        return;
      }

      const media = await this.mediaService.findMediaByPath(filePath);
      if (!media) {
        res.status(404).json({ message: 'File not found' });
        return;
      }

      const isOwner = userId && media.uploaded_by === userId;
      if (!media.is_public && !isOwner) {
        res.status(403).json({ message: 'File is not public and you are not the owner' });
        return;
      }

      let buffer: Buffer;
      let mimeType: string;

      if (media.optimized_path === filePath) {
        buffer = await this.mediaService.getFileBuffer(media.id, true);
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
        mimeType = 'image/jpeg';
      } else {
        buffer = await this.mediaService.getFileBuffer(media.id, false);
        mimeType = media.mime_type;
      }

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      res.setHeader('Access-Control-Expose-Headers', 'Content-Type, Content-Length');
      res.setHeader('Access-Control-Max-Age', '86400');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Length', buffer.length.toString());
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.send(buffer);
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
    await this.mediaService.incrementDownloadCount(id);
    res.setHeader('Content-Type', media.mime_type);
    res.setHeader('Content-Disposition', `attachment; filename="${media.original_filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  }
}
