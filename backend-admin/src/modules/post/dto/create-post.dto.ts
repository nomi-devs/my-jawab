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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PostStatus, PostType } from '@prisma/client';

export class CreatePostDto {
  @ApiPropertyOptional({ type: [Number], example: [1, 2] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  community_ids?: number[];

  @ApiProperty({ maxLength: 255, example: 'my-first-post' })
  @IsString()
  @MaxLength(255)
  post_slug: string;

  @ApiProperty({ maxLength: 255, example: 'My First Post' })
  @IsString()
  @MaxLength(255)
  post_title: string;

  @ApiProperty({ example: 'This is the post body content.' })
  @IsString()
  post_content: string;

  @ApiPropertyOptional({ example: 'https://example.com/image.jpg' })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  post_image?: string;

  @ApiPropertyOptional({ example: 'https://example.com/video.mp4' })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  post_video?: string;

  @ApiPropertyOptional({ example: 'https://example.com/audio.mp3' })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  post_audio?: string;

  // Note: Files are handled via multipart/form-data, not in JSON body
  // Use 'files' field in form-data for file uploads

  @ApiPropertyOptional({ example: 'https://example.com/article' })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  post_link?: string;

  @ApiPropertyOptional({ enum: PostStatus, example: PostStatus.published })
  @IsOptional()
  @IsEnum(PostStatus)
  post_status?: PostStatus;

  @ApiPropertyOptional({ enum: PostType, example: PostType.post })
  @IsOptional()
  @IsEnum(PostType)
  post_type?: PostType;

  @ApiPropertyOptional({ example: 5 })
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

  @ApiPropertyOptional({ type: [String], example: ['news', 'tech'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  post_tags?: string[];

  @ApiPropertyOptional({
    enum: ['featured', 'not_featured'],
    example: 'not_featured',
  })
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
