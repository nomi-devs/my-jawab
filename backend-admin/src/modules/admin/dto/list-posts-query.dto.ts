import { IsOptional, IsEnum, IsBoolean, IsInt, IsDateString, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ListQueryDto } from './list-query.dto';
import { PostStatus } from '../../post/entities/user-post.entity';

export class ListPostsQueryDto extends ListQueryDto {
  @IsOptional()
  @IsEnum(PostStatus)
  post_status?: PostStatus | 'all';

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'featured' || value === 'true' || value === 1 || value === '1') return true;
    if (value === 'not_featured' || value === 'false' || value === 0 || value === '0') return false;
    return value;
  })
  @Type(() => Boolean)
  @IsBoolean()
  is_featured?: boolean;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @Type(() => Boolean)
  @IsBoolean()
  has_media?: boolean;

  @IsOptional()
  @IsEnum(['image', 'video', 'audio', 'none'])
  media_type?: 'image' | 'video' | 'audio' | 'none';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  user_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  topic_id?: number;

  @IsOptional()
  @IsDateString()
  created_from?: string;

  @IsOptional()
  @IsDateString()
  created_to?: string;
}

