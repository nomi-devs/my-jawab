import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PostStatus, PostType } from '@prisma/client';

export class PostResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '[1,2]', nullable: true })
  community_ids: string | null;

  @ApiProperty({ example: 42 })
  user_id: number;

  @ApiProperty({ example: 'my-first-post' })
  post_slug: string;

  @ApiProperty({ example: 'My First Post' })
  post_title: string;

  @ApiProperty({ example: 'This is the post body content.' })
  post_content: string;

  @ApiProperty({ example: 'https://example.com/image.jpg', nullable: true })
  post_image: string | null;

  @ApiProperty({ example: 'https://example.com/video.mp4', nullable: true })
  post_video: string | null;

  @ApiProperty({ example: 'https://example.com/audio.mp3', nullable: true })
  post_audio: string | null;

  @ApiProperty({ example: 'https://example.com/article', nullable: true })
  post_link: string | null;

  @ApiProperty({ enum: PostStatus, example: PostStatus.published })
  post_status: PostStatus;

  @ApiProperty({ enum: PostType, example: PostType.post })
  post_type: PostType;

  @ApiProperty({ example: 5, nullable: true })
  post_topic_id: number | null;

  @ApiProperty({ example: '["news","tech"]', nullable: true })
  post_tags: string | null;

  @ApiProperty({ example: 100 })
  view_count: number;

  @ApiProperty({ example: 25 })
  like_count: number;

  @ApiProperty({ example: 3 })
  dislike_count: number;

  @ApiProperty({ example: 10 })
  comment_count: number;

  @ApiProperty({ example: false })
  is_featured: boolean;

  @ApiProperty({ example: 1, nullable: true })
  created_by: number | null;

  @ApiProperty({ example: 1, nullable: true })
  updated_by: number | null;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updated_at: Date;

  @ApiPropertyOptional({ type: Object })
  user?: {
    id: number;
    username: string;
    email: string;
    profile_picture?: string | null;
    name?: string | null; // Full name from profile, fallback to username
    image?: string | null; // Alias for profile_picture
  };

  @ApiPropertyOptional({ type: Object })
  topic?: {
    id: number;
    topic_slug: string;
    topic_name: string;
  };

  @ApiPropertyOptional({ example: 'Technology', nullable: true })
  main_topic_name?: string | null;

  @ApiPropertyOptional({
    enum: ['like', 'dislike'],
    nullable: true,
    example: 'like',
  })
  user_like_status?: 'like' | 'dislike' | null;

  @ApiPropertyOptional({
    enum: ['like', 'dislike'],
    nullable: true,
    example: 'like',
    description: 'Alias for user_like_status',
  })
  like_status?: 'like' | 'dislike' | null; // Alias for user_like_status

  @ApiPropertyOptional({ example: true })
  is_liked?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Alias for is_liked' })
  is_like?: boolean; // Alias for is_liked

  @ApiPropertyOptional({ example: false })
  is_disliked?: boolean;

  @ApiPropertyOptional({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        community_slug: { type: 'string', example: 'tech-community' },
        community_name: { type: 'string', example: 'Tech Community' },
        name: { type: 'string', example: 'Tech Community' },
        pic: { type: 'string', example: 'https://example.com/community.jpg' },
        topic_main: { type: 'string', nullable: true, example: 'Technology' },
        is_followed: { type: 'boolean', example: false },
      },
    },
  })
  communities?: Array<{
    id: number;
    community_slug: string;
    community_name: string;
    name?: string;
    pic?: string;
    topic_main?: string | null;
    is_followed?: boolean;
  }>;
}
