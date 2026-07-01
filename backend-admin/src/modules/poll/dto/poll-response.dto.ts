import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PollStatus } from '../entities/user-poll.entity';
import { LikeStatus } from '../entities/poll-like.entity';

export class PollOptionResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 10 })
  poll_id: number;

  @ApiProperty({ example: 'Option A' })
  option_text: string;

  @ApiProperty({ example: 42 })
  vote_count: number;

  @ApiProperty({ example: 1 })
  display_order: number;

  @ApiProperty({ example: true })
  is_active: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updated_at: Date;

  @ApiPropertyOptional({
    description: 'Percentage of total votes this option received',
    example: 52.4,
  })
  percentage?: number;

  @ApiPropertyOptional({
    description: 'Whether the current user voted for this option',
    example: false,
  })
  is_voted?: boolean;
}

class PollUserDto {
  @ApiProperty({ example: 7 })
  id: number;

  @ApiProperty({ example: 'johndoe' })
  username: string;

  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiPropertyOptional({
    example: 'https://example.com/avatar.jpg',
    nullable: true,
  })
  profile_picture?: string | null;

  @ApiPropertyOptional({
    description: 'Full name from profile, falls back to username',
    example: 'John Doe',
    nullable: true,
  })
  name?: string | null;

  @ApiPropertyOptional({
    description: 'Alias for profile_picture',
    example: 'https://example.com/avatar.jpg',
    nullable: true,
  })
  image?: string | null;
}

class PollUserVoteDto {
  @ApiProperty({ example: 3 })
  vote_option_id: number;

  @ApiProperty({ example: '2024-06-15T10:30:00.000Z' })
  created_at: Date;
}

export class PollResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 7 })
  user_id: number;

  @ApiPropertyOptional({
    description: 'Comma-separated community IDs',
    example: '1,2,3',
    nullable: true,
  })
  community_ids: string | null;

  @ApiProperty({ example: 'favorite-color-poll' })
  poll_slug: string;

  @ApiProperty({ example: 'What is your favorite color?' })
  poll_title: string;

  @ApiProperty({
    example: 'Choose your favorite color from the options below.',
  })
  poll_description: string;

  @ApiPropertyOptional({
    description: 'Poll expiry date/time',
    example: '2025-12-31T23:59:59.000Z',
    nullable: true,
  })
  poll_expires_at: Date | string | null;

  @ApiProperty({ enum: PollStatus, example: 'published' })
  poll_status: PollStatus;

  @ApiPropertyOptional({
    description: 'ID of the winning option after poll ends',
    example: 2,
    nullable: true,
  })
  poll_winner_option_id: number | null;

  @ApiProperty({ example: 128 })
  vote_count: number;

  @ApiProperty({ example: 45 })
  like_count: number;

  @ApiProperty({ example: 3 })
  dislike_count: number;

  @ApiProperty({ example: 512 })
  view_count: number;

  @ApiProperty({ example: false })
  is_featured: boolean;

  @ApiPropertyOptional({ example: 1, nullable: true })
  created_by: number | null;

  @ApiPropertyOptional({ example: 1, nullable: true })
  updated_by: number | null;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updated_at: Date;

  @ApiPropertyOptional({
    type: () => PollUserDto,
    description: 'Poll author (included when include_user=true)',
  })
  user?: PollUserDto;

  @ApiPropertyOptional({
    type: [PollOptionResponseDto],
    description: 'Poll options (included when include_options=true)',
  })
  options?: PollOptionResponseDto[];

  @ApiPropertyOptional({
    type: () => PollUserVoteDto,
    description: "Current user's vote (included when include_user_vote=true)",
    nullable: true,
  })
  user_vote?: PollUserVoteDto;

  @ApiPropertyOptional({ example: true })
  user_has_voted?: boolean;

  @ApiPropertyOptional({ enum: LikeStatus, nullable: true, example: 'like' })
  user_like_status?: LikeStatus | null;

  @ApiPropertyOptional({
    description: 'Alias for user_like_status',
    enum: LikeStatus,
    nullable: true,
    example: 'like',
  })
  like_status?: LikeStatus | null;

  @ApiPropertyOptional({ example: true })
  is_liked?: boolean;

  @ApiPropertyOptional({ description: 'Alias for is_liked', example: true })
  is_like?: boolean;

  @ApiPropertyOptional({ example: false })
  is_disliked?: boolean;

  @ApiPropertyOptional({ example: false })
  is_expired?: boolean;
}
