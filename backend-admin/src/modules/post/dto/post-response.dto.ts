import { PostStatus, PostType } from '../entities/user-post.entity';

export class PostResponseDto {
  id: number;
  community_ids: string | null;
  user_id: number;
  post_slug: string;
  post_title: string;
  post_content: string;
  post_image: string | null;
  post_video: string | null;
  post_audio: string | null;
  post_link: string | null;
  post_status: PostStatus;
  post_type: PostType;
  post_topic_id: number | null;
  post_tags: string | null;
  view_count: number;
  like_count: number;
  dislike_count: number;
  comment_count: number;
  is_featured: boolean;
  created_by: number | null;
  updated_by: number | null;
  created_at: Date;
  updated_at: Date;
  user?: {
    id: number;
    username: string;
    email: string;
    profile_picture?: string | null;
    name?: string | null; // Full name from profile, fallback to username
    image?: string | null; // Alias for profile_picture
  };
  topic?: {
    id: number;
    topic_slug: string;
    topic_name: string;
  };
  main_topic_name?: string | null;
  user_like_status?: 'like' | 'dislike' | null;
  like_status?: 'like' | 'dislike' | null; // Alias for user_like_status
  is_liked?: boolean;
  is_like?: boolean; // Alias for is_liked
  is_disliked?: boolean;
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

