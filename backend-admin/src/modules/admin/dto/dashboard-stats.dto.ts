export class TrendingTopicDto {
  topic_id: number;
  topic_name: string;
  topic_slug: string;
  usage_count: number; // Total usage in communities and posts
  community_count: number; // Number of communities using this topic
  post_count: number; // Number of posts using this topic
}

export class TrendsDto {
  total_users_change?: number;
  active_users_change?: number;
  verified_users_change?: number;
  pro_users_change?: number;
  total_posts_change?: number;
  published_posts_change?: number;
  draft_posts_change?: number;
  total_comments_change?: number;
  total_topics_change?: number;
  active_topics_change?: number;
  total_communities_change?: number;
  active_communities_change?: number;
  total_polls_change?: number;
  published_polls_change?: number;
}

export class DashboardStatsDto {
  total_users: number;
  active_users: number;
  verified_users: number;
  pro_users: number; // Users with pro_user role
  total_posts: number;
  published_posts: number;
  draft_posts: number;
  total_comments: number;
  total_topics: number;
  active_topics: number;
  total_communities: number;
  active_communities: number;
  total_polls: number;
  published_polls: number;
  recent_users: number; // Users registered in last 7 days
  recent_posts: number; // Posts created in last 7 days
  trending_topics: TrendingTopicDto[]; // Top trending topics (top 10)
  // Enhanced fields
  daily_active_users?: number;
  weekly_active_users?: number;
  monthly_active_users?: number;
  engagement_rate?: number;
  trends?: TrendsDto;
  top_posts?: any[];
  top_users?: any[];
  recent_activity?: any[];
}

