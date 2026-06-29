import {
  IsString,
  IsOptional,
  IsInt,
  IsUrl,
  IsEnum,
  IsBoolean,
  MaxLength,
  Min,
  IsArray,
  ValidateIf,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { PostStatus, PostType } from '../entities/user-post.entity';

export class CreatePostDto {
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  community_ids?: number[];

  @IsString()
  @MaxLength(255)
  post_slug: string;

  @IsString()
  @MaxLength(255)
  post_title: string;

  @IsString()
  post_content: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  post_image?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  post_video?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  post_audio?: string;

  // Note: Files are handled via multipart/form-data, not in JSON body
  // Use 'files' field in form-data for file uploads

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  post_link?: string;

  @IsOptional()
  @IsEnum(PostStatus)
  post_status?: PostStatus;

  @IsOptional()
  @IsEnum(PostType)
  post_type?: PostType;

  @IsOptional()
  @Transform(({ value }) => {
    // Handle empty strings, null, or undefined from FormData
    if (value === null || value === undefined || value === '') {
      return null;
    }
    // Convert to number if it's a string
    const num = typeof value === 'string' ? parseInt(value, 10) : Number(value);
    return isNaN(num) ? null : num;
  })
  @ValidateIf((o) => o.post_topic_id !== null && o.post_topic_id !== undefined)
  @IsInt()
  @Min(1)
  post_topic_id?: number | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  post_tags?: string[];

  @IsOptional()
  @Transform(({ value }) => {
    // Handle FormData: extract string from array if needed, or use string directly
    if (Array.isArray(value)) {
      return value[0] || value;
    }
    return value;
  })
  @IsEnum(['featured', 'not_featured'])
  is_featured?: 'featured' | 'not_featured';
}

