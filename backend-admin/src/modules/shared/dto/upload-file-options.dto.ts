import { IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';
import { MediaType, StorageType } from './media-response.dto';

export class UploadFileOptionsDto {
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

  @IsOptional()
  userId?: number;
}
