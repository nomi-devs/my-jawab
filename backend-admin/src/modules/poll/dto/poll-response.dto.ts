import { PollStatus } from '../entities/user-poll.entity';
import { LikeStatus } from '../entities/poll-like.entity';

export class PollOptionResponseDto {
  id: number;
  poll_id: number;
  option_text: string;
  vote_count: number;
  display_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  percentage?: number;
  is_voted?: boolean; // Indicates if logged user voted for this option
}

export class PollResponseDto {
  id: number;
  user_id: number;
  community_ids: string | null;
  poll_slug: string;
  poll_title: string;
  poll_description: string;
  poll_expires_at: Date | string | null;
  poll_status: PollStatus;
  poll_winner_option_id: number | null;
  vote_count: number;
  like_count: number;
  dislike_count: number;
  view_count: number;
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
  options?: PollOptionResponseDto[];
  user_vote?: {
    vote_option_id: number;
    created_at: Date;
  };
  user_has_voted?: boolean;
  user_like_status?: LikeStatus | null;
  like_status?: LikeStatus | null; // Alias for user_like_status
  is_liked?: boolean;
  is_like?: boolean; // Alias for is_liked
  is_disliked?: boolean;
  is_expired?: boolean;
}

