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

    // Search each requested category concurrently — the branches are fully
    // independent, so there's no reason to await them one after another.
    const [usersResult, postsResult, communitiesResult, topicsResult, pollsResult] =
      await Promise.all([
        type === SearchType.ALL || type === SearchType.USERS
          ? this.searchUsers(term, effectiveLimit, skip)
          : Promise.resolve(null),
        type === SearchType.ALL || type === SearchType.POSTS
          ? this.searchPosts(term, effectiveLimit, skip, userId)
          : Promise.resolve(null),
        type === SearchType.ALL || type === SearchType.COMMUNITIES
          ? this.searchCommunities(term, effectiveLimit, skip, userId)
          : Promise.resolve(null),
        type === SearchType.ALL || type === SearchType.TOPICS
          ? this.searchTopics(term, effectiveLimit, skip)
          : Promise.resolve(null),
        type === SearchType.ALL || type === SearchType.POLLS
          ? this.searchPolls(term, effectiveLimit, skip, userId)
          : Promise.resolve(null),
      ]);

    if (usersResult) {
      results.users = usersResult.users;
      results.meta.users = { count: usersResult.count };
      results.meta.total += usersResult.count;
    }
    if (postsResult) {
      results.posts = postsResult.posts;
      results.meta.posts = { count: postsResult.count };
      results.meta.total += postsResult.count;
    }
    if (communitiesResult) {
      results.communities = communitiesResult.communities;
      results.meta.communities = { count: communitiesResult.count };
      results.meta.total += communitiesResult.count;
    }
    if (topicsResult) {
      results.topics = topicsResult.topics;
      results.meta.topics = { count: topicsResult.count };
      results.meta.total += topicsResult.count;
    }
    if (pollsResult) {
      results.polls = pollsResult.polls;
      results.meta.polls = { count: pollsResult.count };
      results.meta.total += pollsResult.count;
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
            select: {
              id: true,
              username: true,
              profile: { select: { full_name: true, profile_picture: true } },
            },
          },
          topic: { select: { id: true, topic_name: true, topic_slug: true } },
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
          // Denormalized column kept in sync by join()/leave() — no need to
          // count CommunityUser rows per community here.
          member_count: true,
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.community.count({ where }),
    ]);

    const communityResults: SearchCommunityResult[] = communities.map(
      (community) => ({
        id: community.id,
        name: community.community_name,
        slug: community.community_slug,
        description: community.community_description || null,
        image: community.community_image || null,
        member_count: community.member_count,
        is_active: community.is_active,
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

    // Get post counts for all matched topics in one batched query instead of
    // one `count()` per topic.
    const topicIds = topics.map((topic) => topic.id);
    const postCounts =
      topicIds.length > 0
        ? await this.prisma.userPost.groupBy({
            by: ['post_topic_id'],
            where: { post_topic_id: { in: topicIds }, post_status: 'published' },
            _count: { _all: true },
          })
        : [];
    const postCountByTopic = new Map<number, number>();
    postCounts.forEach((row) => {
      if (row.post_topic_id !== null) {
        postCountByTopic.set(row.post_topic_id, row._count._all);
      }
    });

    const topicResults: SearchTopicResult[] = topics.map((topic) => ({
      id: topic.id,
      name: topic.topic_name,
      slug: topic.topic_slug,
      description: (topic as any).topic_description || null,
      image: (topic as any).topic_image || null,
      posts_count: postCountByTopic.get(topic.id) || 0,
      is_active: topic.is_active,
    }));

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
            select: {
              id: true,
              username: true,
              profile: { select: { full_name: true, profile_picture: true } },
            },
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
