import { IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { MediaType, StorageType } from '@prisma/client';

export class UploadFileDto {
  @ApiPropertyOptional({ example: 'posts' })
  @IsOptional()
  @IsString()
  folder?: string;

  @ApiPropertyOptional({ enum: MediaType })
  @IsOptional()
  @IsEnum(MediaType)
  media_type?: MediaType;

  @ApiPropertyOptional({ enum: StorageType })
  @IsOptional()
  @IsEnum(StorageType)
  storage_type?: StorageType;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_public?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  optimize?: boolean;
}
