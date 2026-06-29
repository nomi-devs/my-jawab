import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, MoreThan } from 'typeorm';
import { UserPost, PostStatus } from '../post/entities/user-post.entity';
import { UserPoll, PollStatus } from '../poll/entities/user-poll.entity';
import { UserFollower } from '../user/entities/user-follower.entity';
import { UserTopic } from '../user/entities/user-topic.entity';
import { CommunityUser } from '../community/entities/community-user.entity';
import { UserProfile } from '../user/entities/user-profile.entity';
import { Topic } from '../general/entities/topic.entity';
import { Community } from '../community/entities/community.entity';
import { CommunityTopic } from '../community/entities/community-topic.entity';
import { RedisService } from '../shared/services/redis.service';
import { GetFeedQueryDto, FeedType } from './dto/get-feed-query.dto';
import { FeedResponseDto, FeedItemDto } from './dto/feed-item.dto';
import { PostService } from '../post/post.service';
import { PollService } from '../poll/poll.service';
import { BannerService } from '../banner/banner.service';
import { EntitlementsService } from '../entitlements/entitlements.service';
import Redis from 'ioredis';

interface FeedItem {
  type: 'post' | 'poll' | 'community';
  id: number;
  user_id?: number; // Optional for community type
  created_at: number;
  score?: number;
}

@Injectable()
export class FeedService {
  private readonly logger = new Logger(FeedService.name);
  private redis: Redis | null = null;

  constructor(
    @InjectRepository(UserPost)
    private postRepository: Repository<UserPost>,
    @InjectRepository(UserPoll)
    private pollRepository: Repository<UserPoll>,
    @InjectRepository(UserFollower)
    private followerRepository: Repository<UserFollower>,
    @InjectRepository(UserTopic)
    private topicRepository: Repository<UserTopic>,
    @InjectRepository(CommunityUser)
    private communityUserRepository: Repository<CommunityUser>,
    @InjectRepository(UserProfile)
    private profileRepository: Repository<UserProfile>,
    @InjectRepository(Topic)
    private topicEntityRepository: Repository<Topic>,
    @InjectRepository(Community)
    private communityRepository: Repository<Community>,
    @InjectRepository(CommunityTopic)
    private communityTopicRepository: Repository<CommunityTopic>,
    private redisService: RedisService,
    private postService: PostService,
    private pollService: PollService,
    private bannerService: BannerService,
    private entitlementsService: EntitlementsService,
  ) {
    this.redis = this.redisService.getClient();
  }

  /**
   * Inject banners into a feed response.
   * Banners are placed after every `postsPerBanner` posts (default: 10).
   * Only shows banners matching user's country / subscribed topics / active subscription.
   * Cycles through available banners so different banners appear at different positions.
   */
  async injectBannersIntoFeed(
    response: FeedResponseDto,
    userId: number,
    country?: string,
    postsPerBanner: number = 10,
  ): Promise<FeedResponseDto> {
    try {
      if (!response.data || response.data.length === 0) {
        return response;
      }

      // Respect ads_enabled entitlement — pro/premium users see no banners
      const adsEnabled = await this.entitlementsService.getFeature(userId, 'ads_enabled');
      if (adsEnabled === false) {
        return response;
      }

      // Fetch banners matching user context
      const banners = await this.bannerService.getForUser(userId, { country });
      if (!banners || banners.length === 0) {
        return response;
      }

      // Helper to build a banner feed item
      const makeBannerItem = (idx: number): FeedItemDto => {
        const banner = banners[idx % banners.length];
        return {
          type: 'banner',
          id: banner.id,
          created_at: banner.created_at,
          banner,
        };
      };

      // Only inject the top banner on the first page (page === 1 or undefined)
      // so paginated requests don't keep prepending the same banner every scroll.
      const isFirstPage = !response.meta?.page || response.meta.page === 1;

      const newItems: FeedItemDto[] = [];
      let postCount = 0;
      let bannerIndex = 0;

      // 🆕 Insert a banner at position 0 (top of the first page)
      if (isFirstPage) {
        newItems.push(makeBannerItem(bannerIndex));
        bannerIndex++;
      }

      // Walk through feed items, count posts, splice additional banners in
      for (const item of response.data) {
        newItems.push(item);

        if (item.type === 'post') {
          postCount++;
          // Insert a banner after every `postsPerBanner` posts
          if (postCount % postsPerBanner === 0) {
            newItems.push(makeBannerItem(bannerIndex));
            bannerIndex++;
          }
        }
      }

      return {
        ...response,
        data: newItems,
      };
    } catch (error) {
      // Never break the feed if banner injection fails
      this.logger.warn(`Banner injection failed: ${error.message}`);
      return response;
    }
  }

  /**
   * Get feed based on type
   */
  async getFeed(
    userId: number,
    query: GetFeedQueryDto,
  ): Promise<FeedResponseDto> {
    const { feed_type, page = 1, limit = 20, topic_id, community_id, user_id } = query;
    const skip = (page - 1) * limit;

    switch (feed_type) {
      case FeedType.PERSONALIZED:
        return this.getPersonalizedFeed(userId, page, limit);
      case FeedType.TOPIC:
        if (!topic_id) {
          throw new BadRequestException('topic_id is required for topic feed');
        }
        return this.getTopicFeed(userId, topic_id, page, limit);
      case FeedType.COMMUNITY:
        if (!community_id) {
          throw new BadRequestException('community_id is required for community feed');
        }
        return this.getCommunityFeed(userId, community_id, page, limit);
      case FeedType.USER:
        if (!user_id) {
          throw new BadRequestException('user_id is required for user feed');
        }
        return this.getUserFeed(userId, user_id, page, limit);
      case FeedType.TRENDING:
        return this.getTrendingFeed(userId, page, limit);
      default:
        return this.getPersonalizedFeed(userId, page, limit);
    }
  }

  /**
   * Get personalized feed for user (from followed users, subscribed topics, joined communities)
   */
  async getPersonalizedFeed(
    userId: number,
    page: number = 1,
    limit: number = 20,
  ): Promise<FeedResponseDto> {
    const cacheKey = `feed:timeline:${userId}`;
    const skip = (page - 1) * limit;

    // Try Redis first
    if (this.redis) {
      try {
        const cachedCount = await this.redis.zcard(cacheKey);
        this.logger.debug(`Redis cache for ${cacheKey}: ${cachedCount} items`);
        
        if (cachedCount > 0) {
          const items = await this.redis.zrevrange(
            cacheKey,
            skip,
            skip + limit - 1,
            'WITHSCORES',
          );

          if (items.length > 0) {
            this.logger.debug(`Returning ${items.length} items from Redis cache`);
            const feedItems = this.parseFeedItems(items);
            const enrichedItems = await this.enrichFeedItems(feedItems, userId);
            
            // If enrichment returned empty but cache had items, rebuild from database
            if (enrichedItems.length === 0 && feedItems.length > 0) {
              this.logger.warn(`Redis cache returned ${feedItems.length} items but enrichment failed, rebuilding from database`);
              // Continue to database rebuild below
            } else if (enrichedItems.length > 0) {
              return {
                data: enrichedItems,
                meta: {
                  total: cachedCount,
                  page,
                  limit,
                  total_pages: Math.ceil(cachedCount / limit),
                  has_next: skip + limit < cachedCount,
                  has_prev: page > 1,
                },
              };
            }
          }
        } else {
          this.logger.debug(`Redis cache empty for ${cacheKey}, building from database`);
        }
      } catch (error) {
        this.logger.warn(`Redis error for ${cacheKey}, falling back to database:`, error.message);
      }
    }

    // Cache miss - build from database
    let feed = await this.buildPersonalizedFeedFromDatabase(userId);
    this.logger.debug(`Personalized feed built: ${feed.length} items for user ${userId}`);

    // Fallback: If personalized feed is empty, show trending posts
    if (feed.length === 0) {
      this.logger.warn(`Personalized feed empty for user ${userId} (no follows/subscriptions/communities), falling back to trending feed`);
      feed = await this.buildTrendingFeedFromDatabase();
      this.logger.debug(`Trending feed built: ${feed.length} items`);
      
      // If still empty, check if there are any published posts at all
      if (feed.length === 0) {
        const totalPublishedPosts = await this.postRepository.count({
          where: { post_status: PostStatus.PUBLISHED },
        });
        this.logger.error(`CRITICAL: No posts found in trending feed. Total published posts in database: ${totalPublishedPosts}`);
      } else {
        this.logger.log(`Successfully loaded ${feed.length} posts from trending feed as fallback`);
      }
    } else {
      this.logger.log(`Personalized feed has ${feed.length} items from follows/subscriptions/communities`);
    }

    // Store in Redis (only if we have items, and clear cache if feed is empty to force rebuild)
    if (this.redis) {
      if (feed.length > 0) {
        await this.storeFeedInRedis(cacheKey, feed);
        this.logger.debug(`Stored ${feed.length} items in Redis cache: ${cacheKey}`);
      } else {
        // Clear empty cache to force rebuild next time
        try {
          await this.redis.del(cacheKey);
          this.logger.debug(`Cleared empty cache: ${cacheKey}`);
        } catch (error) {
          this.logger.warn(`Failed to clear cache: ${error.message}`);
        }
      }
    }

    // Return paginated results
    const paginatedItems = feed.slice(skip, skip + limit);
    this.logger.debug(`Paginating feed: ${feed.length} total items, returning ${paginatedItems.length} items (page ${page}, limit ${limit})`);
    
    const enrichedItems = await this.enrichFeedItems(paginatedItems, userId);
    this.logger.debug(`Final enriched feed: ${enrichedItems.length} items`);
    
    if (enrichedItems.length === 0 && feed.length > 0) {
      this.logger.error(`CRITICAL: Feed has ${feed.length} items but enrichment returned 0 items!`);
    }

    return {
      data: enrichedItems,
      meta: {
        total: feed.length,
        page,
        limit,
        total_pages: Math.ceil(feed.length / limit),
        has_next: skip + limit < feed.length,
        has_prev: page > 1,
      },
    };
  }

  /**
   * Get topic feed
   */
  async getTopicFeed(
    userId: number,
    topicId: number,
    page: number = 1,
    limit: number = 20,
  ): Promise<FeedResponseDto> {
    const cacheKey = `feed:topic:${topicId}`;
    const skip = (page - 1) * limit;

    // Try Redis first
    if (this.redis) {
      const cachedCount = await this.redis.zcard(cacheKey);
      if (cachedCount > 0) {
        const items = await this.redis.zrevrange(
          cacheKey,
          skip,
          skip + limit - 1,
          'WITHSCORES',
        );

        if (items.length > 0) {
          const feedItems = this.parseFeedItems(items);
          const enrichedItems = await this.enrichFeedItems(feedItems, userId);
          return {
            data: enrichedItems,
            meta: {
              total: cachedCount,
              page,
              limit,
              total_pages: Math.ceil(cachedCount / limit),
              has_next: skip + limit < cachedCount,
              has_prev: page > 1,
            },
          };
        }
      }
    }

    // Build from database
    const feed = await this.buildTopicFeedFromDatabase(topicId);

    // Store in Redis
    if (this.redis && feed.length > 0) {
      await this.storeFeedInRedis(cacheKey, feed);
    }

    const paginatedItems = feed.slice(skip, skip + limit);
    const enrichedItems = await this.enrichFeedItems(paginatedItems, userId);

    return {
      data: enrichedItems,
      meta: {
        total: feed.length,
        page,
        limit,
        total_pages: Math.ceil(feed.length / limit),
        has_next: skip + limit < feed.length,
        has_prev: page > 1,
      },
    };
  }

  /**
   * Get community feed
   */
  async getCommunityFeed(
    userId: number,
    communityId: number,
    page: number = 1,
    limit: number = 20,
  ): Promise<FeedResponseDto> {
    const cacheKey = `feed:community:${communityId}`;
    const skip = (page - 1) * limit;

    // Try Redis first
    if (this.redis) {
      const cachedCount = await this.redis.zcard(cacheKey);
      if (cachedCount > 0) {
        const items = await this.redis.zrevrange(
          cacheKey,
          skip,
          skip + limit - 1,
          'WITHSCORES',
        );

        if (items.length > 0) {
          const feedItems = this.parseFeedItems(items);
          const enrichedItems = await this.enrichFeedItems(feedItems, userId);
          return {
            data: enrichedItems,
            meta: {
              total: cachedCount,
              page,
              limit,
              total_pages: Math.ceil(cachedCount / limit),
              has_next: skip + limit < cachedCount,
              has_prev: page > 1,
            },
          };
        }
      }
    }

    // Build from database
    const feed = await this.buildCommunityFeedFromDatabase(communityId);

    // Store in Redis
    if (this.redis && feed.length > 0) {
      await this.storeFeedInRedis(cacheKey, feed);
    }

    const paginatedItems = feed.slice(skip, skip + limit);
    const enrichedItems = await this.enrichFeedItems(paginatedItems, userId);

    return {
      data: enrichedItems,
      meta: {
        total: feed.length,
        page,
        limit,
        total_pages: Math.ceil(feed.length / limit),
        has_next: skip + limit < feed.length,
        has_prev: page > 1,
      },
    };
  }

  /**
   * Get user feed
   */
  async getUserFeed(
    userId: number,
    targetUserId: number,
    page: number = 1,
    limit: number = 20,
  ): Promise<FeedResponseDto> {
    const cacheKey = `feed:user:${targetUserId}`;
    const skip = (page - 1) * limit;

    // Try Redis first
    if (this.redis) {
      const cachedCount = await this.redis.zcard(cacheKey);
      if (cachedCount > 0) {
        const items = await this.redis.zrevrange(
          cacheKey,
          skip,
          skip + limit - 1,
          'WITHSCORES',
        );

        if (items.length > 0) {
          const feedItems = this.parseFeedItems(items);
          const enrichedItems = await this.enrichFeedItems(feedItems, userId);
          return {
            data: enrichedItems,
            meta: {
              total: cachedCount,
              page,
              limit,
              total_pages: Math.ceil(cachedCount / limit),
              has_next: skip + limit < cachedCount,
              has_prev: page > 1,
            },
          };
        }
      }
    }

    // Build from database
    const feed = await this.buildUserFeedFromDatabase(targetUserId);

    // Store in Redis
    if (this.redis && feed.length > 0) {
      await this.storeFeedInRedis(cacheKey, feed);
    }

    const paginatedItems = feed.slice(skip, skip + limit);
    const enrichedItems = await this.enrichFeedItems(paginatedItems, userId);

    return {
      data: enrichedItems,
      meta: {
        total: feed.length,
        page,
        limit,
        total_pages: Math.ceil(feed.length / limit),
        has_next: skip + limit < feed.length,
        has_prev: page > 1,
      },
    };
  }

  /**
   * Get trending feed
   */
  async getTrendingFeed(
    userId: number,
    page: number = 1,
    limit: number = 20,
  ): Promise<FeedResponseDto> {
    const cacheKey = 'feed:trending';
    const skip = (page - 1) * limit;

    // Try Redis first
    if (this.redis) {
      try {
        const cachedCount = await this.redis.zcard(cacheKey);
        this.logger.debug(`Redis cache for ${cacheKey}: ${cachedCount} items`);
        
        if (cachedCount > 0) {
          const items = await this.redis.zrevrange(
            cacheKey,
            skip,
            skip + limit - 1,
            'WITHSCORES',
          );

          if (items.length > 0) {
            this.logger.debug(`Returning ${items.length} items from Redis cache`);
            const feedItems = this.parseFeedItems(items);
            const enrichedItems = await this.enrichFeedItems(feedItems, userId);
            
            // If enrichment returned empty but cache had items, rebuild from database
            if (enrichedItems.length === 0 && feedItems.length > 0) {
              this.logger.warn(`Redis cache returned ${feedItems.length} items but enrichment failed, rebuilding from database`);
              // Continue to database rebuild below
            } else if (enrichedItems.length > 0) {
              return {
                data: enrichedItems,
                meta: {
                  total: cachedCount,
                  page,
                  limit,
                  total_pages: Math.ceil(cachedCount / limit),
                  has_next: skip + limit < cachedCount,
                  has_prev: page > 1,
                },
              };
            }
          }
        } else {
          this.logger.debug(`Redis cache empty for ${cacheKey}, building from database`);
        }
      } catch (error) {
        this.logger.warn(`Redis error for ${cacheKey}, falling back to database:`, error.message);
      }
    }

    // Build from database (trending = high engagement)
    const feed = await this.buildTrendingFeedFromDatabase();
    this.logger.debug(`Trending feed built: ${feed.length} items`);

    // Store in Redis (only if we have items, and clear cache if feed is empty to force rebuild)
    if (this.redis) {
      if (feed.length > 0) {
        await this.storeFeedInRedis(cacheKey, feed);
        this.logger.debug(`Stored ${feed.length} items in Redis cache: ${cacheKey}`);
      } else {
        // Clear empty cache to force rebuild next time
        try {
          await this.redis.del(cacheKey);
          this.logger.debug(`Cleared empty cache: ${cacheKey}`);
        } catch (error) {
          this.logger.warn(`Failed to clear cache: ${error.message}`);
        }
      }
    }

    // Return paginated results
    const paginatedItems = feed.slice(skip, skip + limit);
    this.logger.debug(`Paginating feed: ${feed.length} total items, returning ${paginatedItems.length} items (page ${page}, limit ${limit})`);
    
    const enrichedItems = await this.enrichFeedItems(paginatedItems, userId);
    this.logger.debug(`Final enriched feed: ${enrichedItems.length} items`);
    
    if (enrichedItems.length === 0 && feed.length > 0) {
      this.logger.error(`CRITICAL: Feed has ${feed.length} items but enrichment returned 0 items!`);
    }

    return {
      data: enrichedItems,
      meta: {
        total: feed.length,
        page,
        limit,
        total_pages: Math.ceil(feed.length / limit),
        has_next: skip + limit < feed.length,
        has_prev: page > 1,
      },
    };
  }

  /**
   * Get polls-only feed (all polls from personalized feed sources)
   */
  async getPollsFeed(
    userId: number,
    page: number = 1,
    limit: number = 20,
  ): Promise<FeedResponseDto> {
    const cacheKey = `feed:polls:${userId}`;
    const skip = (page - 1) * limit;

    // Try Redis first
    if (this.redis) {
      try {
        const cachedCount = await this.redis.zcard(cacheKey);
        if (cachedCount > 0) {
          const items = await this.redis.zrevrange(
            cacheKey,
            skip,
            skip + limit - 1,
            'WITHSCORES',
          );

          if (items.length > 0) {
            const feedItems = this.parseFeedItems(items);
            const enrichedItems = await this.enrichFeedItems(feedItems, userId);
            
            if (enrichedItems.length > 0) {
              return {
                data: enrichedItems,
                meta: {
                  total: cachedCount,
                  page,
                  limit,
                  total_pages: Math.ceil(cachedCount / limit),
                  has_next: skip + limit < cachedCount,
                  has_prev: page > 1,
                },
              };
            }
          }
        }
      } catch (error) {
        this.logger.warn(`Redis error for ${cacheKey}, falling back to database:`, error.message);
      }
    }

    // Build polls feed from database
    const feed = await this.buildPollsFeedFromDatabase(userId);

    // Store in Redis
    if (this.redis && feed.length > 0) {
      await this.storeFeedInRedis(cacheKey, feed);
    }

    // Return paginated results
    const paginatedItems = feed.slice(skip, skip + limit);
    const enrichedItems = await this.enrichFeedItems(paginatedItems, userId);

    return {
      data: enrichedItems,
      meta: {
        total: feed.length,
        page,
        limit,
        total_pages: Math.ceil(feed.length / limit),
        has_next: skip + limit < feed.length,
        has_prev: page > 1,
      },
    };
  }

  /**
   * Get posts-only feed (all posts from personalized feed sources)
   */
  async getPostsFeed(
    userId: number,
    page: number = 1,
    limit: number = 20,
  ): Promise<FeedResponseDto> {
    const cacheKey = `feed:posts:${userId}`;
    const skip = (page - 1) * limit;

    // Try Redis first
    if (this.redis) {
      try {
        const cachedCount = await this.redis.zcard(cacheKey);
        if (cachedCount > 0) {
          const items = await this.redis.zrevrange(
            cacheKey,
            skip,
            skip + limit - 1,
            'WITHSCORES',
          );

          if (items.length > 0) {
            const feedItems = this.parseFeedItems(items);
            const enrichedItems = await this.enrichFeedItems(feedItems, userId);
            
            if (enrichedItems.length > 0) {
              return {
                data: enrichedItems,
                meta: {
                  total: cachedCount,
                  page,
                  limit,
                  total_pages: Math.ceil(cachedCount / limit),
                  has_next: skip + limit < cachedCount,
                  has_prev: page > 1,
                },
              };
            }
          }
        }
      } catch (error) {
        this.logger.warn(`Redis error for ${cacheKey}, falling back to database:`, error.message);
      }
    }

    // Build posts feed from database
    const feed = await this.buildPostsFeedFromDatabase(userId);

    // Store in Redis
    if (this.redis && feed.length > 0) {
      await this.storeFeedInRedis(cacheKey, feed);
    }

    // Return paginated results
    const paginatedItems = feed.slice(skip, skip + limit);
    const enrichedItems = await this.enrichFeedItems(paginatedItems, userId);

    return {
      data: enrichedItems,
      meta: {
        total: feed.length,
        page,
        limit,
        total_pages: Math.ceil(feed.length / limit),
        has_next: skip + limit < feed.length,
        has_prev: page > 1,
      },
    };
  }

  /**
   * Build personalized feed from database
   */
  private async buildPersonalizedFeedFromDatabase(
    userId: number,
  ): Promise<FeedItem[]> {
    const feed: FeedItem[] = [];

    // Get followed users
    const followedUsers = await this.followerRepository.find({
      where: { follower_id: userId, is_active: true },
      select: ['user_id'],
    });
    const followedUserIds = followedUsers.map((f) => f.user_id);
    this.logger.debug(`User ${userId} follows ${followedUserIds.length} users`);

    // Get subscribed topics
    const subscribedTopics = await this.topicRepository.find({
      where: { user_id: userId, is_active: true },
      select: ['topic_id'],
    });
    const subscribedTopicIds = subscribedTopics.map((t) => t.topic_id);
    this.logger.debug(`User ${userId} subscribed to ${subscribedTopicIds.length} topics`);

    // Get joined communities
    const joinedCommunities = await this.communityUserRepository.find({
      where: { user_id: userId, is_active: true },
      select: ['community_id'],
    });
    const communityIds = joinedCommunities.map((c) => c.community_id);
    this.logger.debug(`User ${userId} joined ${communityIds.length} communities`);

    // Get posts from followed users
    if (followedUserIds.length > 0) {
      const posts = await this.postRepository.find({
        where: {
          user_id: In(followedUserIds),
          post_status: PostStatus.PUBLISHED,
        },
        order: { created_at: 'DESC' },
        take: 50,
        select: ['id', 'user_id', 'created_at'],
      });
      this.logger.debug(`Found ${posts.length} posts from ${followedUserIds.length} followed users`);
      posts.forEach((post) => {
        feed.push({
          type: 'post',
          id: post.id,
          user_id: post.user_id,
          created_at: post.created_at.getTime(),
        });
      });
    }

    // Get posts from subscribed topics
    if (subscribedTopicIds.length > 0) {
      const posts = await this.postRepository.find({
        where: {
          post_topic_id: In(subscribedTopicIds),
          post_status: PostStatus.PUBLISHED,
        },
        order: { created_at: 'DESC' },
        take: 50,
        select: ['id', 'user_id', 'created_at'],
      });
      this.logger.debug(`Found ${posts.length} posts from ${subscribedTopicIds.length} subscribed topics`);
      posts.forEach((post) => {
        feed.push({
          type: 'post',
          id: post.id,
          user_id: post.user_id,
          created_at: post.created_at.getTime(),
        });
      });
    }

    // Get posts from joined communities
    if (communityIds.length > 0) {
      // Build OR conditions for each community ID (MySQL doesn't support LIKE ANY)
      const communityConditions = communityIds
        .map((id, index) => {
          return `(post.community_ids LIKE :community_id_${index} OR post.community_ids LIKE :community_id_start_${index} OR post.community_ids LIKE :community_id_end_${index} OR post.community_ids LIKE :community_id_middle_${index})`;
        })
        .join(' OR ');

      const queryBuilder = this.postRepository
        .createQueryBuilder('post')
        .where('post.post_status = :status', { status: PostStatus.PUBLISHED })
        .andWhere(`(${communityConditions})`);

      // Set parameters for each community ID
      communityIds.forEach((id, index) => {
        queryBuilder.setParameter(`community_id_${index}`, `${id}`);
        queryBuilder.setParameter(`community_id_start_${index}`, `${id},%`);
        queryBuilder.setParameter(`community_id_end_${index}`, `%,${id}`);
        queryBuilder.setParameter(`community_id_middle_${index}`, `%,${id},%`);
      });

      const posts = await queryBuilder
        .orderBy('post.created_at', 'DESC')
        .take(50)
        .select(['post.id', 'post.user_id', 'post.created_at'])
        .getMany();

      this.logger.debug(`Found ${posts.length} posts from ${communityIds.length} communities for user ${userId}`);

      posts.forEach((post) => {
        feed.push({
          type: 'post',
          id: post.id,
          user_id: post.user_id,
          created_at: post.created_at.getTime(),
        });
      });
    }

    // Get recent published posts (with or without community) to ensure all posts appear in feed
    const recentPosts = await this.postRepository.find({
      where: {
        post_status: PostStatus.PUBLISHED,
      },
      order: { created_at: 'DESC' },
      take: 50,
      select: ['id', 'user_id', 'created_at'],
    });
    this.logger.debug(`Found ${recentPosts.length} recent published posts (with and without community)`);
    recentPosts.forEach((post) => {
      feed.push({
        type: 'post',
        id: post.id,
        user_id: post.user_id,
        created_at: post.created_at.getTime(),
      });
    });

    // Get polls from followed users
    if (followedUserIds.length > 0) {
      const polls = await this.pollRepository
        .createQueryBuilder('poll')
        .where('poll.user_id IN (:...userIds)', { userIds: followedUserIds })
        .andWhere('poll.poll_status = :status', { status: PollStatus.PUBLISHED })
        .andWhere('(poll.poll_expires_at IS NULL OR poll.poll_expires_at > :now)', { now: new Date() })
        .orderBy('poll.created_at', 'DESC')
        .take(50)
        .select(['poll.id', 'poll.user_id', 'poll.created_at'])
        .getMany();

      this.logger.debug(`Found ${polls.length} polls from ${followedUserIds.length} followed users`);

      polls.forEach((poll) => {
        feed.push({
          type: 'poll',
          id: poll.id,
          user_id: poll.user_id,
          created_at: poll.created_at.getTime(),
        });
      });
    }

    // Note: Polls don't have community_ids

    // Add joined communities as feed items
    if (communityIds.length > 0) {
      const communities = await this.communityRepository.find({
        where: {
          id: In(communityIds),
          is_active: true,
        },
        order: { created_at: 'DESC' },
        take: 20,
        select: ['id', 'created_at'],
      });

      communities.forEach((community) => {
        feed.push({
          type: 'community',
          id: community.id,
          created_at: community.created_at.getTime(),
        });
      });
    }

    // Remove duplicates and sort by created_at
    const uniqueFeed = feed.filter(
      (item, index, self) =>
        index ===
        self.findIndex((t) => t.type === item.type && t.id === item.id),
    );
    uniqueFeed.sort((a, b) => b.created_at - a.created_at);

    this.logger.debug(`Personalized feed built: ${uniqueFeed.length} unique items (${feed.length} before deduplication)`);

    return uniqueFeed.slice(0, 200); // Limit to 200 items
  }

  /**
   * Build topic feed from database
   */
  private async buildTopicFeedFromDatabase(topicId: number): Promise<FeedItem[]> {
    const feed: FeedItem[] = [];

    // Get posts from topic
    const posts = await this.postRepository.find({
      where: {
        post_topic_id: topicId,
        post_status: PostStatus.PUBLISHED,
      },
      order: { created_at: 'DESC' },
      take: 100,
      select: ['id', 'user_id', 'created_at'],
    });

    posts.forEach((post) => {
      feed.push({
        type: 'post',
        id: post.id,
        user_id: post.user_id,
        created_at: post.created_at.getTime(),
      });
    });

    return feed;
  }

  /**
   * Build community feed from database
   */
  private async buildCommunityFeedFromDatabase(
    communityId: number,
  ): Promise<FeedItem[]> {
    const feed: FeedItem[] = [];

    // Get posts from community
    const posts = await this.postRepository
      .createQueryBuilder('post')
      .where('post.post_status = :status', { status: PostStatus.PUBLISHED })
      .andWhere(
        '(post.community_ids LIKE :communityId OR post.community_ids LIKE :communityId_start OR post.community_ids LIKE :communityId_end OR post.community_ids LIKE :communityId_middle)',
        {
          communityId: `${communityId}`,
          communityId_start: `${communityId},%`,
          communityId_end: `%,${communityId}`,
          communityId_middle: `%,${communityId},%`,
        },
      )
      .orderBy('post.created_at', 'DESC')
      .take(100)
      .select(['post.id', 'post.user_id', 'post.created_at'])
      .getMany();

    posts.forEach((post) => {
      feed.push({
        type: 'post',
        id: post.id,
        user_id: post.user_id,
        created_at: post.created_at.getTime(),
      });
    });

    // Get polls from community
    const polls = await this.pollRepository
      .createQueryBuilder('poll')
      .where('poll.poll_status = :status', { status: PollStatus.PUBLISHED })
      .andWhere('(poll.poll_expires_at IS NULL OR poll.poll_expires_at > :now)', { now: new Date() })
      .andWhere(`poll.community_ids LIKE :communityId`, {
        communityId: `%,${communityId},%`,
      })
      .orderBy('poll.created_at', 'DESC')
      .take(100)
      .select(['poll.id', 'poll.user_id', 'poll.created_at'])
      .getMany();

    polls.forEach((poll) => {
      feed.push({
        type: 'poll',
        id: poll.id,
        user_id: poll.user_id,
        created_at: poll.created_at.getTime(),
      });
    });

    feed.sort((a, b) => b.created_at - a.created_at);
    return feed;
  }

  /**
   * Build user feed from database
   */
  private async buildUserFeedFromDatabase(userId: number): Promise<FeedItem[]> {
    const feed: FeedItem[] = [];

    // Get user posts
    const posts = await this.postRepository.find({
      where: {
        user_id: userId,
        post_status: PostStatus.PUBLISHED,
      },
      order: { created_at: 'DESC' },
      take: 100,
      select: ['id', 'user_id', 'created_at'],
    });

    posts.forEach((post) => {
      feed.push({
        type: 'post',
        id: post.id,
        user_id: post.user_id,
        created_at: post.created_at.getTime(),
      });
    });

    // Get user polls
    const polls = await this.pollRepository
      .createQueryBuilder('poll')
      .where('poll.user_id = :userId', { userId })
      .andWhere('poll.poll_status = :status', { status: PollStatus.PUBLISHED })
      .andWhere('(poll.poll_expires_at IS NULL OR poll.poll_expires_at > :now)', { now: new Date() })
      .orderBy('poll.created_at', 'DESC')
      .take(100)
      .select(['poll.id', 'poll.user_id', 'poll.created_at'])
      .getMany();

    polls.forEach((poll) => {
      feed.push({
        type: 'poll',
        id: poll.id,
        user_id: poll.user_id,
        created_at: poll.created_at.getTime(),
      });
    });

    feed.sort((a, b) => b.created_at - a.created_at);
    return feed;
  }

  /**
   * Build trending feed from database (high engagement)
   */
  private async buildTrendingFeedFromDatabase(): Promise<FeedItem[]> {
    const feed: FeedItem[] = [];

    // Get trending posts (high like_count + comment_count)
    // First, try with engagement sorting
    let posts = await this.postRepository
      .createQueryBuilder('post')
      .where('post.post_status = :status', { status: PostStatus.PUBLISHED })
      .orderBy('post.like_count + post.comment_count', 'DESC')
      .addOrderBy('post.created_at', 'DESC')
      .take(100)
      .select(['post.id', 'post.user_id', 'post.created_at', 'post.like_count', 'post.comment_count'])
      .getMany();

    // If no posts found, try simpler query (in case of SQL syntax issues)
    if (posts.length === 0) {
      this.logger.warn('No posts found with engagement sorting, trying simple query');
      posts = await this.postRepository.find({
        where: { post_status: PostStatus.PUBLISHED },
        order: { created_at: 'DESC' },
        take: 100,
        select: ['id', 'user_id', 'created_at', 'like_count', 'comment_count'],
      });
    }

    this.logger.debug(`Found ${posts.length} published posts for trending feed`);

    if (posts.length === 0) {
      // Double-check with a count query
      const totalCount = await this.postRepository.count({
        where: { post_status: PostStatus.PUBLISHED },
      });
      this.logger.error(`CRITICAL: No posts found in trending feed query, but database has ${totalCount} published posts!`);
    }

    posts.forEach((post) => {
      feed.push({
        type: 'post',
        id: post.id,
        user_id: post.user_id,
        created_at: post.created_at.getTime(),
        score: (post as any).like_count + (post as any).comment_count,
      });
    });

    // Get trending polls (high vote_count)
    // Note: Only get non-expired polls, or polls without expiration date
    const polls = await this.pollRepository
      .createQueryBuilder('poll')
      .where('poll.poll_status = :status', { status: PollStatus.PUBLISHED })
      .andWhere('(poll.poll_expires_at IS NULL OR poll.poll_expires_at > :now)', { now: new Date() })
      .orderBy('poll.vote_count', 'DESC')
      .addOrderBy('poll.created_at', 'DESC')
      .take(100)
      .select(['poll.id', 'poll.user_id', 'poll.created_at', 'poll.vote_count'])
      .getMany();

    this.logger.debug(`Found ${polls.length} published polls for trending feed`);

    polls.forEach((poll) => {
      feed.push({
        type: 'poll',
        id: poll.id,
        user_id: poll.user_id,
        created_at: poll.created_at.getTime(),
        score: (poll as any).vote_count,
      });
    });

    feed.sort((a, b) => {
      const scoreA = a.score || 0;
      const scoreB = b.score || 0;
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }
      return b.created_at - a.created_at;
    });

    return feed;
  }

  /**
   * Build polls-only feed from database (from followed users, subscribed topics, joined communities)
   */
  private async buildPollsFeedFromDatabase(
    userId: number,
  ): Promise<FeedItem[]> {
    const feed: FeedItem[] = [];

    // Get followed users
    const followedUsers = await this.followerRepository.find({
      where: { follower_id: userId, is_active: true },
      select: ['user_id'],
    });
    const followedUserIds = followedUsers.map((f) => f.user_id);

    // Get subscribed topics
    const subscribedTopics = await this.topicRepository.find({
      where: { user_id: userId, is_active: true },
      select: ['topic_id'],
    });
    const subscribedTopicIds = subscribedTopics.map((t) => t.topic_id);

    // Get joined communities
    const joinedCommunities = await this.communityUserRepository.find({
      where: { user_id: userId, is_active: true },
      select: ['community_id'],
    });
    const communityIds = joinedCommunities.map((c) => c.community_id);

    // Get polls from followed users
    if (followedUserIds.length > 0) {
      const polls = await this.pollRepository
        .createQueryBuilder('poll')
        .where('poll.user_id IN (:...userIds)', { userIds: followedUserIds })
        .andWhere('poll.poll_status = :status', { status: PollStatus.PUBLISHED })
        .andWhere('(poll.poll_expires_at IS NULL OR poll.poll_expires_at > :now)', { now: new Date() })
        .orderBy('poll.created_at', 'DESC')
        .take(100)
        .select(['poll.id', 'poll.user_id', 'poll.created_at'])
        .getMany();
      
      polls.forEach((poll) => {
        feed.push({
          type: 'poll',
          id: poll.id,
          user_id: poll.user_id,
          created_at: poll.created_at.getTime(),
        });
      });
    }

    // Note: Polls don't have topics or communities in this system
    // So we only get polls from followed users

    // Remove duplicates and sort by created_at
    const uniqueFeed = feed.filter(
      (item, index, self) =>
        index ===
        self.findIndex((t) => t.type === item.type && t.id === item.id),
    );
    uniqueFeed.sort((a, b) => b.created_at - a.created_at);

    return uniqueFeed.slice(0, 200); // Limit to 200 items
  }

  /**
   * Build posts-only feed from database (from followed users, subscribed topics, joined communities)
   */
  private async buildPostsFeedFromDatabase(
    userId: number,
  ): Promise<FeedItem[]> {
    const feed: FeedItem[] = [];

    // Get followed users
    const followedUsers = await this.followerRepository.find({
      where: { follower_id: userId, is_active: true },
      select: ['user_id'],
    });
    const followedUserIds = followedUsers.map((f) => f.user_id);

    // Get subscribed topics
    const subscribedTopics = await this.topicRepository.find({
      where: { user_id: userId, is_active: true },
      select: ['topic_id'],
    });
    const subscribedTopicIds = subscribedTopics.map((t) => t.topic_id);

    // Get joined communities
    const joinedCommunities = await this.communityUserRepository.find({
      where: { user_id: userId, is_active: true },
      select: ['community_id'],
    });
    const communityIds = joinedCommunities.map((c) => c.community_id);

    // Get posts from followed users
    if (followedUserIds.length > 0) {
      const posts = await this.postRepository.find({
        where: {
          user_id: In(followedUserIds),
          post_status: PostStatus.PUBLISHED,
        },
        order: { created_at: 'DESC' },
        take: 100,
        select: ['id', 'user_id', 'created_at'],
      });
      posts.forEach((post) => {
        feed.push({
          type: 'post',
          id: post.id,
          user_id: post.user_id,
          created_at: post.created_at.getTime(),
        });
      });
    }

    // Get posts from subscribed topics
    if (subscribedTopicIds.length > 0) {
      const posts = await this.postRepository.find({
        where: {
          post_topic_id: In(subscribedTopicIds),
          post_status: PostStatus.PUBLISHED,
        },
        order: { created_at: 'DESC' },
        take: 100,
        select: ['id', 'user_id', 'created_at'],
      });
      posts.forEach((post) => {
        feed.push({
          type: 'post',
          id: post.id,
          user_id: post.user_id,
          created_at: post.created_at.getTime(),
        });
      });
    }

    // Get posts from joined communities
    if (communityIds.length > 0) {
      const communityConditions = communityIds
        .map((id, index) => {
          return `(post.community_ids LIKE :community_id_${index} OR post.community_ids LIKE :community_id_start_${index} OR post.community_ids LIKE :community_id_end_${index} OR post.community_ids LIKE :community_id_middle_${index})`;
        })
        .join(' OR ');

      const queryBuilder = this.postRepository
        .createQueryBuilder('post')
        .where('post.post_status = :status', { status: PostStatus.PUBLISHED })
        .andWhere(`(${communityConditions})`);

      communityIds.forEach((id, index) => {
        queryBuilder.setParameter(`community_id_${index}`, `${id}`);
        queryBuilder.setParameter(`community_id_start_${index}`, `${id},%`);
        queryBuilder.setParameter(`community_id_end_${index}`, `%,${id}`);
        queryBuilder.setParameter(`community_id_middle_${index}`, `%,${id},%`);
      });

      const posts = await queryBuilder
        .orderBy('post.created_at', 'DESC')
        .take(100)
        .select(['post.id', 'post.user_id', 'post.created_at'])
        .getMany();

      posts.forEach((post) => {
        feed.push({
          type: 'post',
          id: post.id,
          user_id: post.user_id,
          created_at: post.created_at.getTime(),
        });
      });
    }

    // Get recent published posts (with or without community) to ensure all posts appear in feed
    const recentPosts = await this.postRepository.find({
      where: {
        post_status: PostStatus.PUBLISHED,
      },
      order: { created_at: 'DESC' },
      take: 100,
      select: ['id', 'user_id', 'created_at'],
    });
    this.logger.debug(`Found ${recentPosts.length} recent published posts (with and without community)`);
    recentPosts.forEach((post) => {
      feed.push({
        type: 'post',
        id: post.id,
        user_id: post.user_id,
        created_at: post.created_at.getTime(),
      });
    });

    // Remove duplicates and sort by created_at
    const uniqueFeed = feed.filter(
      (item, index, self) =>
        index ===
        self.findIndex((t) => t.type === item.type && t.id === item.id),
    );
    uniqueFeed.sort((a, b) => b.created_at - a.created_at);

    return uniqueFeed.slice(0, 200); // Limit to 200 items
  }

  /**
   * Store feed in Redis
   */
  private async storeFeedInRedis(
    cacheKey: string,
    feed: FeedItem[],
  ): Promise<void> {
    if (!this.redis) return;

    try {
      const pipeline = this.redis.pipeline();
      feed.forEach((item) => {
        const value = JSON.stringify({
          type: item.type,
          id: item.id,
          user_id: item.user_id,
          created_at: item.created_at,
        });
        pipeline.zadd(cacheKey, item.created_at, value);
      });
      pipeline.expire(cacheKey, 1800); // 30 minutes TTL
      await pipeline.exec();
    } catch (error) {
      this.logger.error('Failed to store feed in Redis:', error.message);
    }
  }

  /**
   * Parse feed items from Redis
   */
  private parseFeedItems(items: string[]): FeedItem[] {
    const feedItems: FeedItem[] = [];
    for (let i = 0; i < items.length; i += 2) {
      const value = items[i];
      const score = parseFloat(items[i + 1]);
      try {
        const parsed = JSON.parse(value);
        feedItems.push({
          type: parsed.type,
          id: parsed.id,
          user_id: parsed.user_id,
          created_at: parsed.created_at || score,
        });
      } catch (error) {
        this.logger.warn('Failed to parse feed item:', value);
      }
    }
    return feedItems;
  }

  /**
   * Enrich feed items with full data
   */
  private async enrichFeedItems(
    items: FeedItem[],
    userId: number,
  ): Promise<FeedItemDto[]> {
    const enrichedItems: FeedItemDto[] = [];
    this.logger.debug(`Enriching ${items.length} feed items for user ${userId}`);

    for (const item of items) {
      try {
        if (item.type === 'post') {
          try {
            // Skip view count increment for feed items
            const post = await this.postService.getPostById(item.id, userId, true);
            
            if (!post) {
              this.logger.warn(`Post ${item.id} not found during enrichment`);
              continue;
            }

            // Verify post is still published (might have been changed)
            if (post.post_status !== PostStatus.PUBLISHED) {
              this.logger.warn(`Post ${item.id} is not published (status: ${post.post_status}), skipping`);
              continue;
            }
            
            // Truncate post content for feed display (max 180 characters, plain text).
            // Full content is available on the post detail screen.
            // isMore: 'yes' when the original content exceeds the limit, 'no' otherwise.
            const { content: truncatedContent, isMore } = this.truncateContentWithFlag(
              post.post_content,
              180,
            );
            const truncatedPost = {
              ...post,
              post_content: truncatedContent,
              isMore,
            };
            
            enrichedItems.push({
              type: 'post',
              id: item.id,
              user_id: item.user_id,
              created_at: new Date(item.created_at),
              post: truncatedPost as any,
            });
          } catch (error) {
            // getPostById throws NotFoundException if post doesn't exist
            if (error instanceof NotFoundException) {
              this.logger.warn(`Post ${item.id} not found (deleted or doesn't exist)`);
            } else {
              this.logger.error(`Error enriching post ${item.id}:`, error.message);
            }
          }
        } else if (item.type === 'poll') {
          // Skip view count increment for feed items
          // Poll options are already included via getPollById which loads the 'options' relation
          const poll = await this.pollService.getPollById(item.id, userId, true);
          
          if (!poll) {
            this.logger.warn(`Poll ${item.id} not found during enrichment`);
            continue;
          }
          
          // Remove community_ids from poll data (polls don't have communities)
          const { community_ids, ...pollWithoutCommunities } = poll as any;
          
          enrichedItems.push({
            type: 'poll',
            id: item.id,
            user_id: item.user_id,
            created_at: new Date(item.created_at),
            poll: pollWithoutCommunities as any,
          });
        } else if (item.type === 'community') {
          // Get community details
          const community = await this.communityRepository.findOne({
            where: { id: item.id },
            select: [
              'id',
              'community_slug',
              'community_name',
              'community_description',
              'community_image',
              'is_active',
              'created_by',
              'updated_by',
              'created_at',
              'updated_at',
            ],
          });

          if (community) {
            enrichedItems.push({
              type: 'community',
              id: item.id,
              created_at: new Date(item.created_at),
              community: community as any,
            });
          } else {
            this.logger.warn(`Community ${item.id} not found during enrichment`);
          }
        }
      } catch (error) {
        this.logger.error(`Failed to enrich ${item.type} ${item.id}:`, error.message);
        this.logger.error(`Error stack:`, error.stack);
      }
    }

    this.logger.debug(`Successfully enriched ${enrichedItems.length} out of ${items.length} feed items`);

    // Enrich with user profile pictures, main topics, communities, and follow status
    let enriched = await this.enrichWithUserProfilePictures(enrichedItems);
    enriched = await this.enrichWithMainTopics(enriched);
    enriched = await this.enrichWithCommunities(enriched, userId);
    enriched = await this.enrichWithFollowStatus(enriched, userId);
    enriched = await this.enrichWithCommunityDetails(enriched, userId);
    return enriched;
  }

  /**
   * Enrich feed items with user profile pictures and full name
   */
  private async enrichWithUserProfilePictures(
    items: FeedItemDto[],
  ): Promise<FeedItemDto[]> {
    // Collect all unique user IDs
    const userIds = new Set<number>();
    items.forEach((item) => {
      if (item.post?.user?.id) {
        userIds.add(item.post.user.id);
      }
      if (item.poll?.user?.id) {
        userIds.add(item.poll.user.id);
      }
    });

    if (userIds.size === 0) {
      return items;
    }

    // Batch fetch profile pictures and full names for all users
    const profiles = await this.profileRepository.find({
      where: { user_id: In(Array.from(userIds)) },
      select: ['user_id', 'profile_picture', 'full_name'],
    });

    // Create maps of user_id -> profile_picture and user_id -> full_name
    const profileMap = new Map<number, string | null>();
    const fullNameMap = new Map<number, string | null>();
    profiles.forEach((profile) => {
      profileMap.set(profile.user_id, profile.profile_picture);
      fullNameMap.set(profile.user_id, profile.full_name);
    });

    // Add profile pictures, full names, and image alias to feed items
    return items.map((item) => {
      if (item.post?.user) {
        const profilePicture = profileMap.get(item.post.user.id) || null;
        const fullName = fullNameMap.get(item.post.user.id) || null;
        // Use full_name if available, otherwise fallback to username
        const name = fullName || item.post.user.username || null;
        item.post.user = {
          ...item.post.user,
          profile_picture: profilePicture,
          name: name,
          image: profilePicture, // Alias for profile_picture
        } as any;
      }
      if (item.poll?.user) {
        const profilePicture = profileMap.get(item.poll.user.id) || null;
        const fullName = fullNameMap.get(item.poll.user.id) || null;
        // Use full_name if available, otherwise fallback to username
        const name = fullName || item.poll.user.username || null;
        item.poll.user = {
          ...item.poll.user,
          profile_picture: profilePicture,
          name: name,
          image: profilePicture, // Alias for profile_picture
        } as any;
      }
      return item;
    });
  }

  /**
   * Get main topic name from a topic ID (traverse up to find parent with parent_id = 0)
   */
  private async getMainTopicName(topicId: number | null): Promise<string | null> {
    if (!topicId) return null;

    try {
      let currentTopic = await this.topicEntityRepository.findOne({
        where: { id: topicId },
        select: ['id', 'parent_id', 'topic_name'],
      });

      if (!currentTopic) return null;

      // Traverse up to find main topic (parent_id = 0)
      while (currentTopic && currentTopic.parent_id !== 0) {
        currentTopic = await this.topicEntityRepository.findOne({
          where: { id: currentTopic.parent_id },
          select: ['id', 'parent_id', 'topic_name'],
        });
        if (!currentTopic) break;
      }

      return currentTopic?.topic_name || null;
    } catch (error) {
      this.logger.warn(`Failed to get main topic for topic ${topicId}:`, error.message);
      return null;
    }
  }

  /**
   * Get main topic for a community
   */
  private async getCommunityMainTopic(communityId: number): Promise<string | null> {
    try {
      // Get the first active topic for the community
      const communityTopic = await this.communityTopicRepository.findOne({
        where: { community_id: communityId, is_active: true },
        relations: ['topic'],
      });

      if (!communityTopic || !communityTopic.topic) return null;

      // Get main topic name
      return this.getMainTopicName(communityTopic.topic.id);
    } catch (error) {
      this.logger.warn(`Failed to get main topic for community ${communityId}:`, error.message);
      return null;
    }
  }

  /**
   * Enrich feed items with main topic names
   */
  private async enrichWithMainTopics(items: FeedItemDto[]): Promise<FeedItemDto[]> {
    const topicIds = new Set<number>();
    
    // Collect all topic IDs from posts
    items.forEach((item) => {
      if (item.post?.post_topic_id) {
        topicIds.add(item.post.post_topic_id);
      }
    });

    if (topicIds.size === 0) {
      return items;
    }

    // Batch fetch main topic names
    const mainTopicMap = new Map<number, string | null>();
    await Promise.all(
      Array.from(topicIds).map(async (topicId) => {
        const mainTopicName = await this.getMainTopicName(topicId);
        mainTopicMap.set(topicId, mainTopicName);
      }),
    );

    // Add main topic names to posts
    return items.map((item) => {
      if (item.post?.post_topic_id) {
        const mainTopicName = mainTopicMap.get(item.post.post_topic_id) || null;
        item.post = {
          ...item.post,
          main_topic_name: mainTopicName,
        } as any;
      }
      return item;
    });
  }

  /**
   * Enrich feed items with community data
   */
  private async enrichWithCommunities(
    items: FeedItemDto[],
    userId: number,
  ): Promise<FeedItemDto[]> {
    const communityIds = new Set<number>();

    // Collect all community IDs from posts only (polls don't have communities)
    items.forEach((item) => {
      if (item.post?.community_ids) {
        const ids = item.post.community_ids
          .split(',')
          .map((id) => parseInt(id.trim(), 10))
          .filter((id) => !isNaN(id));
        ids.forEach((id) => communityIds.add(id));
      }
      // Polls don't have communities, so skip them
    });

    if (communityIds.size === 0) {
      return items;
    }

    // Batch fetch communities
    const communities = await this.communityRepository.find({
      where: { id: In(Array.from(communityIds)) },
      select: ['id', 'community_name', 'community_image'],
    });

    // Batch fetch community memberships for logged user
    const userMemberships = await this.communityUserRepository.find({
      where: {
        community_id: In(Array.from(communityIds)),
        user_id: userId,
        is_active: true,
      },
      select: ['community_id'],
    });
    const followedCommunityIds = new Set(userMemberships.map((m) => m.community_id));

    // Batch fetch main topics for communities
    const communityMainTopics = new Map<number, string | null>();
    await Promise.all(
      communities.map(async (community) => {
        const mainTopic = await this.getCommunityMainTopic(community.id);
        communityMainTopics.set(community.id, mainTopic);
      }),
    );

    // Create community map
    const communityMap = new Map<number, any>();
    communities.forEach((community) => {
      communityMap.set(community.id, {
        id: community.id,
        name: community.community_name,
        pic: community.community_image,
        topic_main: communityMainTopics.get(community.id) || null,
        is_followed: followedCommunityIds.has(community.id),
      });
    });

    // Add communities to posts and polls
    return items.map((item) => {
      if (item.post?.community_ids) {
        const ids = item.post.community_ids
          .split(',')
          .map((id) => parseInt(id.trim(), 10))
          .filter((id) => !isNaN(id));
        const communities = ids
          .map((id) => communityMap.get(id))
          .filter((c) => c !== undefined);
        
        if (communities.length > 0) {
          item.post = {
            ...item.post,
            communities: communities,
          } as any;
        }
      }
      // Polls don't have communities, so skip community enrichment for polls
      return item;
    });
  }

  /**
   * Enrich feed items with follow status (is logged user following the post/poll user)
   */
  private async enrichWithFollowStatus(
    items: FeedItemDto[],
    userId: number,
  ): Promise<FeedItemDto[]> {
    const userIds = new Set<number>();
    
    // Collect all user IDs from posts and polls
    items.forEach((item) => {
      if (item.post?.user?.id) {
        userIds.add(item.post.user.id);
      }
      if (item.poll?.user?.id) {
        userIds.add(item.poll.user.id);
      }
    });

    if (userIds.size === 0) {
      return items;
    }

    // Batch fetch follow relationships
    const follows = await this.followerRepository.find({
      where: {
        user_id: In(Array.from(userIds)),
        follower_id: userId,
        is_active: true,
      },
      select: ['user_id'],
    });

    const followedUserIds = new Set(follows.map((f) => f.user_id));

    // Add is_followed to user objects
    return items.map((item) => {
      if (item.post?.user) {
        item.post.user = {
          ...item.post.user,
          is_followed: followedUserIds.has(item.post.user.id),
        } as any;
      }
      if (item.poll?.user) {
        item.poll.user = {
          ...item.poll.user,
          is_followed: followedUserIds.has(item.poll.user.id),
        } as any;
      }
      return item;
    });
  }

  /**
   * Enrich community feed items with main topic and follow status
   */
  private async enrichWithCommunityDetails(
    items: FeedItemDto[],
    userId: number,
  ): Promise<FeedItemDto[]> {
    const communityIds: number[] = [];
    
    // Collect all community IDs from community feed items
    items.forEach((item) => {
      if (item.type === 'community' && item.community?.id) {
        communityIds.push(item.community.id);
      }
    });

    if (communityIds.length === 0) {
      return items;
    }

    // Batch fetch community memberships for logged user
    const userMemberships = await this.communityUserRepository.find({
      where: {
        community_id: In(communityIds),
        user_id: userId,
        is_active: true,
      },
      select: ['community_id'],
    });
    const followedCommunityIds = new Set(userMemberships.map((m) => m.community_id));

    // Batch fetch main topics for communities
    const communityMainTopics = new Map<number, string | null>();
    await Promise.all(
      communityIds.map(async (communityId) => {
        const mainTopic = await this.getCommunityMainTopic(communityId);
        communityMainTopics.set(communityId, mainTopic);
      }),
    );

    // Add main topic and follow status to community items
    return items.map((item) => {
      if (item.type === 'community' && item.community) {
        item.community = {
          ...item.community,
          topic_main: communityMainTopics.get(item.community.id) || null,
          is_followed: followedCommunityIds.has(item.community.id),
        } as any;
      }
      return item;
    });
  }

  /**
   * Truncate content for feed display.
   * Strips HTML tags first (so 180 chars = 180 visible characters),
   * decodes common HTML entities, collapses whitespace, and truncates at a word boundary.
   * The full HTML content remains available on the post detail screen.
   */
  private truncateContent(content: string, maxLength: number = 180): string {
    return this.truncateContentWithFlag(content, maxLength).content;
  }

  /**
   * Same as truncateContent but also returns an isMore flag.
   * Used by feed enrichment so the mobile app can conditionally show a "Show More" button.
   * - isMore: 'yes' — original content exceeded maxLength (was truncated)
   * - isMore: 'no'  — content fits within maxLength (not truncated)
   */
  private truncateContentWithFlag(
    content: string,
    maxLength: number = 180,
  ): { content: string; isMore: 'yes' | 'no' } {
    if (!content) return { content, isMore: 'no' };

    // 1. Strip HTML tags
    let text = content.replace(/<[^>]*>/g, ' ');

    // 2. Decode common HTML entities
    text = text
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'");

    // 3. Collapse whitespace
    text = text.replace(/\s+/g, ' ').trim();

    if (text.length <= maxLength) {
      return { content: text, isMore: 'no' };
    }

    // 4. Truncate at word boundary if possible
    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    const finalContent =
      lastSpace > maxLength * 0.8
        ? truncated.substring(0, lastSpace) + '...'
        : truncated + '...';

    return { content: finalContent, isMore: 'yes' };
  }

  /**
   * Invalidate feed cache
   */
  async invalidateFeedCache(userId?: number, topicId?: number, communityId?: number): Promise<void> {
    if (!this.redis) return;

    try {
      const pipeline = this.redis.pipeline();
      
      if (userId) {
        pipeline.del(`feed:timeline:${userId}`);
        pipeline.del(`feed:user:${userId}`);
        pipeline.del(`feed:polls:${userId}`);
        pipeline.del(`feed:posts:${userId}`);
      }
      
      if (topicId) {
        pipeline.del(`feed:topic:${topicId}`);
      }
      
      if (communityId) {
        pipeline.del(`feed:community:${communityId}`);
      }
      
      pipeline.del('feed:trending');
      await pipeline.exec();
    } catch (error) {
      this.logger.error('Failed to invalidate feed cache:', error.message);
    }
  }
}

