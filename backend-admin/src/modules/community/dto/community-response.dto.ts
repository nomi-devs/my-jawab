import { CommunityUserRole } from '../entities/community-user.entity';

export class CommunityResponseDto {
  id: number;
  community_slug: string;
  community_name: string;
  community_description: string | null;
  community_image: string | null;
  is_active: boolean;
  created_by: number | null;
  updated_by: number | null;
  created_at: Date;
  updated_at: Date;
  member_count?: number;
  topic_count?: number;
  user_role?: CommunityUserRole | null;
  is_member?: boolean;
  matching_topics?: Array<{
    id: number;
    topic_slug: string;
    topic_name: string;
  }>;
}

export class CommunityTopicResponseDto {
  id: number;
  community_id: number;
  topic_id: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  topic?: {
    id: number;
    topic_slug: string;
    topic_name: string;
    topic_description: string | null;
    topic_image: string | null;
  };
}

export class CommunityMemberResponseDto {
  id: number;
  community_id: number;
  user_id: number;
  role: CommunityUserRole;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  user?: {
    id: number;
    username: string;
    email: string;
    full_name?: string | null;
    profile_picture?: string | null;
  };
  posts_count?: number;
}

