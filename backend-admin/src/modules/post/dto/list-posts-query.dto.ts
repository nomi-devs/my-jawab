import { IsOptional, IsInt, IsEnum, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ListQueryDto } from '../../admin/dto/list-query.dto';
import { PostStatus, PostType } from '../entities/user-post.entity';

export class ListPostsQueryDto extends ListQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  user_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  post_topic_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  community_id?: number;

  @IsOptional()
  @IsEnum(PostStatus)
  post_status?: PostStatus;

  @IsOptional()
  @IsEnum(PostType)
  post_type?: PostType;

  @IsOptional()
  @IsEnum(['featured', 'not_featured'])
  is_featured?: 'featured' | 'not_featured';

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  include_user?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  include_topic?: boolean;
}

