import { IsOptional, IsInt, IsEnum, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ListQueryDto } from '../../admin/dto/list-query.dto';
import { PostStatus, PostType } from '../entities/user-post.entity';

export class ListPostsQueryDto extends ListQueryDto {
  @ApiPropertyOptional({ example: 1, description: 'Filter by user ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  user_id?: number;

  @ApiPropertyOptional({ example: 3, description: 'Filter by topic ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  post_topic_id?: number;

  @ApiPropertyOptional({ example: 2, description: 'Filter by community ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  community_id?: number;

  @ApiPropertyOptional({
    enum: PostStatus,
    example: PostStatus.PUBLISHED,
    description: 'Filter by post status',
  })
  @IsOptional()
  @IsEnum(PostStatus)
  post_status?: PostStatus;

  @ApiPropertyOptional({
    enum: PostType,
    example: PostType.POST,
    description: 'Filter by post type',
  })
  @IsOptional()
  @IsEnum(PostType)
  post_type?: PostType;

  @ApiPropertyOptional({
    enum: ['featured', 'not_featured'],
    example: 'featured',
    description: 'Filter by featured status',
  })
  @IsOptional()
  @IsEnum(['featured', 'not_featured'])
  is_featured?: 'featured' | 'not_featured';

  @ApiPropertyOptional({
    example: true,
    description: 'Include user details in response',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  include_user?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Include topic details in response',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  include_topic?: boolean;
}
