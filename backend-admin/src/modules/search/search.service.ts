import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { UserProfile } from '../user/entities/user-profile.entity';
import { UserPost, PostStatus } from '../post/entities/user-post.entity';
import { Community } from '../community/entities/community.entity';
import { CommunityUser } from '../community/entities/community-user.entity';
import { Topic } from '../general/entities/topic.entity';
import { UserPoll, PollStatus } from '../poll/entities/user-poll.entity';
import { SearchQueryDto, SearchType } from './dto/search-query.dto';
import {
  SearchResponseDto,
  SearchUserResult,
  SearchPostResult,
  SearchCommunityResult,
  SearchTopicResult,
  SearchPollResult,
} from './dto/search-response.dto';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private profileRepository: Repository<UserProfile>,
    @InjectRepository(UserPost)
    private postRepository: Repository<UserPost>,
    @InjectRepository(Community)
    private communityRepository: Repository<Community>,
    @InjectRepository(CommunityUser)
    private communityUserRepository: Repository<CommunityUser>,
    @InjectRepository(Topic)
    private topicRepository: Repository<Topic>,
    @InjectRepository(UserPoll)
    private pollRepository: Repository<UserPoll>,
  ) {}

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
    const searchLike = `%${term}%`;

    const results: SearchResponseDto = {
      meta: {
        total: 0,
        page,
        limit: effectiveLimit,
      },
    };

    // Search based on type
    if (type === SearchType.ALL || type === SearchType.USERS) {
      const { users, count } = await this.searchUsers(searchLike, effectiveLimit, skip);
      results.users = users;
      results.meta.users = { count };
      results.meta.total += count;
    }

    if (type === SearchType.ALL || type === SearchType.POSTS) {
      const { posts, count } = await this.searchPosts(searchLike, effectiveLimit, skip, userId);
      results.posts = posts;
      results.meta.posts = { count };
      results.meta.total += count;
    }

    if (type === SearchType.ALL || type === SearchType.COMMUNITIES) {
      const { communities, count } = await this.searchCommunities(
        searchLike,
        effectiveLimit,
        skip,
        userId,
      );
      results.communities = communities;
      results.meta.communities = { count };
      results.meta.total += count;
    }

    if (type === SearchType.ALL || type === SearchType.TOPICS) {
      const { topics, count } = await this.searchTopics(searchLike, effectiveLimit, skip);
      results.topics = topics;
      results.meta.topics = { count };
      results.meta.total += count;
    }

    if (type === SearchType.ALL || type === SearchType.POLLS) {
      const { polls, count } = await this.searchPolls(searchLike, effectiveLimit, skip, userId);
      results.polls = polls;
      results.meta.polls = { count };
      results.meta.total += count;
    }

    results.meta.total_pages = Math.ceil(results.meta.total / effectiveLimit);

    return results;
  }

  private async searchUsers(
    searchLike: string,
    limit: number,
    skip: number,
  ): Promise<{ users: SearchUserResult[]; count: number }> {
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoin(UserProfile, 'profile', 'profile.user_id = user.id')
      .where(
        '(user.username LIKE :search OR user.email LIKE :search OR profile.full_name LIKE :search)',
        { search: searchLike },
      )
      .andWhere('user.is_active = :isActive', { isActive: true })
      .andWhere('user.is_verified = :isVerified', { isVerified: true })
      .orderBy('user.username', 'ASC');

    const count = await queryBuilder.getCount();
    
    const usersRaw = await queryBuilder
      .select([
        'user.id',
        'user.username',
        'user.role',
        'profile.full_name',
        'profile.profile_picture',
        'profile.profile_bio',
      ])
      .skip(skip)
      .take(limit)
      .getRawMany();

    const userResults: SearchUserResult[] = usersRaw.map((row: any) => {
      return {
        id: row.user_id,
        name: row.profile_full_name || row.user_username,
        handle: `@${row.user_username}`,
        avatar: row.profile_profile_picture || null,
        role: row.user_role,
        bio: row.profile_profile_bio || null,
      };
    });

    return { users: userResults, count };
  }

  private async searchPosts(
    searchLike: string,
    limit: number,
    skip: number,
    userId?: number,
  ): Promise<{ posts: SearchPostResult[]; count: number }> {
    const queryBuilder = this.postRepository
      .createQueryBuilder('post')
      .leftJoin('post.user', 'user')
      .leftJoin(UserProfile, 'profile', 'profile.user_id = user.id')
      .leftJoin('post.topic', 'topic')
      .where(
        '(post.post_title LIKE :search OR post.post_content LIKE :search OR post.post_slug LIKE :search)',
        { search: searchLike },
      )
      .andWhere('post.post_status = :status', { status: PostStatus.PUBLISHED })
      .orderBy('post.created_at', 'DESC');

    const count = await queryBuilder.getCount();
    const postsRaw = await queryBuilder
      .select([
        'post.id',
        'post.post_title',
        'post.post_slug',
        'post.post_content',
        'post.post_status',
        'post.view_count',
        'post.like_count',
        'post.comment_count',
        'post.created_at',
        'user.id',
        'user.username',
        'profile.full_name',
        'profile.profile_picture',
        'topic.id',
        'topic.topic_name',
        'topic.topic_slug',
      ])
      .skip(skip)
      .take(limit)
      .getRawMany();

    const postResults: SearchPostResult[] = postsRaw.map((row: any) => {
      const contentPreview = row.post_post_content
        ? row.post_post_content.substring(0, 200) + (row.post_post_content.length > 200 ? '...' : '')
        : '';

      return {
        id: row.post_id,
        title: row.post_post_title,
        slug: row.post_post_slug,
        content_preview: contentPreview,
        status: row.post_post_status,
        view_count: row.post_view_count || 0,
        like_count: row.post_like_count || 0,
        comment_count: row.post_comment_count || 0,
        created_at: row.post_created_at,
        user: {
          id: row.user_id || 0,
          name: row.profile_full_name || row.user_username || 'Unknown',
          handle: `@${row.user_username || 'unknown'}`,
          avatar: row.profile_profile_picture || null,
        },
        topic: row.topic_id
          ? {
              id: row.topic_id,
              name: row.topic_topic_name,
              slug: row.topic_topic_slug,
            }
          : undefined,
      };
    });

    return { posts: postResults, count };
  }

  private async searchCommunities(
    searchLike: string,
    limit: number,
    skip: number,
    userId?: number,
  ): Promise<{ communities: SearchCommunityResult[]; count: number }> {
    // Count query (without GROUP BY for accurate count)
    const countQuery = this.communityRepository
      .createQueryBuilder('community')
      .where(
        '(community.community_name LIKE :search OR community.community_slug LIKE :search OR community.community_description LIKE :search)',
        { search: searchLike },
      )
      .andWhere('community.is_active = :isActive', { isActive: true });
    
    const count = await countQuery.getCount();

    // Results query
    const queryBuilder = this.communityRepository
      .createQueryBuilder('community')
      .where(
        '(community.community_name LIKE :search OR community.community_slug LIKE :search OR community.community_description LIKE :search)',
        { search: searchLike },
      )
      .andWhere('community.is_active = :isActive', { isActive: true })
      .orderBy('community.created_at', 'DESC');

    const communities = await queryBuilder
      .select([
        'community.id',
        'community.community_name',
        'community.community_slug',
        'community.community_description',
        'community.community_image',
        'community.is_active',
      ])
      .skip(skip)
      .take(limit)
      .getMany();

    // Get member counts separately
    const communityResults: SearchCommunityResult[] = await Promise.all(
      communities.map(async (community) => {
        const memberCount = await this.communityUserRepository.count({
          where: { community_id: community.id, is_active: true },
        });

        return {
          id: community.id,
          name: community.community_name,
          slug: community.community_slug,
          description: community.community_description || null,
          image: community.community_image || null,
          member_count: memberCount,
          is_active: community.is_active,
        };
      }),
    );

    return { communities: communityResults, count };
  }

  private async searchTopics(
    searchLike: string,
    limit: number,
    skip: number,
  ): Promise<{ topics: SearchTopicResult[]; count: number }> {
    // Count query (without GROUP BY for accurate count)
    const countQuery = this.topicRepository
      .createQueryBuilder('topic')
      .where(
        '(topic.topic_name LIKE :search OR topic.topic_slug LIKE :search OR topic.topic_description LIKE :search)',
        { search: searchLike },
      )
      .andWhere('topic.is_active = :isActive', { isActive: true });
    
    const count = await countQuery.getCount();

    // Results query
    const queryBuilder = this.topicRepository
      .createQueryBuilder('topic')
      .where(
        '(topic.topic_name LIKE :search OR topic.topic_slug LIKE :search OR topic.topic_description LIKE :search)',
        { search: searchLike },
      )
      .andWhere('topic.is_active = :isActive', { isActive: true })
      .orderBy('topic.created_at', 'DESC');

    const topics = await queryBuilder
      .select([
        'topic.id',
        'topic.topic_name',
        'topic.topic_slug',
        'topic.topic_description',
        'topic.topic_image',
        'topic.is_active',
      ])
      .skip(skip)
      .take(limit)
      .getMany();

    // Get post counts separately
    const topicResults: SearchTopicResult[] = await Promise.all(
      topics.map(async (topic) => {
        const postsCount = await this.postRepository.count({
          where: { post_topic_id: topic.id, post_status: PostStatus.PUBLISHED },
        });

        return {
          id: topic.id,
          name: topic.topic_name,
          slug: topic.topic_slug,
          description: topic.topic_description || null,
          image: topic.topic_image || null,
          posts_count: postsCount,
          is_active: topic.is_active,
        };
      }),
    );

    return { topics: topicResults, count };
  }

  private async searchPolls(
    searchLike: string,
    limit: number,
    skip: number,
    userId?: number,
  ): Promise<{ polls: SearchPollResult[]; count: number }> {
    const queryBuilder = this.pollRepository
      .createQueryBuilder('poll')
      .leftJoin('poll.user', 'user')
      .leftJoin(UserProfile, 'profile', 'profile.user_id = user.id')
      .where(
        '(poll.poll_title LIKE :search OR poll.poll_description LIKE :search OR poll.poll_slug LIKE :search)',
        { search: searchLike },
      )
      .andWhere('poll.poll_status = :status', { status: PollStatus.PUBLISHED })
      .orderBy('poll.created_at', 'DESC');

    const count = await queryBuilder.getCount();
    const pollsRaw = await queryBuilder
      .select([
        'poll.id',
        'poll.poll_title',
        'poll.poll_slug',
        'poll.poll_description',
        'poll.poll_status',
        'poll.vote_count',
        'poll.view_count',
        'poll.poll_expires_at',
        'poll.created_at',
        'user.id',
        'user.username',
        'profile.full_name',
        'profile.profile_picture',
      ])
      .skip(skip)
      .take(limit)
      .getRawMany();

    const pollResults: SearchPollResult[] = pollsRaw.map((row: any) => {
      const now = new Date();
      const expiresAt = row.poll_poll_expires_at ? new Date(row.poll_poll_expires_at) : null;
      const isExpired = expiresAt ? expiresAt < now : false;

      return {
        id: row.poll_id,
        title: row.poll_poll_title,
        slug: row.poll_poll_slug,
        description: row.poll_poll_description || null,
        status: row.poll_poll_status,
        vote_count: row.poll_vote_count || 0,
        view_count: row.poll_view_count || 0,
        is_expired: isExpired,
        created_at: row.poll_created_at,
        user: {
          id: row.user_id || 0,
          name: row.profile_full_name || row.user_username || 'Unknown',
          handle: `@${row.user_username || 'unknown'}`,
          avatar: row.profile_profile_picture || null,
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
