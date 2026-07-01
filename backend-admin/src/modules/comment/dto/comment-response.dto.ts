import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CommentResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiPropertyOptional({ example: 10 })
  post_id?: number;

  @ApiPropertyOptional({ example: 3 })
  poll_id?: number;

  @ApiProperty({ example: 7 })
  user_id: number;

  @ApiProperty({ example: null, nullable: true })
  parent_comment_id: number | null;

  @ApiProperty({ example: 'Great post!' })
  comment_content: string;

  @ApiProperty({ example: 5 })
  like_count: number;

  @ApiProperty({ example: 1 })
  dislike_count: number;

  @ApiProperty({ example: true })
  is_approved: boolean;

  @ApiProperty({ example: 7, nullable: true })
  created_by: number | null;

  @ApiProperty({ example: 7, nullable: true })
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
    full_name?: string | null;
    profile_picture?: string | null;
    name?: string | null; // Full name from profile, fallback to username
    image?: string | null; // Alias for profile_picture
  };

  @ApiPropertyOptional({ type: Object })
  post?: {
    id: number;
    post_slug: string;
    post_title: string;
    post_image?: string | null;
  };

  @ApiPropertyOptional({ type: Object })
  poll?: {
    id: number;
    poll_slug: string;
    poll_title: string;
  };

  @ApiPropertyOptional({
    enum: ['like', 'dislike'],
    nullable: true,
    example: 'like',
  })
  user_like_status?: 'like' | 'dislike' | null;

  @ApiPropertyOptional({ example: 3 })
  replies_count?: number;

  @ApiPropertyOptional({ type: () => [CommentResponseDto] })
  replies?: CommentResponseDto[];
}

export class CommentWithRepliesResponseDto extends CommentResponseDto {}
