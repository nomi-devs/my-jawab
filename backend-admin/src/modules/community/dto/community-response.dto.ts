import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CommunityUserRole } from '../entities/community-user.entity';

export class CommunityResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'tech-lovers' })
  community_slug: string;

  @ApiProperty({ example: 'Tech Lovers' })
  community_name: string;

  @ApiPropertyOptional({
    example: 'A community for tech enthusiasts',
    nullable: true,
  })
  community_description: string | null;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/community.jpg',
    nullable: true,
  })
  community_image: string | null;

  @ApiProperty({ example: true })
  is_active: boolean;

  @ApiPropertyOptional({ example: 42, nullable: true })
  created_by: number | null;

  @ApiPropertyOptional({ example: 42, nullable: true })
  updated_by: number | null;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updated_at: Date;

  @ApiPropertyOptional({ example: 120, description: 'Total number of members' })
  member_count?: number;

  @ApiPropertyOptional({ example: 5, description: 'Total number of topics' })
  topic_count?: number;

  @ApiPropertyOptional({
    enum: CommunityUserRole,
    nullable: true,
    example: 'member',
  })
  user_role?: CommunityUserRole | null;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the current user is a member',
  })
  is_member?: boolean;

  @ApiPropertyOptional({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        topic_slug: { type: 'string', example: 'javascript' },
        topic_name: { type: 'string', example: 'JavaScript' },
      },
    },
    description: 'Topics matching the current user interests',
  })
  matching_topics?: Array<{
    id: number;
    topic_slug: string;
    topic_name: string;
  }>;
}

export class CommunityTopicResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 10 })
  community_id: number;

  @ApiProperty({ example: 5 })
  topic_id: number;

  @ApiProperty({ example: true })
  is_active: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updated_at: Date;

  @ApiPropertyOptional({ type: Object })
  topic?: {
    id: number;
    topic_slug: string;
    topic_name: string;
    topic_description: string | null;
    topic_image: string | null;
  };
}

export class CommunityMemberResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 10 })
  community_id: number;

  @ApiProperty({ example: 42 })
  user_id: number;

  @ApiProperty({ enum: CommunityUserRole, example: 'member' })
  role: CommunityUserRole;

  @ApiProperty({ example: true })
  is_active: boolean;

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
  };

  @ApiPropertyOptional({
    example: 15,
    description: 'Number of posts by this member in the community',
  })
  posts_count?: number;
}
