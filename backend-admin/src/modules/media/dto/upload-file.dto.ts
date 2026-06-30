import { IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';
import { MediaType, StorageType } from '../entities/media.entity';

export class UploadFileDto {
  @IsOptional()
  @IsString()
  folder?: string;

  @IsOptional()
  @IsEnum(MediaType)
  media_type?: MediaType;

  @IsOptional()
  @IsEnum(StorageType)
  storage_type?: StorageType;

  @IsOptional()
  @IsBoolean()
  is_public?: boolean;

  @IsOptional()
  @IsBoolean()
  optimize?: boolean;
}
