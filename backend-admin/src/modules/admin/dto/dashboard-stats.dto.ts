import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TrendingTopicDto {
  @ApiProperty({ example: 1 })
  topic_id: number;

  @ApiProperty({ example: 'Technology' })
  topic_name: string;

  @ApiProperty({ example: 'technology' })
  topic_slug: string;

  @ApiProperty({
    description: 'Total usage in communities and posts',
    example: 150,
  })
  usage_count: number;

  @ApiProperty({
    description: 'Number of communities using this topic',
    example: 20,
  })
  community_count: number;

  @ApiProperty({
    description: 'Number of posts using this topic',
    example: 130,
  })
  post_count: number;
}

export class TrendsDto {
  @ApiPropertyOptional({ example: 5.2 })
  total_users_change?: number;

  @ApiPropertyOptional({ example: 3.1 })
  active_users_change?: number;

  @ApiPropertyOptional({ example: 2.8 })
  verified_users_change?: number;

  @ApiPropertyOptional({ example: 1.5 })
  pro_users_change?: number;

  @ApiPropertyOptional({ example: 8.4 })
  total_posts_change?: number;

  @ApiPropertyOptional({ example: 6.7 })
  published_posts_change?: number;

  @ApiPropertyOptional({ example: -1.2 })
  draft_posts_change?: number;

  @ApiPropertyOptional({ example: 10.3 })
  total_comments_change?: number;

  @ApiPropertyOptional({ example: 4.1 })
  total_topics_change?: number;

  @ApiPropertyOptional({ example: 2.9 })
  active_topics_change?: number;

  @ApiPropertyOptional({ example: 7.6 })
  total_communities_change?: number;

  @ApiPropertyOptional({ example: 5.3 })
  active_communities_change?: number;

  @ApiPropertyOptional({ example: 3.8 })
  total_polls_change?: number;

  @ApiPropertyOptional({ example: 2.1 })
  published_polls_change?: number;
}

export class DashboardStatsDto {
  @ApiProperty({ example: 5000 })
  total_users: number;

  @ApiProperty({ example: 3200 })
  active_users: number;

  @ApiProperty({ example: 4100 })
  verified_users: number;

  @ApiProperty({ description: 'Users with pro_user role', example: 800 })
  pro_users: number;

  @ApiProperty({ example: 12000 })
  total_posts: number;

  @ApiProperty({ example: 9500 })
  published_posts: number;

  @ApiProperty({ example: 2500 })
  draft_posts: number;

  @ApiProperty({ example: 45000 })
  total_comments: number;

  @ApiProperty({ example: 300 })
  total_topics: number;

  @ApiProperty({ example: 250 })
  active_topics: number;

  @ApiProperty({ example: 180 })
  total_communities: number;

  @ApiProperty({ example: 150 })
  active_communities: number;

  @ApiProperty({ example: 600 })
  total_polls: number;

  @ApiProperty({ example: 420 })
  published_polls: number;

  @ApiProperty({ description: 'Users registered in last 7 days', example: 75 })
  recent_users: number;

  @ApiProperty({ description: 'Posts created in last 7 days', example: 320 })
  recent_posts: number;

  @ApiProperty({
    description: 'Top trending topics (top 10)',
    type: [TrendingTopicDto],
  })
  trending_topics: TrendingTopicDto[];

  @ApiPropertyOptional({ example: 1200 })
  daily_active_users?: number;

  @ApiPropertyOptional({ example: 3800 })
  weekly_active_users?: number;

  @ApiPropertyOptional({ example: 4500 })
  monthly_active_users?: number;

  @ApiPropertyOptional({ example: 68.5 })
  engagement_rate?: number;

  @ApiPropertyOptional({ type: () => TrendsDto })
  trends?: TrendsDto;

  @ApiPropertyOptional({ type: [Object] })
  top_posts?: any[];

  @ApiPropertyOptional({ type: [Object] })
  top_users?: any[];

  @ApiPropertyOptional({ type: [Object] })
  recent_activity?: any[];
}
