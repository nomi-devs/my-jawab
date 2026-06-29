import { PostResponseDto } from '../../post/dto/post-response.dto';
import { PollResponseDto } from '../../poll/dto/poll-response.dto';
import { CommunityResponseDto } from '../../community/dto/community-response.dto';
import { Banner } from '../../banner/entities/banner.entity';

export class FeedItemDto {
  type: 'post' | 'poll' | 'community' | 'banner';
  id: number;
  user_id?: number; // Optional for community/banner type
  created_at: Date;
  score?: number;
  post?: PostResponseDto;
  poll?: PollResponseDto;
  community?: CommunityResponseDto & {
    topic_main?: string | null;
    is_followed?: boolean;
  };
  banner?: Banner;
}

export class FeedResponseDto {
  data: FeedItemDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}
