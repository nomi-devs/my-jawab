import {
  IsOptional,
  IsEnum,
  IsBoolean,
  IsInt,
  IsDateString,
  Min,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ListQueryDto } from './list-query.dto';
import { PostStatus } from '@prisma/client';

export class ListPostsQueryDto extends ListQueryDto {
  @ApiPropertyOptional({
    enum: [...Object.values(PostStatus), 'all'],
    example: 'published',
  })
  @IsOptional()
  @IsEnum(PostStatus)
  post_status?: PostStatus | 'all';

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @Transform(({ value }) => {
    if (
      value === 'featured' ||
      value === 'true' ||
      value === 1 ||
      value === '1'
    )
      return true;
    if (
      value === 'not_featured' ||
      value === 'false' ||
      value === 0 ||
      value === '0'
    )
      return false;
    return value;
  })
  @Type(() => Boolean)
  @IsBoolean()
  is_featured?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @Type(() => Boolean)
  @IsBoolean()
  has_media?: boolean;

  @ApiPropertyOptional({
    enum: ['image', 'video', 'audio', 'none'],
    example: 'image',
  })
  @IsOptional()
  @IsEnum(['image', 'video', 'audio', 'none'])
  media_type?: 'image' | 'video' | 'audio' | 'none';

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  user_id?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  topic_id?: number;

  @ApiPropertyOptional({ example: '2025-01-01' })
  @IsOptional()
  @IsDateString()
  created_from?: string;

  @ApiPropertyOptional({ example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  created_to?: string;
}
