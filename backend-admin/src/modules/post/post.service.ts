import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, In } from 'typeorm';
import { createHash } from 'crypto';
import { UserPost, PostStatus, PostType } from './entities/user-post.entity';
import { PostLike, LikeStatus } from './entities/post-like.entity';
import { Topic } from '../general/entities/topic.entity';
import { User } from '../auth/entities/user.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostResponseDto } from './dto/post-response.dto';
import { ListPostsQueryDto } from './dto/list-posts-query.dto';
import { LikePostDto } from './dto/like-post.dto';
import { MediaClientService } from '../shared/services/media-client.service';
import { MediaType } from '../shared/dto/media-response.dto';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/entities/notification.entity';
import { QuotaService } from '../entitlements/quota.service';

@Injectable()
export class PostService {
  private readonly logger = new Logger(PostService.name);

  // Helper: Generate a short hash from ID for slug uniqueness
  private generateIdHash(id: number): string {
    const hash = createHash('md5').update(id.toString()).digest('hex');
    // Use first 8 characters of hash for shorter slug
    return hash.substring(0, 8);
  }

  // Helper: Generate slug with ID hash
  private generateSlugWithHash(baseSlug: string, id: number): string {
    const hash = this.generateIdHash(id);
    // Remove any existing hash at the end (in case of updates)
    const cleanSlug = baseSlug.replace(/-[a-f0-9]{8}$/i, '');
    return `${cleanSlug}-${hash}`;
  }

  constructor(
    @InjectRepository(UserPost)
    private postRepository: Repository<UserPost>,
    @InjectRepository(PostLike)
    private postLikeRepository: Repository<PostLike>,
    @InjectRepository(Topic)
    private topicRepository: Repository<Topic>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private mediaClientService: MediaClientService,
    private notificationService: NotificationService,
    private quotaService: QuotaService,
  ) { }

  /**
   * Helper: send a notification (in-app + flagged for push) without breaking the main flow.
   */
  private async safeNotify(data: {
    user_id: number;
    notification_type: NotificationType;
    title: string;
    body: string;
    action_url?: string;
    related_id?: number;
    related_type?: string;
    actor_id?: number;
  }): Promise<void> {
    try {
      // Don't notify the user about their own actions
      if (data.actor_id && data.actor_id === data.user_id) return;

      await this.notificationService.create({
        user_id: data.user_id,
        notification_type: data.notification_type,
        title: data.title,
        body: data.body,
        action_url: data.action_url,
        data: {
          related_id: data.related_id,
          related_type: data.related_type,
          actor_id: data.actor_id,
        },
        created_by: data.actor_id,
      });
    } catch (error) {
      this.logger.warn(`Failed to send notification: ${error.message}`);
    }
  }

  // Create Post
  async createPost(
    createPostDto: CreatePostDto,
    userId: number,
    files?: Express.Multer.File[],
  ): Promise<PostResponseDto> {
    // Debug: Log received is_featured value
    this.logger.debug(`CreatePost - is_featured value: ${JSON.stringify(createPostDto.is_featured)}, type: ${typeof createPostDto.is_featured}`);

    // Enforce daily post limit based on user's subscription plan
    // Throws 403 "Quota Exceeded" if user has hit their daily_post_limit
    await this.quotaService.consume(
      userId,
      'daily_post_limit',
      'You have reached your daily post limit. Upgrade to post more.',
    );

    // Note: Slug uniqueness check removed - slugs will include ID hash to ensure uniqueness

    // Validate topic exists if provided
    if (createPostDto.post_topic_id) {
      const topic = await this.topicRepository.findOne({
        where: { id: createPostDto.post_topic_id, is_active: true },
        select: ['id'],
      });

      if (!topic) {
        throw new NotFoundException('Topic not found or inactive');
      }
    }

    // Process file uploads if provided
    let postImage = createPostDto.post_image;
    let postVideo = createPostDto.post_video;
    let postAudio = createPostDto.post_audio;

    if (files && files.length > 0) {
      for (const file of files) {
        try {
          const mediaResponse = await this.mediaClientService.uploadFile(
            file,
            {
              folder: 'posts',
              userId,
              optimize: true,
              is_public: false,
            },
          );

          // Determine media type based on mime type
          if (file.mimetype.startsWith('image/')) {
            postImage = this.mediaClientService.buildFileUrl(
              mediaResponse.file_path,
            );
          } else if (file.mimetype.startsWith('video/')) {
            postVideo = this.mediaClientService.buildFileUrl(
              mediaResponse.file_path,
            );
          } else if (file.mimetype.startsWith('audio/')) {
            postAudio = this.mediaClientService.buildFileUrl(
              mediaResponse.file_path,
            );
          }
        } catch (error) {
          this.logger.error(
            `Failed to upload file ${file.originalname}: ${error.message}`,
          );
          throw new BadRequestException(
            `Failed to upload file: ${file.originalname}`,
          );
        }
      }
    }

    // Convert community_ids array to comma-separated string
    const communityIdsString = createPostDto.community_ids
      ? createPostDto.community_ids.join(',')
      : null;

    // Convert post_tags array to comma-separated string
    const postTagsString = createPostDto.post_tags
      ? createPostDto.post_tags.join(',')
      : null;

    // Create post with initial slug (will be updated with hash after save)
    const postData: any = {
      user_id: userId,
      post_slug: createPostDto.post_slug, // Temporary slug, will be updated with hash
      post_title: createPostDto.post_title,
      post_content: createPostDto.post_content,
      post_image: postImage,
      post_video: postVideo,
      post_audio: postAudio,
      post_link: createPostDto.post_link,
      post_status: createPostDto.post_status || PostStatus.DRAFT,
      post_type: createPostDto.post_type || PostType.POST,
      post_tags: postTagsString,
      community_ids: communityIdsString,
      is_featured: createPostDto.is_featured === 'featured',
      view_count: 0,
      like_count: 0,
      dislike_count: 0,
      comment_count: 0,
      created_by: userId,
    };

    // Only include post_topic_id if it has a value (not null/undefined)
    if (createPostDto.post_topic_id !== null && createPostDto.post_topic_id !== undefined) {
      postData.post_topic_id = createPostDto.post_topic_id;
    }

    const post = this.postRepository.create(postData);

    // Save to get the ID
    // TypeScript: save() can return T or T[], but we're saving a single entity
    // Use type assertion through unknown to handle the overload
    const savedPost = (await this.postRepository.save(post)) as unknown as UserPost;

    // Generate slug with ID hash and update
    savedPost.post_slug = this.generateSlugWithHash(createPostDto.post_slug, savedPost.id);
    const finalPost = (await this.postRepository.save(savedPost)) as unknown as UserPost;

    return this.mapToResponseDto(finalPost);
  }

  // Get All Posts with pagination and filters
  async getPosts(
    listQueryDto: ListPostsQueryDto,
    userId?: number,
  ): Promise<{
    data: PostResponseDto[];
    meta: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  }> {
    const {
      page = 1,
      limit = 10,
      search,
      sort_by = 'created_at',
      sort_order = 'DESC',
      user_id,
      post_topic_id,
      community_id,
      post_status,
      post_type,
      is_featured,
      include_user = false,
      include_topic = false,
    } = listQueryDto;

    const skip = (page - 1) * limit;

    // Build query
    const queryBuilder = this.postRepository.createQueryBuilder('post');

    if (user_id) {
      queryBuilder.where('post.user_id = :user_id', { user_id });
    }

    if (post_topic_id) {
      queryBuilder.andWhere('post.post_topic_id = :post_topic_id', {
        post_topic_id,
      });
    }

    if (community_id) {
      queryBuilder.andWhere(
        '(post.community_ids LIKE :community_id OR post.community_ids LIKE :community_id_start OR post.community_ids LIKE :community_id_end OR post.community_ids LIKE :community_id_middle)',
        {
          community_id: `${community_id}`,
          community_id_start: `${community_id},%`,
          community_id_end: `%,${community_id}`,
          community_id_middle: `%,${community_id},%`,
        },
      );
    }

    if (post_status) {
      queryBuilder.andWhere('post.post_status = :post_status', { post_status });
    } else {
      // Default to published posts only
      queryBuilder.andWhere('post.post_status = :post_status', {
        post_status: PostStatus.PUBLISHED,
      });
    }

    if (post_type) {
      queryBuilder.andWhere('post.post_type = :post_type', { post_type });
    }

    if (is_featured !== undefined) {
      // Convert string to boolean for database query
      const featuredBoolean = is_featured === 'featured';
      queryBuilder.andWhere('post.is_featured = :is_featured', {
        is_featured: featuredBoolean,
      });
    }

    if (search) {
      queryBuilder.andWhere(
        '(post.post_title LIKE :search OR post.post_content LIKE :search OR post.post_slug LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Add sorting
    queryBuilder.orderBy(`post.${sort_by}`, sort_order);

    // Get total count
    const total = await queryBuilder.getCount();

    // Get paginated results
    queryBuilder.skip(skip).take(limit);

    // Load relations if requested
    if (include_user) {
      queryBuilder.leftJoinAndSelect('post.user', 'user');
    }

    if (include_topic) {
      queryBuilder.leftJoinAndSelect('post.topic', 'topic');
    }

    const posts = await queryBuilder.getMany();

    // Get user like status if userId provided
    const postsWithLikes = await Promise.all(
      posts.map(async (post) => {
        const response: any = { ...post };

        if (userId) {
          const userLike = await this.postLikeRepository.findOne({
            where: {
              post_id: post.id,
              user_id: userId,
            },
          });
          response.user_like_status = userLike?.like_status || null;
          response.is_liked = userLike?.like_status === LikeStatus.LIKE;
          response.is_disliked = userLike?.like_status === LikeStatus.DISLIKE;
        }

        return response;
      }),
    );

    return {
      data: postsWithLikes.map((post) => this.mapToResponseDto(post)),
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  // Get Post by ID
  async getPostById(postId: number, userId?: number, skipViewCount?: boolean): Promise<PostResponseDto> {
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['user', 'topic'],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Increment view count only if not skipped (skip for admin views)
    if (!skipViewCount) {
      post.view_count += 1;
      await this.postRepository.save(post);
    }

    const response: any = { ...post };

    // Get user like status if userId provided
    if (userId) {
      const userLike = await this.postLikeRepository.findOne({
        where: {
          post_id: postId,
          user_id: userId,
        },
      });
      response.user_like_status = userLike?.like_status || null;
      response.is_liked = userLike?.like_status === LikeStatus.LIKE;
      response.is_disliked = userLike?.like_status === LikeStatus.DISLIKE;
    }

    return this.mapToResponseDto(response);
  }

  // Get Post by Slug
  async getPostBySlug(
    slug: string,
    userId?: number,
  ): Promise<PostResponseDto> {
    // Slug now includes hash, so we can search directly
    const post = await this.postRepository.findOne({
      where: { post_slug: slug },
      relations: ['user', 'topic'],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return this.getPostById(post.id, userId);
  }

  // Update Post
  async updatePost(
    postId: number,
    updatePostDto: UpdatePostDto,
    userId: number,
    files?: Express.Multer.File[],
  ): Promise<PostResponseDto> {
    const post = await this.postRepository.findOne({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Check if user owns the post
    if (post.user_id !== userId) {
      throw new ForbiddenException('You can only update your own posts');
    }

    // If slug is being updated, generate new slug with ID hash
    if (updatePostDto.post_slug && updatePostDto.post_slug !== post.post_slug) {
      // Remove any existing hash and generate new one with current ID
      updatePostDto.post_slug = this.generateSlugWithHash(updatePostDto.post_slug, post.id);
    }

    // Validate topic if being updated and provided
    if (updatePostDto.post_topic_id !== undefined) {
      if (updatePostDto.post_topic_id !== null) {
        const topic = await this.topicRepository.findOne({
          where: { id: updatePostDto.post_topic_id, is_active: true },
          select: ['id'],
        });

        if (!topic) {
          throw new NotFoundException('Topic not found or inactive');
        }
      }
      // If post_topic_id is explicitly set to null, allow it (removing topic association)
    }

    // Process file uploads if provided
    if (files && files.length > 0) {
      for (const file of files) {
        try {
          const mediaResponse = await this.mediaClientService.uploadFile(
            file,
            {
              folder: 'posts',
              userId,
              optimize: true,
              is_public: false,
            },
          );

          // Determine media type based on mime type
          if (file.mimetype.startsWith('image/')) {
            (post as any).post_image = this.mediaClientService.buildFileUrl(
              mediaResponse.file_path,
            );
          } else if (file.mimetype.startsWith('video/')) {
            // Note: Video updates are disabled - videos can only be set during creation
            // Skip video file uploads during update
            this.logger.warn(`Video file upload attempted during post update (postId: ${postId}). Video updates are disabled.`);
          } else if (file.mimetype.startsWith('audio/')) {
            (post as any).post_audio = this.mediaClientService.buildFileUrl(
              mediaResponse.file_path,
            );
          }
        } catch (error) {
          this.logger.error(
            `Failed to upload file ${file.originalname}: ${error.message}`,
          );
          throw new BadRequestException(
            `Failed to upload file: ${file.originalname}`,
          );
        }
      }
    }

    // Convert community_ids array to comma-separated string if provided
    if (updatePostDto.community_ids !== undefined) {
      updatePostDto.community_ids = updatePostDto.community_ids as any;
      const communityIds = updatePostDto.community_ids ?? [];
      const communityIdsString = communityIds.length ? communityIds.join(',') : '';
      (post as any).community_ids = communityIdsString;
      delete (updatePostDto as any).community_ids;
    }

    // Convert post_tags array to comma-separated string if provided
    if (updatePostDto.post_tags !== undefined) {
      const postTagsString = updatePostDto.post_tags.length > 0
        ? updatePostDto.post_tags.join(',')
        : null;
      (post as any).post_tags = postTagsString;
      delete (updatePostDto as any).post_tags;
    }

    // Convert is_featured string to boolean if provided
    if (updatePostDto.is_featured !== undefined) {
      (post as any).is_featured = updatePostDto.is_featured === 'featured';
      delete (updatePostDto as any).is_featured;
    }

    // Update post
    Object.assign(post, updatePostDto);
    post.updated_by = userId;

    const updatedPost = await this.postRepository.save(post);
    return this.mapToResponseDto(updatedPost);
  }

  // Delete Post
  async deletePost(postId: number, userId: number): Promise<{ message: string }> {
    const post = await this.postRepository.findOne({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Check if user owns the post
    if (post.user_id !== userId) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    // Soft delete by archiving
    post.post_status = PostStatus.ARCHIVED;
    post.updated_by = userId;
    await this.postRepository.save(post);

    return { message: 'Post deleted successfully' };
  }

  // Like/Dislike Post
  async likePost(
    postId: number,
    likePostDto: LikePostDto,
    userId: number,
  ): Promise<{
    message: string;
    like_count: number;
    dislike_count: number;
    like_status: 'like' | 'dislike' | null;
  }> {
    const post = await this.postRepository.findOne({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Check if user already liked/disliked
    const existingLike = await this.postLikeRepository.findOne({
      where: {
        post_id: postId,
        user_id: userId,
      },
    });

    if (existingLike) {
      // If same status, remove like/dislike
      if (existingLike.like_status === likePostDto.like_status) {
        await this.postLikeRepository.remove(existingLike);

        // Update counts
        if (existingLike.like_status === LikeStatus.LIKE) {
          post.like_count = Math.max(0, post.like_count - 1);
        } else {
          post.dislike_count = Math.max(0, post.dislike_count - 1);
        }

        await this.postRepository.save(post);

        return {
          message: 'Like/dislike removed',
          like_count: post.like_count,
          dislike_count: post.dislike_count,
          like_status: null,
        };
      } else {
        // Change from like to dislike or vice versa
        const oldStatus = existingLike.like_status;
        existingLike.like_status = likePostDto.like_status;
        existingLike.updated_by = userId;
        await this.postLikeRepository.save(existingLike);

        // Update counts
        if (oldStatus === LikeStatus.LIKE) {
          post.like_count = Math.max(0, post.like_count - 1);
          post.dislike_count += 1;
        } else {
          post.dislike_count = Math.max(0, post.dislike_count - 1);
          post.like_count += 1;
        }

        await this.postRepository.save(post);

        return {
          message: `Post ${likePostDto.like_status}d successfully`,
          like_count: post.like_count,
          dislike_count: post.dislike_count,
          like_status: likePostDto.like_status,
        };
      }
    }

    // Create new like/dislike
    const postLike = this.postLikeRepository.create({
      post_id: postId,
      user_id: userId,
      like_status: likePostDto.like_status,
      created_by: userId,
    });

    await this.postLikeRepository.save(postLike);

    // Update counts
    if (likePostDto.like_status === LikeStatus.LIKE) {
      post.like_count += 1;
    } else {
      post.dislike_count += 1;
    }

    await this.postRepository.save(post);

    // Notify the post owner — only on a new like (not dislike)
    if (likePostDto.like_status === LikeStatus.LIKE) {
      const liker = await this.userRepository.findOne({
        where: { id: userId },
        select: ['id', 'username'],
      });
      const actorName = liker?.username || 'Someone';
      await this.safeNotify({
        user_id: post.user_id,
        actor_id: userId,
        notification_type: NotificationType.LIKE,
        title: 'Someone liked your post',
        body: `${actorName} liked your post "${post.post_title}"`,
        action_url: `/posts/${post.post_slug}`,
        related_id: post.id,
        related_type: 'post',
      });
    }

    return {
      message: `Post ${likePostDto.like_status}d successfully`,
      like_count: post.like_count,
      dislike_count: post.dislike_count,
      like_status: likePostDto.like_status,
    };
  }

  // Get User's Posts
  async getUserPosts(
    userId: number,
    listQueryDto: ListPostsQueryDto,
  ): Promise<{
    data: PostResponseDto[];
    meta: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  }> {
    return this.getPosts({ ...listQueryDto, user_id: userId }, userId);
  }

  // Get Posts by Topic
  async getPostsByTopic(
    topicId: number,
    listQueryDto: ListPostsQueryDto,
    userId?: number,
  ): Promise<{
    data: PostResponseDto[];
    meta: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  }> {
    return this.getPosts({ ...listQueryDto, post_topic_id: topicId }, userId);
  }

  // Get Featured Posts
  async getFeaturedPosts(
    listQueryDto: ListPostsQueryDto,
    userId?: number,
  ): Promise<{
    data: PostResponseDto[];
    meta: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  }> {
    return this.getPosts({ ...listQueryDto, is_featured: 'featured' }, userId);
  }

  // Helper: Map entity to response DTO
  private mapToResponseDto(post: any): PostResponseDto {
    // Parse community_ids string to array
    const communityIds = post.community_ids
      ? post.community_ids.split(',').map((id: string) => parseInt(id.trim(), 10)).filter((id: number) => !isNaN(id))
      : [];

    // Parse post_tags string to array
    const postTags = post.post_tags
      ? post.post_tags.split(',').map((tag: string) => tag.trim())
      : [];

    return {
      id: post.id,
      community_ids: post.community_ids,
      user_id: post.user_id,
      post_slug: post.post_slug,
      post_title: post.post_title,
      post_content: post.post_content,
      post_image: post.post_image,
      post_video: post.post_video,
      post_audio: post.post_audio,
      post_link: post.post_link,
      post_status: post.post_status,
      post_type: post.post_type,
      post_topic_id: post.post_topic_id,
      post_tags: post.post_tags,
      view_count: post.view_count,
      like_count: post.like_count,
      dislike_count: post.dislike_count,
      comment_count: post.comment_count,
      is_featured: post.is_featured,
      created_by: post.created_by,
      updated_by: post.updated_by,
      created_at: post.created_at,
      updated_at: post.updated_at,
      ...(post.user && {
        user: {
          id: post.user.id,
          username: post.user.username,
          email: post.user.email,
        },
      }),
      ...(post.topic && {
        topic: {
          id: post.topic.id,
          topic_slug: post.topic.topic_slug,
          topic_name: post.topic.topic_name,
        },
      }),
      // Include like/dislike status when userId was provided (user_like_status is defined)
      ...(post.user_like_status !== undefined && {
        user_like_status: post.user_like_status,
        like_status: post.user_like_status, // Alias
        is_liked: post.is_liked !== undefined ? post.is_liked : false,
        is_like: post.is_liked !== undefined ? post.is_liked : false, // Alias
        is_disliked: post.is_disliked !== undefined ? post.is_disliked : false,
      }),
      ...(post.main_topic_name !== undefined && {
        main_topic_name: post.main_topic_name,
      }),
      ...(post.communities && {
        communities: post.communities,
      }),
    };
  }
}
