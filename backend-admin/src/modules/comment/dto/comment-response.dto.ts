export class CommentResponseDto {
  id: number;
  post_id?: number;
  poll_id?: number;
  user_id: number;
  parent_comment_id: number | null;
  comment_content: string;
  like_count: number;
  dislike_count: number;
  is_approved: boolean;
  created_by: number | null;
  updated_by: number | null;
  created_at: Date;
  updated_at: Date;
  user?: {
    id: number;
    username: string;
    email: string;
    full_name?: string | null;
    profile_picture?: string | null;
    name?: string | null; // Full name from profile, fallback to username
    image?: string | null; // Alias for profile_picture
  };
  post?: {
    id: number;
    post_slug: string;
    post_title: string;
    post_image?: string | null;
  };
  poll?: {
    id: number;
    poll_slug: string;
    poll_title: string;
  };
  user_like_status?: 'like' | 'dislike' | null;
  replies_count?: number;
  replies?: CommentResponseDto[];
}

export class CommentWithRepliesResponseDto extends CommentResponseDto { }
