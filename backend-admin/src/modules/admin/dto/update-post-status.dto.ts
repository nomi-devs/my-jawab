import { IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum PostStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export class UpdatePostStatusDto {
  @ApiPropertyOptional({
    enum: ['draft', 'published', 'archived'],
    example: 'published',
  })
  @IsOptional()
  @IsEnum(PostStatus)
  post_status?: PostStatus;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @Transform(({ value }) => {
    // Handle FormData: extract string from array if needed
    const val = Array.isArray(value) ? value[0] : value;
    if (
      val === 'featured' ||
      val === 'true' ||
      val === true ||
      val === 1 ||
      val === '1'
    )
      return true;
    if (
      val === 'not_featured' ||
      val === 'false' ||
      val === false ||
      val === 0 ||
      val === '0'
    )
      return false;
    return val;
  })
  @IsBoolean()
  is_featured?: boolean;
}
