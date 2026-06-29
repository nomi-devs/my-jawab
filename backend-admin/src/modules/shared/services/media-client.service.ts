import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import FormData from 'form-data';
import { MediaResponseDto } from '../dto/media-response.dto';
import { UploadFileOptionsDto } from '../dto/upload-file-options.dto';
import { MEDIA_CONFIG } from '../../../config/services.config';
import https from 'https';

@Injectable()
export class MediaClientService {
  private readonly logger = new Logger(MediaClientService.name);
  private readonly axiosInstance: AxiosInstance;
  private readonly mediaServiceUrl: string;
  private readonly timeout: number;

  constructor() {
    // Import config directly — avoids NestJS `registerAs` timing issues that can
    // return undefined in constructor scope.
    this.mediaServiceUrl = MEDIA_CONFIG.url;
    this.timeout = MEDIA_CONFIG.timeout || 120000;

    this.logger.log(`Media service URL: ${this.mediaServiceUrl}`);

    const axiosConfig: AxiosRequestConfig = {
      baseURL: MEDIA_CONFIG.apiUrl,
      timeout: this.timeout,
      // Don't set Content-Type header - FormData will set it with boundary automatically
    };

    // Only add HTTPS agent for HTTPS URLs
    if (this.mediaServiceUrl && this.mediaServiceUrl.startsWith('https://')) {
      axiosConfig.httpsAgent = new https.Agent({
        rejectUnauthorized: false, // Allow self-signed certificates (development only)
      });
    }

    this.axiosInstance = axios.create(axiosConfig);

    // Add request interceptor for logging
    this.axiosInstance.interceptors.request.use(
      (config) => {
        this.logger.debug(
          `Making request to Media Service: ${config.method?.toUpperCase()} ${config.url}`,
        );
        return config;
      },
      (error) => {
        this.logger.error('Request error:', error);
        return Promise.reject(error);
      },
    );

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response) {
          this.logger.error(
            `Media Service error: ${error.response.status} - ${JSON.stringify(error.response.data)}`,
          );
        } else if (error.request) {
          this.logger.error(
            'Media Service unavailable - no response received',
          );
        } else {
          this.logger.error(`Media Service error: ${error.message}`);
        }
        return Promise.reject(error);
      },
    );
  }

  /**
   * Upload a file to the Media Service
   */
  async uploadFile(
    file: Express.Multer.File,
    options: UploadFileOptionsDto = {},
  ): Promise<MediaResponseDto> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file has required properties
    if (!file.originalname) {
      throw new BadRequestException('File originalname is missing');
    }
    if (!file.mimetype) {
      throw new BadRequestException('File mimetype is missing');
    }

    // Log file information for debugging
    this.logger.debug(
      `Uploading file: ${file.originalname}, size: ${file.size}, mimetype: ${file.mimetype}, has buffer: ${!!file.buffer}, has path: ${!!(file as any).path}`,
    );

    try {
      const formData = new FormData();
      
      // Handle both memory storage (buffer) and disk storage (path)
      let fileData: Buffer | NodeJS.ReadableStream;
      if (file.buffer) {
        // Memory storage - use buffer directly
        fileData = file.buffer;
        this.logger.debug(`Using file buffer (size: ${file.buffer.length} bytes)`);
      } else if ((file as any).path) {
        // Disk storage - read file from path
        const fs = require('fs');
        const path = (file as any).path;
        if (!fs.existsSync(path)) {
          throw new BadRequestException(`File not found at path: ${path}`);
        }
        fileData = fs.createReadStream(path);
        this.logger.debug(`Using file path: ${path}`);
      } else {
        this.logger.error(
          `File object structure: ${JSON.stringify(Object.keys(file))}`,
        );
        throw new BadRequestException(
          'File buffer or path is missing. File storage configuration may be incorrect.',
        );
      }

      formData.append('file', fileData, {
        filename: file.originalname,
        contentType: file.mimetype,
      });

      // Add optional fields
      if (options.folder) {
        formData.append('folder', options.folder);
      }
      if (options.media_type) {
        formData.append('media_type', options.media_type);
      }
      if (options.storage_type) {
        formData.append('storage_type', options.storage_type);
      }
      if (options.is_public !== undefined) {
        formData.append('is_public', String(options.is_public));
      }
      if (options.optimize !== undefined) {
        formData.append('optimize', String(options.optimize));
      }

      // Log media service URL for debugging
      this.logger.debug(
        `Uploading to Media Service: ${this.mediaServiceUrl}/api/media/upload`,
      );

      // Prepare query params - ensure userId is a valid string if provided
      const queryParams: { userId?: string } | undefined = 
        options.userId !== undefined && options.userId !== null && !isNaN(Number(options.userId))
          ? { userId: String(options.userId) }
          : undefined;

      this.logger.debug(
        `Upload file params: userId=${queryParams?.userId || 'not provided'}, type=${typeof queryParams?.userId}`,
      );

      const response = await this.axiosInstance.post<MediaResponseDto>(
        '/media/upload',
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
          params: queryParams,
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        },
      );

      this.logger.log(
        `File uploaded successfully: ${response.data.id} - ${response.data.original_filename}`,
      );

      return response.data;
    } catch (error) {
      if (error instanceof AxiosError && error.response) {
        const statusCode = error.response.status;
        const message =
          (error.response.data as any)?.message || 'Media Service error';

        if (statusCode === 400) {
          throw new BadRequestException(message);
        } else if (statusCode === 413) {
          throw new BadRequestException('File too large');
        } else {
          throw new InternalServerErrorException(
            `Media Service error: ${message}`,
          );
        }
      }

      // Enhanced error logging
      this.logger.error(
        `Failed to upload file to Media Service: ${error.message || 'Unknown error'}`,
        error.stack,
      );
      
      // Check if it's a network/connection error
      if (error instanceof AxiosError) {
        if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
          throw new InternalServerErrorException(
            'Media Service is unavailable. Please check if the service is running.',
          );
        }
        if (error.request && !error.response) {
          throw new InternalServerErrorException(
            'Media Service did not respond. Please check the service configuration.',
          );
        }
      }

      throw new InternalServerErrorException(
        `Failed to upload file to Media Service: ${error.message || 'Unknown error'}`,
      );
    }
  }

  /**
   * Get media by ID
   */
  async getMediaById(
    id: number,
    userId?: number,
  ): Promise<MediaResponseDto> {
    try {
      const response = await this.axiosInstance.get<MediaResponseDto>(
        `/media/${id}`,
        {
          params: userId ? { userId: String(userId) } : undefined,
        },
      );

      return response.data;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 404) {
        throw new BadRequestException('Media not found');
      }
      throw new InternalServerErrorException(
        'Failed to retrieve media from Media Service',
      );
    }
  }

  /**
   * Get media by UUID
   */
  async getMediaByUuid(
    uuid: string,
    userId?: number,
  ): Promise<MediaResponseDto> {
    try {
      const response = await this.axiosInstance.get<MediaResponseDto>(
        `/media/uuid/${uuid}`,
        {
          params: userId ? { userId: String(userId) } : undefined,
        },
      );

      return response.data;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 404) {
        throw new BadRequestException('Media not found');
      }
      throw new InternalServerErrorException(
        'Failed to retrieve media from Media Service',
      );
    }
  }

  /**
   * Get file URL (signed URL for S3, direct URL for local)
   */
  async getFileUrl(
    id: number,
    optimized: boolean = false,
    expiresIn: number = 3600,
  ): Promise<string> {
    try {
      this.logger.debug(
        `Getting file URL for media ID: ${id}, optimized: ${optimized}`,
      );
      const response = await this.axiosInstance.get<{ url: string }>(
        `/media/${id}/url`,
        {
          params: {
            optimized,
            expiresIn,
          },
        },
      );

      this.logger.debug(`File URL retrieved: ${response.data.url}`);
      return response.data.url;
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response) {
          this.logger.error(
            `Media Service error getting file URL: ${error.response.status} - ${JSON.stringify(error.response.data)}`,
          );
        } else if (error.request) {
          this.logger.error(
            'Media Service unavailable when getting file URL',
          );
        }
      }
      this.logger.error(
        `Failed to get file URL from Media Service: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Failed to get file URL from Media Service: ${error.message || 'Unknown error'}`,
      );
    }
  }

  /**
   * Delete media
   */
  async deleteMedia(id: number, userId?: number): Promise<void> {
    try {
      await this.axiosInstance.delete(`/media/${id}`, {
        params: userId ? { userId: String(userId) } : undefined,
      });

      this.logger.log(`Media deleted: ${id}`);
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 404) {
        throw new BadRequestException('Media not found');
      }
      throw new InternalServerErrorException(
        'Failed to delete media from Media Service',
      );
    }
  }

  /**
   * Update media metadata
   */
  async updateMedia(
    id: number,
    updateData: {
      folder?: string;
      is_public?: boolean;
      is_active?: boolean;
    },
    userId?: number,
  ): Promise<MediaResponseDto> {
    try {
      const response = await this.axiosInstance.put<MediaResponseDto>(
        `/media/${id}`,
        updateData,
        {
          params: userId ? { userId: String(userId) } : undefined,
        },
      );

      return response.data;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 404) {
        throw new BadRequestException('Media not found');
      }
      throw new InternalServerErrorException(
        'Failed to update media in Media Service',
      );
    }
  }

  /**
   * Optimize an image
   */
  async optimizeImage(
    id: number,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'webp' | 'avif' | 'jpeg' | 'png';
    } = {},
    userId?: number,
  ): Promise<MediaResponseDto> {
    try {
      const response = await this.axiosInstance.post<MediaResponseDto>(
        `/media/${id}/optimize`,
        options,
        {
          params: userId ? { userId: String(userId) } : undefined,
        },
      );

      return response.data;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 404) {
        throw new BadRequestException('Media not found');
      }
      throw new InternalServerErrorException(
        'Failed to optimize image in Media Service',
      );
    }
  }

  /**
   * Build file serving URL
   */
  buildFileUrl(filePath: string): string {
    // If it's already a full URL, return as is
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return filePath;
    }

    // Use the media service API URL that was resolved at construction time
    const baseUrl = this.axiosInstance.defaults.baseURL;
    return `${baseUrl}/media/files/${filePath}`;
  }

  /**
   * Check if Media Service is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.axiosInstance.get('/media', { timeout: 5000 });
      return true;
    } catch (error) {
      this.logger.warn('Media Service health check failed');
      return false;
    }
  }
}

