import { Injectable } from '@nestjs/common';
import { SearchQueryDto, SearchType } from './dto/search-query.dto';
import {
  SearchResponseDto,
  SearchUserResult,
  SearchPostResult,
  SearchCommunityResult,
  SearchTopicResult,
  SearchPollResult,
} from './dto/search-response.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async search(
    searchQueryDto: SearchQueryDto,
    userId?: number,
  ): Promise<SearchResponseDto> {
    const { q, type = SearchType.ALL, limit = 10, page = 1 } = searchQueryDto;
    const term = q?.trim();

    if (!term || term.length < 2) {
      return this.getEmptyResponse();
    }

    const effectiveLimit = Math.min(Math.max(limit || 10, 1), 50);
    const skip = (page - 1) * effectiveLimit;

    const results: SearchResponseDto = {
      meta: {
        total: 0,
        page,
        limit: effectiveLimit,
      },
    };

    // Search based on type
    if (type === SearchType.ALL || type === SearchType.USERS) {
      const { users, count } = await this.searchUsers(
        term,
        effectiveLimit,
        skip,
      );
      results.users = users;
      results.meta.users = { count };
      results.meta.total += count;
    }

    if (type === SearchType.ALL || type === SearchType.POSTS) {
      const { posts, count } = await this.searchPosts(
        term,
        effectiveLimit,
        skip,
        userId,
      );
      results.posts = posts;
      results.meta.posts = { count };
      results.meta.total += count;
    }

    if (type === SearchType.ALL || type === SearchType.COMMUNITIES) {
      const { communities, count } = await this.searchCommunities(
        term,
        effectiveLimit,
        skip,
        userId,
      );
      results.communities = communities;
      results.meta.communities = { count };
      results.meta.total += count;
    }

    if (type === SearchType.ALL || type === SearchType.TOPICS) {
      const { topics, count } = await this.searchTopics(
        term,
        effectiveLimit,
        skip,
      );
      results.topics = topics;
      results.meta.topics = { count };
      results.meta.total += count;
    }

    if (type === SearchType.ALL || type === SearchType.POLLS) {
      const { polls, count } = await this.searchPolls(
        term,
        effectiveLimit,
        skip,
        userId,
      );
      results.polls = polls;
      results.meta.polls = { count };
      results.meta.total += count;
    }

    results.meta.total_pages = Math.ceil(results.meta.total / effectiveLimit);

    return results;
  }

  private async searchUsers(
    term: string,
    limit: number,
    skip: number,
  ): Promise<{ users: SearchUserResult[]; count: number }> {
    const where = {
      is_active: true,
      is_verified: true,
      OR: [
        { username: { contains: term } },
        { email: { contains: term } },
        { profile: { full_name: { contains: term } } },
      ],
    };

    const [users, count] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          profile: {
            select: {
              full_name: true,
              profile_picture: true,
              profile_bio: true,
            },
          },
        },
        orderBy: { username: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    const userResults: SearchUserResult[] = users.map((user) => ({
      id: user.id,
      name: (user as any).profile?.full_name || user.username,
      handle: `@${user.username}`,
      avatar: (user as any).profile?.profile_picture || null,
      role: user.role,
      bio: (user as any).profile?.profile_bio || null,
    }));

    return { users: userResults, count };
  }

  private async searchPosts(
    term: string,
    limit: number,
    skip: number,
    userId?: number,
  ): Promise<{ posts: SearchPostResult[]; count: number }> {
    const where = {
      post_status: 'published',
      OR: [
        { post_title: { contains: term } },
        { post_content: { contains: term } },
        { post_slug: { contains: term } },
      ],
    } as any;

    const [posts, count] = await Promise.all([
      this.prisma.userPost.findMany({
        where,
        include: {
          user: {
            include: { profile: true },
          },
          topic: true,
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.userPost.count({ where }),
    ]);

    const postResults: SearchPostResult[] = posts.map((post) => {
      const contentPreview = (post as any).post_content
        ? (post as any).post_content.substring(0, 200) +
          ((post as any).post_content.length > 200 ? '...' : '')
        : '';

      return {
        id: post.id,
        title: (post as any).post_title,
        slug: (post as any).post_slug,
        content_preview: contentPreview,
        status: (post as any).post_status,
        view_count: (post as any).view_count || 0,
        like_count: (post as any).like_count || 0,
        comment_count: (post as any).comment_count || 0,
        created_at: (post as any).created_at,
        user: {
          id: (post as any).user?.id || 0,
          name:
            (post as any).user?.profile?.full_name ||
            (post as any).user?.username ||
            'Unknown',
          handle: `@${(post as any).user?.username || 'unknown'}`,
          avatar: (post as any).user?.profile?.profile_picture || null,
        },
        topic: (post as any).topic
          ? {
              id: (post as any).topic.id,
              name: (post as any).topic.topic_name,
              slug: (post as any).topic.topic_slug,
            }
          : undefined,
      };
    });

    return { posts: postResults, count };
  }

  private async searchCommunities(
    term: string,
    limit: number,
    skip: number,
    userId?: number,
  ): Promise<{ communities: SearchCommunityResult[]; count: number }> {
    const where = {
      is_active: true,
      OR: [
        { community_name: { contains: term } },
        { community_slug: { contains: term } },
        { community_description: { contains: term } },
      ],
    };

    const [communities, count] = await Promise.all([
      this.prisma.community.findMany({
        where,
        select: {
          id: true,
          community_name: true,
          community_slug: true,
          community_description: true,
          community_image: true,
          is_active: true,
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.community.count({ where }),
    ]);

    // Get member counts separately
    const communityResults: SearchCommunityResult[] = await Promise.all(
      communities.map(async (community) => {
        const memberCount = await this.prisma.communityUser.count({
          where: { community_id: community.id, is_active: true },
        });

        return {
          id: community.id,
          name: community.community_name,
          slug: community.community_slug,
          description: (community as any).community_description || null,
          image: (community as any).community_image || null,
          member_count: memberCount,
          is_active: community.is_active,
        };
      }),
    );

    return { communities: communityResults, count };
  }

  private async searchTopics(
    term: string,
    limit: number,
    skip: number,
  ): Promise<{ topics: SearchTopicResult[]; count: number }> {
    const where = {
      is_active: true,
      OR: [
        { topic_name: { contains: term } },
        { topic_slug: { contains: term } },
        { topic_description: { contains: term } },
      ],
    };

    const [topics, count] = await Promise.all([
      this.prisma.topic.findMany({
        where,
        select: {
          id: true,
          topic_name: true,
          topic_slug: true,
          topic_description: true,
          topic_image: true,
          is_active: true,
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.topic.count({ where }),
    ]);

    // Get post counts separately
    const topicResults: SearchTopicResult[] = await Promise.all(
      topics.map(async (topic) => {
        const postsCount = await this.prisma.userPost.count({
          where: { post_topic_id: topic.id, post_status: 'published' },
        });

        return {
          id: topic.id,
          name: topic.topic_name,
          slug: topic.topic_slug,
          description: (topic as any).topic_description || null,
          image: (topic as any).topic_image || null,
          posts_count: postsCount,
          is_active: topic.is_active,
        };
      }),
    );

    return { topics: topicResults, count };
  }

  private async searchPolls(
    term: string,
    limit: number,
    skip: number,
    userId?: number,
  ): Promise<{ polls: SearchPollResult[]; count: number }> {
    const where = {
      poll_status: 'published',
      OR: [
        { poll_title: { contains: term } },
        { poll_description: { contains: term } },
        { poll_slug: { contains: term } },
      ],
    } as any;

    const [polls, count] = await Promise.all([
      this.prisma.userPoll.findMany({
        where,
        include: {
          user: {
            include: { profile: true },
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.userPoll.count({ where }),
    ]);

    const pollResults: SearchPollResult[] = polls.map((poll) => {
      const now = new Date();
      const expiresAt = (poll as any).poll_expires_at
        ? new Date((poll as any).poll_expires_at)
        : null;
      const isExpired = expiresAt ? expiresAt < now : false;

      return {
        id: poll.id,
        title: (poll as any).poll_title,
        slug: (poll as any).poll_slug,
        description: (poll as any).poll_description || null,
        status: (poll as any).poll_status,
        vote_count: (poll as any).vote_count || 0,
        view_count: (poll as any).view_count || 0,
        is_expired: isExpired,
        created_at: (poll as any).created_at,
        user: {
          id: (poll as any).user?.id || 0,
          name:
            (poll as any).user?.profile?.full_name ||
            (poll as any).user?.username ||
            'Unknown',
          handle: `@${(poll as any).user?.username || 'unknown'}`,
          avatar: (poll as any).user?.profile?.profile_picture || null,
        },
      };
    });

    return { polls: pollResults, count };
  }

  private getEmptyResponse(): SearchResponseDto {
    return {
      meta: {
        total: 0,
        users: { count: 0 },
        posts: { count: 0 },
        communities: { count: 0 },
        topics: { count: 0 },
        polls: { count: 0 },
      },
    };
  }
}
