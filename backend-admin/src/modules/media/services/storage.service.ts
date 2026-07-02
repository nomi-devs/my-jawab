import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { StorageType } from '@prisma/client';

export interface UploadResult {
  filePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileHash?: string;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3Client: S3Client | null = null;
  private readonly uploadDir: string;
  private readonly s3Bucket: string | null = null;
  private readonly s3Region: string | null = null;

  constructor(private configService: ConfigService) {
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR', './uploads');

    const s3AccessKey = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const s3SecretKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
    const s3Region = this.configService.get<string>('AWS_REGION');
    const s3Bucket = this.configService.get<string>('S3_BUCKET_NAME');

    if (s3AccessKey && s3SecretKey && s3Region && s3Bucket) {
      this.s3Client = new S3Client({
        region: s3Region,
        credentials: {
          accessKeyId: s3AccessKey,
          secretAccessKey: s3SecretKey,
        },
      });
      this.s3Bucket = s3Bucket;
      this.s3Region = s3Region;
      this.logger.log('S3 storage initialized');
    } else {
      this.logger.log('S3 not configured, using local storage');
    }

    this.ensureUploadDir();
  }

  private async ensureUploadDir(): Promise<void> {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      await fs.mkdir(path.join(this.uploadDir, 'images'), { recursive: true });
      await fs.mkdir(path.join(this.uploadDir, 'videos'), { recursive: true });
      await fs.mkdir(path.join(this.uploadDir, 'documents'), {
        recursive: true,
      });
      await fs.mkdir(path.join(this.uploadDir, 'thumbnails'), {
        recursive: true,
      });
      await fs.mkdir(path.join(this.uploadDir, 'optimized'), {
        recursive: true,
      });
    } catch (error) {
      this.logger.error(`Failed to create upload directory: ${error.message}`);
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = '',
    storageType: StorageType = StorageType.local,
  ): Promise<UploadResult> {
    if (storageType === StorageType.s3 && this.s3Client) {
      return this.uploadToS3(file, folder);
    }
    return this.uploadToLocal(file, folder);
  }

  private async uploadToLocal(
    file: Express.Multer.File,
    folder: string = '',
  ): Promise<UploadResult> {
    const fileHash = this.generateFileHash(file.buffer);
    const fileName = this.generateFileName(file.originalname, fileHash);
    const folderPath = folder
      ? path.join(this.uploadDir, folder)
      : this.uploadDir;

    await fs.mkdir(folderPath, { recursive: true });

    const filePath = path.join(folderPath, fileName);
    await fs.writeFile(filePath, file.buffer);

    const relativePath = path.relative(this.uploadDir, filePath);
    const normalizedPath = relativePath.replace(/\\/g, '/');

    return {
      filePath: normalizedPath,
      fileName,
      fileSize: file.size,
      mimeType: file.mimetype,
      fileHash,
    };
  }

  private async uploadToS3(
    file: Express.Multer.File,
    folder: string = '',
  ): Promise<UploadResult> {
    if (!this.s3Client || !this.s3Bucket) {
      throw new BadRequestException('S3 is not configured');
    }

    const fileHash = this.generateFileHash(file.buffer);
    const fileName = this.generateFileName(file.originalname, fileHash);
    const key = folder ? `${folder}/${fileName}` : fileName;

    const command = new PutObjectCommand({
      Bucket: this.s3Bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      Metadata: { originalName: file.originalname, fileHash },
    });

    await this.s3Client.send(command);

    return {
      filePath: key,
      fileName,
      fileSize: file.size,
      mimeType: file.mimetype,
      fileHash,
    };
  }

  async getFileUrl(
    filePath: string,
    storageType: StorageType,
    expiresIn: number = 3600,
  ): Promise<string> {
    if (storageType === StorageType.s3 && this.s3Client && this.s3Bucket) {
      return this.getS3SignedUrl(filePath, expiresIn);
    }
    return this.getLocalFileUrl(filePath);
  }

  private async getS3SignedUrl(
    key: string,
    expiresIn: number,
  ): Promise<string> {
    if (!this.s3Client || !this.s3Bucket) {
      throw new BadRequestException('S3 is not configured');
    }
    const command = new GetObjectCommand({ Bucket: this.s3Bucket, Key: key });
    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  private getLocalFileUrl(filePath: string): string {
    const appConfig = this.configService.get<{ apiUrl?: string }>('app');
    const apiUrl = appConfig?.apiUrl || 'https://jawab.jantrah.io/api';
    return `${apiUrl}/media/files/${filePath}`;
  }

  async deleteFile(filePath: string, storageType: StorageType): Promise<void> {
    if (storageType === StorageType.s3 && this.s3Client && this.s3Bucket) {
      await this.deleteFromS3(filePath);
    } else {
      await this.deleteFromLocal(filePath);
    }
  }

  private async deleteFromLocal(filePath: string): Promise<void> {
    const fullPath = path.join(this.uploadDir, filePath);
    try {
      await fs.unlink(fullPath);
    } catch (error) {
      this.logger.warn(`Failed to delete local file: ${filePath}`, error);
    }
  }

  private async deleteFromS3(key: string): Promise<void> {
    if (!this.s3Client || !this.s3Bucket) {
      throw new BadRequestException('S3 is not configured');
    }
    const command = new DeleteObjectCommand({
      Bucket: this.s3Bucket,
      Key: key,
    });
    await this.s3Client.send(command);
  }

  async fileExists(
    filePath: string,
    storageType: StorageType,
  ): Promise<boolean> {
    if (storageType === StorageType.s3 && this.s3Client && this.s3Bucket) {
      return this.s3FileExists(filePath);
    }
    return this.localFileExists(filePath);
  }

  private async localFileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(path.join(this.uploadDir, filePath));
      return true;
    } catch {
      return false;
    }
  }

  private async s3FileExists(key: string): Promise<boolean> {
    if (!this.s3Client || !this.s3Bucket) return false;
    try {
      await this.s3Client.send(
        new HeadObjectCommand({ Bucket: this.s3Bucket, Key: key }),
      );
      return true;
    } catch {
      return false;
    }
  }

  async readFile(filePath: string, storageType: StorageType): Promise<Buffer> {
    if (storageType === StorageType.s3 && this.s3Client && this.s3Bucket) {
      return this.readFromS3(filePath);
    }
    return this.readFromLocal(filePath);
  }

  private async readFromLocal(filePath: string): Promise<Buffer> {
    return fs.readFile(path.join(this.uploadDir, filePath));
  }

  private async readFromS3(key: string): Promise<Buffer> {
    if (!this.s3Client || !this.s3Bucket) {
      throw new BadRequestException('S3 is not configured');
    }
    const command = new GetObjectCommand({ Bucket: this.s3Bucket, Key: key });
    const response = await this.s3Client.send(command);
    const chunks: Uint8Array[] = [];
    if (response.Body) {
      for await (const chunk of response.Body as any) {
        chunks.push(chunk);
      }
    }
    return Buffer.concat(chunks);
  }

  private generateFileName(originalName: string, hash: string): string {
    const ext = path.extname(originalName);
    const name = path.basename(originalName, ext);
    const sanitizedName = name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
    const timestamp = Date.now();
    return `${sanitizedName}_${timestamp}_${hash.substring(0, 8)}${ext}`;
  }

  private generateFileHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  getStorageType(): StorageType {
    return this.s3Client && this.s3Bucket ? StorageType.s3 : StorageType.local;
  }
}
