export interface SearchUserResult {
  id: number;
  name: string;
  handle: string;
  avatar: string | null;
  role: string;
  bio?: string | null;
}

export interface SearchPostResult {
  id: number;
  title: string;
  slug: string;
  content_preview: string;
  status: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  created_at: Date;
  user: {
    id: number;
    name: string;
    handle: string;
    avatar: string | null;
  };
  topic?: {
    id: number;
    name: string;
    slug: string;
  };
}

export interface SearchCommunityResult {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  member_count: number;
  is_active: boolean;
}

export interface SearchTopicResult {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  posts_count: number;
  is_active: boolean;
}

export interface SearchPollResult {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  status: string;
  vote_count: number;
  view_count: number;
  is_expired: boolean;
  created_at: Date;
  user: {
    id: number;
    name: string;
    handle: string;
    avatar: string | null;
  };
}

export interface SearchResponseDto {
  users?: SearchUserResult[];
  posts?: SearchPostResult[];
  communities?: SearchCommunityResult[];
  topics?: SearchTopicResult[];
  polls?: SearchPollResult[];
  meta: {
    total: number;
    users?: { count: number };
    posts?: { count: number };
    communities?: { count: number };
    topics?: { count: number };
    polls?: { count: number };
    page?: number;
    limit?: number;
    total_pages?: number;
  };
}
