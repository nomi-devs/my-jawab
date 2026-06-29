import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, In, IsNull } from 'typeorm';
import { PostComment } from './entities/post-comment.entity';
import { CommentLike, LikeStatus } from './entities/comment-like.entity';
import { PollComment } from '../poll/entities/poll-comment.entity';
import { UserPost } from '../post/entities/user-post.entity';
import { UserPoll } from '../poll/entities/user-poll.entity';
import { UserProfile } from '../user/entities/user-profile.entity';
import { User } from '../auth/entities/user.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import {
  CommentResponseDto,
  CommentWithRepliesResponseDto,
} from './dto/comment-response.dto';
import { ListCommentsQueryDto } from './dto/list-comments-query.dto';
import { LikeCommentDto } from './dto/like-comment.dto';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/entities/notification.entity';
import { QuotaService } from '../entitlements/quota.service';

@Injectable()
export class CommentService {
  private readonly logger = new Logger(CommentService.name);

  constructor(
    @InjectRepository(PostComment)
    private postCommentRepository: Repository<PostComment>,
    @InjectRepository(PollComment)
    private pollCommentRepository: Repository<PollComment>,
    @InjectRepository(CommentLike)
    private commentLikeRepository: Repository<CommentLike>,
    @InjectRepository(UserPost)
    private postRepository: Repository<UserPost>,
    @InjectRepository(UserPoll)
    private pollRepository: Repository<UserPoll>,
    @InjectRepository(UserProfile)
    private userProfileRepository: Repository<UserProfile>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
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

  // Create Comment (for Post or Poll)
  async createComment(
    createCommentDto: CreateCommentDto,
    userId: number,
  ): Promise<CommentResponseDto> {
    if (!createCommentDto.post_id && !createCommentDto.poll_id) {
      throw new BadRequestException('Either post_id or poll_id must be provided');
    }

    if (createCommentDto.post_id && createCommentDto.poll_id) {
      throw new BadRequestException('Cannot provide both post_id and poll_id');
    }

    // Enforce daily comment limit based on user's subscription plan
    await this.quotaService.consume(
      userId,
      'daily_comment_limit',
      'You have reached your daily comment limit. Upgrade to comment more.',
    );

    // Handle Post Comment
    if (createCommentDto.post_id) {
      // Validate post exists
      const post = await this.postRepository.findOne({
        where: { id: createCommentDto.post_id },
        select: ['id', 'post_status'],
      });

      if (!post) {
        throw new NotFoundException('Post not found');
      }

      // Validate parent comment if provided
      if (createCommentDto.parent_comment_id) {
        const parentComment = await this.postCommentRepository.findOne({
          where: {
            id: createCommentDto.parent_comment_id,
            post_id: createCommentDto.post_id,
          },
          select: ['id'],
        });

        if (!parentComment) {
          throw new NotFoundException(
            'Parent comment not found or does not belong to this post',
          );
        }
      }

      const comment = this.postCommentRepository.create({
        post_id: createCommentDto.post_id,
        user_id: userId,
        parent_comment_id: createCommentDto.parent_comment_id || null,
        comment_content: createCommentDto.comment_content,
        like_count: 0,
        dislike_count: 0,
        is_approved: true,
        created_by: userId,
      });

      const savedComment = await this.postCommentRepository.save(comment);

      // Update post comment count
      await this.incrementPostCommentCount(createCommentDto.post_id);

      // Notify post owner OR parent-comment author (reply takes priority)
      const postFull = await this.postRepository.findOne({
        where: { id: createCommentDto.post_id },
        select: ['id', 'user_id', 'post_title', 'post_slug'],
      });
      const actor = await this.userRepository.findOne({
        where: { id: userId },
        select: ['id', 'username'],
      });
      const actorName = actor?.username || 'Someone';

      if (createCommentDto.parent_comment_id) {
        // Notify parent comment author about the reply
        const parentComment = await this.postCommentRepository.findOne({
          where: { id: createCommentDto.parent_comment_id },
          select: ['id', 'user_id'],
        });
        if (parentComment) {
          await this.safeNotify({
            user_id: parentComment.user_id,
            actor_id: userId,
            notification_type: NotificationType.REPLY,
            title: 'Someone replied to your comment',
            body: `${actorName} replied to your comment`,
            action_url: postFull ? `/posts/${postFull.post_slug}` : undefined,
            related_id: savedComment.id,
            related_type: 'comment',
          });
        }
      } else if (postFull) {
        // Notify post owner about the new comment
        await this.safeNotify({
          user_id: postFull.user_id,
          actor_id: userId,
          notification_type: NotificationType.COMMENT,
          title: 'New comment on your post',
          body: `${actorName} commented on "${postFull.post_title}"`,
          action_url: `/posts/${postFull.post_slug}`,
          related_id: postFull.id,
          related_type: 'post',
        });
      }

      return this.mapPostCommentToResponseDto(savedComment);
    }

    // Handle Poll Comment
    if (createCommentDto.poll_id) {
      // Validate poll exists
      const poll = await this.pollRepository.findOne({
        where: { id: createCommentDto.poll_id },
        select: ['id', 'poll_status'],
      });

      if (!poll) {
        throw new NotFoundException('Poll not found');
      }

      // Validate parent comment if provided
      if (createCommentDto.parent_comment_id) {
        const parentComment = await this.pollCommentRepository.findOne({
          where: {
            id: createCommentDto.parent_comment_id,
            poll_id: createCommentDto.poll_id,
          },
          select: ['id'],
        });

        if (!parentComment) {
          throw new NotFoundException(
            'Parent comment not found or does not belong to this poll',
          );
        }
      }

      const comment = this.pollCommentRepository.create({
        poll_id: createCommentDto.poll_id,
        user_id: userId,
        parent_comment_id: createCommentDto.parent_comment_id || null,
        comment_content: createCommentDto.comment_content,
        like_count: 0,
        dislike_count: 0,
        is_approved: true,
        created_by: userId,
      });

      const savedComment = await this.pollCommentRepository.save(comment);

      // Notify poll owner OR parent-comment author
      const pollFull = await this.pollRepository.findOne({
        where: { id: createCommentDto.poll_id },
        select: ['id', 'user_id', 'poll_title', 'poll_slug'],
      });
      const actor = await this.userRepository.findOne({
        where: { id: userId },
        select: ['id', 'username'],
      });
      const actorName = actor?.username || 'Someone';

      if (createCommentDto.parent_comment_id) {
        const parentComment = await this.pollCommentRepository.findOne({
          where: { id: createCommentDto.parent_comment_id },
          select: ['id', 'user_id'],
        });
        if (parentComment) {
          await this.safeNotify({
            user_id: parentComment.user_id,
            actor_id: userId,
            notification_type: NotificationType.REPLY,
            title: 'Someone replied to your comment',
            body: `${actorName} replied to your comment`,
            action_url: pollFull ? `/polls/${pollFull.poll_slug}` : undefined,
            related_id: savedComment.id,
            related_type: 'comment',
          });
        }
      } else if (pollFull) {
        await this.safeNotify({
          user_id: pollFull.user_id,
          actor_id: userId,
          notification_type: NotificationType.COMMENT,
          title: 'New comment on your poll',
          body: `${actorName} commented on "${pollFull.poll_title}"`,
          action_url: `/polls/${pollFull.poll_slug}`,
          related_id: pollFull.id,
          related_type: 'poll',
        });
      }

      return this.mapPollCommentToResponseDto(savedComment);
    }

    throw new BadRequestException('Invalid request parameters');
  }

  // Get All Comments with pagination and filters (Post or Poll comments)
  async getComments(
    listQueryDto: ListCommentsQueryDto,
    userId?: number,
  ): Promise<{
    data: CommentResponseDto[];
    meta: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  }> {
    const page = listQueryDto.page || 1;
    const limit = listQueryDto.limit || 10;
    const skip = (page - 1) * limit;

    // Determine if we're fetching post or poll comments
    const isPostComments = !!listQueryDto.post_id;
    const isPollComments = !!listQueryDto.poll_id;

    if (isPostComments) {
      return this.getPostComments(listQueryDto, userId, page, limit, skip);
    } else if (isPollComments) {
      return this.getPollComments(listQueryDto, userId, page, limit, skip);
    } else {
      // If neither specified, return empty (or could return both, but for now empty)
      return {
        data: [],
        meta: {
          total: 0,
          page,
          limit,
          total_pages: 0,
        },
      };
    }
  }

  // Get Post Comments
  private async getPostComments(
    listQueryDto: ListCommentsQueryDto,
    userId: number | undefined,
    page: number,
    limit: number,
    skip: number,
  ): Promise<{
    data: CommentResponseDto[];
    meta: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  }> {
    // Build where condition - only top-level comments (no parent)
    const where: FindOptionsWhere<PostComment> = {
      parent_comment_id: IsNull(),
    };

    if (listQueryDto.post_id) {
      where.post_id = listQueryDto.post_id;
    }

    if (listQueryDto.user_id) {
      where.user_id = listQueryDto.user_id;
    }

    if (listQueryDto.is_approved !== undefined) {
      where.is_approved = listQueryDto.is_approved;
    } else {
      where.is_approved = true;
    }

    // Build query
    const queryBuilder = this.postCommentRepository
      .createQueryBuilder('comment')
      .where(where);

    // Add search if provided
    if (listQueryDto.search) {
      queryBuilder.andWhere('comment.comment_content LIKE :search', {
        search: `%${listQueryDto.search}%`,
      });
    }

    // Always include user and post relations
    queryBuilder.leftJoinAndSelect('comment.user', 'user');
    queryBuilder.leftJoinAndSelect('comment.post', 'post');

    // Add sorting
    const sortBy = listQueryDto.sort_by || 'created_at';
    const sortOrder = listQueryDto.sort_order || 'DESC';
    queryBuilder.orderBy(`comment.${sortBy}`, sortOrder);

    // Get total count
    const total = await queryBuilder.getCount();

    // Add pagination
    queryBuilder.skip(skip).take(limit);

    const comments = await queryBuilder.getMany();

    // Get unique user IDs
    const userIds = new Set<number>();
    comments.forEach((comment) => {
      if (comment.user_id) userIds.add(comment.user_id);
    });

    // Load user profiles in batch
    const userProfilesMap = new Map<number, UserProfile>();
    if (userIds.size > 0) {
      const profiles = await this.userProfileRepository.find({
        where: { user_id: In(Array.from(userIds)) },
        select: ['user_id', 'full_name', 'profile_picture'],
      });
      profiles.forEach((profile) => {
        userProfilesMap.set(profile.user_id, profile);
      });
    }

    // Process comments
    const commentsWithData = await Promise.all(
      comments.map(async (comment) => {
        const response: any = { ...comment };

        // Attach profile picture to user if exists
        if (comment.user && userProfilesMap.has(comment.user.id)) {
          const profile = userProfilesMap.get(comment.user.id);
          (comment.user as any).profile_picture = profile?.profile_picture || null;
          (comment.user as any).full_name = profile?.full_name || null;
        }

        // Get user like status
        if (userId) {
          const userLike = await this.commentLikeRepository.findOne({
            where: {
              comment_id: comment.id,
              user_id: userId,
            },
          });
          response.user_like_status = userLike?.like_status || null;
        }

        // Get replies count
        const repliesCount = await this.postCommentRepository.count({
          where: { parent_comment_id: comment.id, is_approved: true },
        });
        response.replies_count = repliesCount;

        return response;
      }),
    );

    return {
      data: commentsWithData.map((comment) =>
        this.mapPostCommentToResponseDto(comment),
      ),
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  // Get Poll Comments
  private async getPollComments(
    listQueryDto: ListCommentsQueryDto,
    userId: number | undefined,
    page: number,
    limit: number,
    skip: number,
  ): Promise<{
    data: CommentResponseDto[];
    meta: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  }> {
    // Build where condition - only top-level comments (no parent)
    const where: FindOptionsWhere<PollComment> = {
      parent_comment_id: IsNull(),
    };

    if (listQueryDto.poll_id) {
      where.poll_id = listQueryDto.poll_id;
    }

    if (listQueryDto.user_id) {
      where.user_id = listQueryDto.user_id;
    }

    if (listQueryDto.is_approved !== undefined) {
      where.is_approved = listQueryDto.is_approved;
    } else {
      where.is_approved = true;
    }

    // Build query
    const queryBuilder = this.pollCommentRepository
      .createQueryBuilder('comment')
      .where(where);

    // Add search if provided
    if (listQueryDto.search) {
      queryBuilder.andWhere('comment.comment_content LIKE :search', {
        search: `%${listQueryDto.search}%`,
      });
    }

    // Always include user and poll relations
    queryBuilder.leftJoinAndSelect('comment.user', 'user');
    queryBuilder.leftJoinAndSelect('comment.poll', 'poll');

    // Add sorting
    const sortBy = listQueryDto.sort_by || 'created_at';
    const sortOrder = listQueryDto.sort_order || 'DESC';
    queryBuilder.orderBy(`comment.${sortBy}`, sortOrder);

    // Get total count
    const total = await queryBuilder.getCount();

    // Add pagination
    queryBuilder.skip(skip).take(limit);

    const comments = await queryBuilder.getMany();

    // Get unique user IDs
    const userIds = new Set<number>();
    comments.forEach((comment) => {
      if (comment.user_id) userIds.add(comment.user_id);
    });

    // Load user profiles in batch
    const userProfilesMap = new Map<number, UserProfile>();
    if (userIds.size > 0) {
      const profiles = await this.userProfileRepository.find({
        where: { user_id: In(Array.from(userIds)) },
        select: ['user_id', 'full_name', 'profile_picture'],
      });
      profiles.forEach((profile) => {
        userProfilesMap.set(profile.user_id, profile);
      });
    }

    // Process comments
    const commentsWithData = await Promise.all(
      comments.map(async (comment) => {
        const response: any = { ...comment };

        // Attach profile picture to user if exists
        if (comment.user && userProfilesMap.has(comment.user.id)) {
          const profile = userProfilesMap.get(comment.user.id);
          (comment.user as any).profile_picture = profile?.profile_picture || null;
          (comment.user as any).full_name = profile?.full_name || null;
        }

        // Note: Poll comments don't have likes yet - this would need a separate entity
        // For now, set to null
        response.user_like_status = null;

        // Get replies count
        const repliesCount = await this.pollCommentRepository.count({
          where: { parent_comment_id: comment.id, is_approved: true },
        });
        response.replies_count = repliesCount;

        return response;
      }),
    );

    return {
      data: commentsWithData.map((comment) =>
        this.mapPollCommentToResponseDto(comment),
      ),
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  // Get Comment by ID (Post or Poll comment)
  async getCommentById(
    commentId: number,
    userId?: number,
  ): Promise<CommentResponseDto> {
    // Try to find as post comment first
    let comment: PostComment | PollComment | null = await this.postCommentRepository.findOne({
      where: { id: commentId },
      relations: ['user', 'post'],
    });

    let isPostComment = !!comment;

    // If not found, try poll comment
    if (!comment) {
      comment = await this.pollCommentRepository.findOne({
        where: { id: commentId },
        relations: ['user', 'poll'],
      });
      isPostComment = false;
    }

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Get user IDs for profile loading
    const userIds = new Set<number>();
    if (comment.user_id) userIds.add(comment.user_id);

    // Load user profiles
    const userProfilesMap = new Map<number, UserProfile>();
    if (userIds.size > 0) {
      const profiles = await this.userProfileRepository.find({
        where: { user_id: In(Array.from(userIds)) },
        select: ['user_id', 'full_name', 'profile_picture'],
      });
      profiles.forEach((profile) => {
        userProfilesMap.set(profile.user_id, profile);
      });
    }

    // Attach profile picture to comment user
    if (comment.user && userProfilesMap.has(comment.user.id)) {
      const profile = userProfilesMap.get(comment.user.id);
      (comment.user as any).profile_picture = profile?.profile_picture || null;
      (comment.user as any).full_name = profile?.full_name || null;
    }

    const commentResponse: any = { ...comment };

    // Get user like status (only for post comments)
    if (userId && isPostComment) {
      const userLike = await this.commentLikeRepository.findOne({
        where: {
          comment_id: commentId,
          user_id: userId,
        },
      });
      commentResponse.user_like_status = userLike?.like_status || null;
    } else {
      commentResponse.user_like_status = null;
    }

    // Get replies count
    if (isPostComment) {
      const repliesCount = await this.postCommentRepository.count({
        where: { parent_comment_id: commentId, is_approved: true },
      });
      commentResponse.replies_count = repliesCount;
      return this.mapPostCommentToResponseDto(commentResponse);
    } else {
      const repliesCount = await this.pollCommentRepository.count({
        where: { parent_comment_id: commentId, is_approved: true },
      });
      commentResponse.replies_count = repliesCount;
      return this.mapPollCommentToResponseDto(commentResponse);
    }
  }

  // Get Comments by Post ID
  async getCommentsByPost(
    postId: number,
    listQueryDto: ListCommentsQueryDto,
    userId?: number,
  ): Promise<{
    data: CommentResponseDto[];
    meta: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  }> {
    return this.getComments({ ...listQueryDto, post_id: postId }, userId);
  }

  // Get Comments by Poll ID
  async getCommentsByPoll(
    pollId: number,
    listQueryDto: ListCommentsQueryDto,
    userId?: number,
  ): Promise<{
    data: CommentResponseDto[];
    meta: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  }> {
    return this.getComments({ ...listQueryDto, poll_id: pollId }, userId);
  }

  // Get Replies to a Comment (Post or Poll)
  async getCommentReplies(
    commentId: number,
    listQueryDto: ListCommentsQueryDto,
    userId?: number,
  ): Promise<{
    data: CommentResponseDto[];
    meta: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  }> {
    // Determine if it's a post or poll comment
    const postComment = await this.postCommentRepository.findOne({
      where: { id: commentId },
      select: ['id', 'post_id'],
    });

    if (postComment) {
      return this.getPostCommentReplies(commentId, listQueryDto, userId);
    }

    const pollComment = await this.pollCommentRepository.findOne({
      where: { id: commentId },
      select: ['id', 'poll_id'],
    });

    if (pollComment) {
      return this.getPollCommentReplies(commentId, listQueryDto, userId);
    }

    throw new NotFoundException('Comment not found');
  }

  // Get Post Comment Replies
  private async getPostCommentReplies(
    commentId: number,
    listQueryDto: ListCommentsQueryDto,
    userId: number | undefined,
  ): Promise<{
    data: CommentResponseDto[];
    meta: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  }> {
    const page = listQueryDto.page || 1;
    const limit = listQueryDto.limit || 10;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<PostComment> = {
      parent_comment_id: commentId,
    };

    const queryBuilder = this.postCommentRepository
      .createQueryBuilder('comment')
      .where('comment.parent_comment_id = :commentId', { commentId });

    if (listQueryDto.is_approved !== undefined) {
      queryBuilder.andWhere('comment.is_approved = :isApproved', {
        isApproved: listQueryDto.is_approved ? 1 : 0,
      });
    } else {
      queryBuilder.andWhere('comment.is_approved = :isApproved', { isApproved: 1 });
    }

    // Always include user and post relations
    queryBuilder.leftJoinAndSelect('comment.user', 'user');
    queryBuilder.leftJoinAndSelect('comment.post', 'post');

    if (listQueryDto.search) {
      queryBuilder.andWhere('comment.comment_content LIKE :search', {
        search: `%${listQueryDto.search}%`,
      });
    }

    const sortBy = listQueryDto.sort_by || 'created_at';
    const sortOrder = listQueryDto.sort_order || 'ASC';
    queryBuilder.orderBy(`comment.${sortBy}`, sortOrder);

    const total = await queryBuilder.getCount();
    queryBuilder.skip(skip).take(limit);

    const replies = await queryBuilder.getMany();

    // Load user profiles
    const userIds = new Set<number>();
    replies.forEach((reply) => {
      if (reply.user_id) userIds.add(reply.user_id);
    });

    const userProfilesMap = new Map<number, UserProfile>();
    if (userIds.size > 0) {
      const profiles = await this.userProfileRepository.find({
        where: { user_id: In(Array.from(userIds)) },
        select: ['user_id', 'full_name', 'profile_picture'],
      });
      profiles.forEach((profile) => {
        userProfilesMap.set(profile.user_id, profile);
      });
    }

    const repliesWithData = await Promise.all(
      replies.map(async (reply: any) => {
        if (reply.user && userProfilesMap.has(reply.user.id)) {
          const profile = userProfilesMap.get(reply.user.id);
          reply.user.profile_picture = profile?.profile_picture || null;
          reply.user.full_name = profile?.full_name || null;
        }

        if (userId) {
          const userLike = await this.commentLikeRepository.findOne({
            where: {
              comment_id: reply.id,
              user_id: userId,
            },
          });
          reply.user_like_status = userLike?.like_status || null;
        }

        // Get replies count for each reply
        const repliesCount = await this.postCommentRepository.count({
          where: { parent_comment_id: reply.id, is_approved: true },
        });
        reply.replies_count = repliesCount;

        return reply;
      }),
    );

    return {
      data: repliesWithData.map((reply) =>
        this.mapPostCommentToResponseDto(reply),
      ),
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  // Get Poll Comment Replies
  private async getPollCommentReplies(
    commentId: number,
    listQueryDto: ListCommentsQueryDto,
    userId: number | undefined,
  ): Promise<{
    data: CommentResponseDto[];
    meta: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  }> {
    const page = listQueryDto.page || 1;
    const limit = listQueryDto.limit || 10;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<PollComment> = {
      parent_comment_id: commentId,
    };

    if (listQueryDto.is_approved !== undefined) {
      where.is_approved = listQueryDto.is_approved;
    } else {
      where.is_approved = true;
    }

    const queryBuilder = this.pollCommentRepository
      .createQueryBuilder('comment')
      .where(where);

    // Always include user relation
    // Always include user and poll relations
    queryBuilder.leftJoinAndSelect('comment.user', 'user');
    queryBuilder.leftJoinAndSelect('comment.poll', 'poll');

    if (listQueryDto.search) {
      queryBuilder.andWhere('comment.comment_content LIKE :search', {
        search: `%${listQueryDto.search}%`,
      });
    }

    const sortBy = listQueryDto.sort_by || 'created_at';
    const sortOrder = listQueryDto.sort_order || 'ASC';
    queryBuilder.orderBy(`comment.${sortBy}`, sortOrder);

    const total = await queryBuilder.getCount();
    queryBuilder.skip(skip).take(limit);

    const replies = await queryBuilder.getMany();

    // Load user profiles
    const userIds = new Set<number>();
    replies.forEach((reply) => {
      if (reply.user_id) userIds.add(reply.user_id);
    });

    const userProfilesMap = new Map<number, UserProfile>();
    if (userIds.size > 0) {
      const profiles = await this.userProfileRepository.find({
        where: { user_id: In(Array.from(userIds)) },
        select: ['user_id', 'full_name', 'profile_picture'],
      });
      profiles.forEach((profile) => {
        userProfilesMap.set(profile.user_id, profile);
      });
    }

    const repliesWithData = await Promise.all(
      replies.map(async (reply: any) => {
        if (reply.user && userProfilesMap.has(reply.user.id)) {
          const profile = userProfilesMap.get(reply.user.id);
          reply.user.profile_picture = profile?.profile_picture || null;
          reply.user.full_name = profile?.full_name || null;
        }

        // Poll comments don't have likes yet
        reply.user_like_status = null;

        // Get replies count for each reply
        const repliesCount = await this.pollCommentRepository.count({
          where: { parent_comment_id: reply.id, is_approved: true },
        });
        reply.replies_count = repliesCount;

        return reply;
      }),
    );

    return {
      data: repliesWithData.map((reply) =>
        this.mapPollCommentToResponseDto(reply),
      ),
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  // Update Comment (Post or Poll)
  async updateComment(
    commentId: number,
    updateCommentDto: UpdateCommentDto,
    userId: number,
  ): Promise<CommentResponseDto> {
    // Try to find as post comment first
    let comment: PostComment | PollComment | null = await this.postCommentRepository.findOne({
      where: { id: commentId },
    });

    let isPostComment = !!comment;

    // If not found, try poll comment
    if (!comment) {
      comment = await this.pollCommentRepository.findOne({
        where: { id: commentId },
      });
      isPostComment = false;
    }

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Check if user owns the comment (unless updating approval status - admin only)
    if (updateCommentDto.is_approved !== undefined) {
      // Approval status update requires admin role - this would be checked in controller
      // For now, we'll allow the update
    } else if (comment.user_id !== userId) {
      throw new ForbiddenException('You can only update your own comments');
    }

    // Update comment
    Object.assign(comment, updateCommentDto);
    comment.updated_by = userId;

    if (isPostComment) {
      const updatedComment = await this.postCommentRepository.save(comment as PostComment);
      return this.mapPostCommentToResponseDto(updatedComment);
    } else {
      const updatedComment = await this.pollCommentRepository.save(comment as PollComment);
      return this.mapPollCommentToResponseDto(updatedComment);
    }
  }

  // Delete Comment (Post or Poll)
  async deleteComment(
    commentId: number,
    userId: number,
  ): Promise<{ message: string }> {
    // Try to find as post comment first
    let comment: PostComment | PollComment | null = await this.postCommentRepository.findOne({
      where: { id: commentId },
    });

    let isPostComment = !!comment;

    // If not found, try poll comment
    if (!comment) {
      comment = await this.pollCommentRepository.findOne({
        where: { id: commentId },
      });
      isPostComment = false;
    }

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Check if user owns the comment
    if (comment.user_id !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    // Check if comment has replies
    let repliesCount = 0;
    if (isPostComment) {
      repliesCount = await this.postCommentRepository.count({
        where: { parent_comment_id: commentId },
      });
    } else {
      repliesCount = await this.pollCommentRepository.count({
        where: { parent_comment_id: commentId },
      });
    }

    if (repliesCount > 0) {
      // Soft delete: mark as not approved instead of deleting
      comment.is_approved = false;
      comment.updated_by = userId;
      if (isPostComment) {
        await this.postCommentRepository.save(comment);
      } else {
        await this.pollCommentRepository.save(comment as PollComment);
      }
      return { message: 'Comment deleted successfully (soft delete)' };
    }

    // Hard delete if no replies
    if (isPostComment) {
      const postId = (comment as PostComment).post_id;
      await this.postCommentRepository.remove(comment as PostComment);
      // Update post comment count
      await this.decrementPostCommentCount(postId);
    } else {
      await this.pollCommentRepository.remove(comment as PollComment);
    }

    return { message: 'Comment deleted successfully' };
  }

  // Like/Dislike Comment (Post comments only - poll comments don't have likes yet)
  async likeComment(
    commentId: number,
    likeCommentDto: LikeCommentDto,
    userId: number,
  ): Promise<{
    message: string;
    like_count: number;
    dislike_count: number;
    like_status: 'like' | 'dislike' | null;
  }> {
    // Only post comments have likes currently
    const comment = await this.postCommentRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      // Check if it's a poll comment
      const pollComment = await this.pollCommentRepository.findOne({
        where: { id: commentId },
      });
      if (pollComment) {
        throw new BadRequestException(
          'Poll comments do not support likes/dislikes yet',
        );
      }
      throw new NotFoundException('Comment not found');
    }

    // Check if user already liked/disliked
    const existingLike = await this.commentLikeRepository.findOne({
      where: {
        comment_id: commentId,
        user_id: userId,
      },
    });

    if (existingLike) {
      // If same status, remove like/dislike
      if (existingLike.like_status === likeCommentDto.like_status) {
        await this.commentLikeRepository.remove(existingLike);

        // Update counts
        if (existingLike.like_status === LikeStatus.LIKE) {
          comment.like_count = Math.max(0, comment.like_count - 1);
        } else {
          comment.dislike_count = Math.max(0, comment.dislike_count - 1);
        }

        await this.postCommentRepository.save(comment);

        return {
          message: 'Comment like/dislike removed successfully',
          like_count: comment.like_count,
          dislike_count: comment.dislike_count,
          like_status: null,
        };
      } else {
        // Update existing like/dislike
        const oldStatus = existingLike.like_status;
        existingLike.like_status = likeCommentDto.like_status;
        existingLike.updated_by = userId;
        await this.commentLikeRepository.save(existingLike);

        // Update counts (decrement old, increment new)
        if (oldStatus === LikeStatus.LIKE) {
          comment.like_count = Math.max(0, comment.like_count - 1);
          comment.dislike_count += 1;
        } else {
          comment.dislike_count = Math.max(0, comment.dislike_count - 1);
          comment.like_count += 1;
        }

        await this.postCommentRepository.save(comment);

        return {
          message: `Comment ${likeCommentDto.like_status}d successfully`,
          like_count: comment.like_count,
          dislike_count: comment.dislike_count,
          like_status: likeCommentDto.like_status,
        };
      }
    }

    // Create new like/dislike
    const commentLike = this.commentLikeRepository.create({
      comment_id: commentId,
      user_id: userId,
      like_status: likeCommentDto.like_status,
      created_by: userId,
    });

    await this.commentLikeRepository.save(commentLike);

    // Update counts
    if (likeCommentDto.like_status === LikeStatus.LIKE) {
      comment.like_count += 1;
    } else {
      comment.dislike_count += 1;
    }

    await this.postCommentRepository.save(comment);

    // Notify comment author — only on a new LIKE (not dislike, not status change)
    if (likeCommentDto.like_status === LikeStatus.LIKE) {
      const actor = await this.userRepository.findOne({
        where: { id: userId },
        select: ['id', 'username'],
      });
      const actorName = actor?.username || 'Someone';
      await this.safeNotify({
        user_id: comment.user_id,
        actor_id: userId,
        notification_type: NotificationType.LIKE,
        title: 'Someone liked your comment',
        body: `${actorName} liked your comment`,
        related_id: comment.id,
        related_type: 'comment',
      });
    }

    return {
      message: `Comment ${likeCommentDto.like_status}d successfully`,
      like_count: comment.like_count,
      dislike_count: comment.dislike_count,
      like_status: likeCommentDto.like_status,
    };
  }

  // Helper: Increment post comment count
  private async incrementPostCommentCount(postId: number): Promise<void> {
    await this.postRepository.increment({ id: postId }, 'comment_count', 1);
  }

  // Helper: Decrement post comment count
  private async decrementPostCommentCount(postId: number): Promise<void> {
    await this.postRepository.decrement({ id: postId }, 'comment_count', 1);
  }

  // Helper: Map Post Comment entity to response DTO
  public mapPostCommentToResponseDto(comment: any): CommentResponseDto {
    const dto: CommentResponseDto = {
      id: comment.id,
      post_id: comment.post_id,
      user_id: comment.user_id,
      parent_comment_id: comment.parent_comment_id,
      comment_content: comment.comment_content,
      like_count: comment.like_count,
      dislike_count: comment.dislike_count,
      is_approved: comment.is_approved,
      created_by: comment.created_by,
      updated_by: comment.updated_by,
      created_at: comment.created_at,
      updated_at: comment.updated_at,
    };

    if (comment.user) {
      const fullName = comment.user.full_name || null;
      const profilePicture = comment.user.profile_picture || null;
      dto.user = {
        id: comment.user.id,
        username: comment.user.username,
        email: comment.user.email,
        full_name: fullName,
        profile_picture: profilePicture,
        name: fullName || comment.user.username || null, // Full name or username
        image: profilePicture, // Alias for profile_picture
      };
    }

    if (comment.post) {
      dto.post = {
        id: comment.post.id,
        post_slug: comment.post.post_slug,
        post_title: comment.post.post_title,
        post_image: comment.post.post_image || null,
      };
    }

    if (comment.user_like_status !== undefined) {
      dto.user_like_status = comment.user_like_status;
    }

    if (comment.replies_count !== undefined) {
      dto.replies_count = comment.replies_count;
    }

    if (comment.replies && Array.isArray(comment.replies)) {
      dto.replies = comment.replies.map((reply: any) =>
        this.mapPostCommentToResponseDto(reply),
      );
    }

    return dto;
  }

  // Helper: Map Poll Comment entity to response DTO
  public mapPollCommentToResponseDto(comment: any): CommentResponseDto {
    const dto: CommentResponseDto = {
      id: comment.id,
      poll_id: comment.poll_id,
      user_id: comment.user_id,
      parent_comment_id: comment.parent_comment_id,
      comment_content: comment.comment_content,
      like_count: comment.like_count,
      dislike_count: comment.dislike_count,
      is_approved: comment.is_approved,
      created_by: comment.created_by,
      updated_by: comment.updated_by,
      created_at: comment.created_at,
      updated_at: comment.updated_at,
    };

    if (comment.user) {
      const fullName = comment.user.full_name || null;
      const profilePicture = comment.user.profile_picture || null;
      dto.user = {
        id: comment.user.id,
        username: comment.user.username,
        email: comment.user.email,
        full_name: fullName,
        profile_picture: profilePicture,
        name: fullName || comment.user.username || null, // Full name or username
        image: profilePicture, // Alias for profile_picture
      };
    }

    if (comment.poll) {
      dto.poll = {
        id: comment.poll.id,
        poll_slug: comment.poll.poll_slug,
        poll_title: comment.poll.poll_title,
      };
    }

    if (comment.user_like_status !== undefined) {
      dto.user_like_status = comment.user_like_status;
    }

    if (comment.replies_count !== undefined) {
      dto.replies_count = comment.replies_count;
    }

    if (comment.replies && Array.isArray(comment.replies)) {
      dto.replies = comment.replies.map((reply: any) =>
        this.mapPollCommentToResponseDto(reply),
      );
    }

    return dto;
  }

  // Get All User Comments (Post and Poll comments, including replies)
  async getUserComments(
    userId: number,
    listQueryDto: ListCommentsQueryDto,
    loggedUserId?: number,
  ): Promise<{
    data: CommentResponseDto[];
    meta: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  }> {
    const page = listQueryDto.page || 1;
    const limit = listQueryDto.limit || 10;
    const skip = (page - 1) * limit;

    // Get post comments (including replies)
    const postCommentsQueryBuilder = this.postCommentRepository
      .createQueryBuilder('comment')
      .where('comment.user_id = :userId', { userId })
      .leftJoinAndSelect('comment.user', 'user')
      .leftJoinAndSelect('comment.post', 'post');

    if (listQueryDto.is_approved !== undefined) {
      postCommentsQueryBuilder.andWhere('comment.is_approved = :isApproved', {
        isApproved: listQueryDto.is_approved ? 1 : 0,
      });
    } else {
      postCommentsQueryBuilder.andWhere('comment.is_approved = :isApproved', {
        isApproved: 1,
      });
    }

    if (listQueryDto.search) {
      postCommentsQueryBuilder.andWhere('comment.comment_content LIKE :search', {
        search: `%${listQueryDto.search}%`,
      });
    }

    const sortBy = listQueryDto.sort_by || 'created_at';
    const sortOrder = listQueryDto.sort_order || 'DESC';
    postCommentsQueryBuilder.orderBy(`comment.${sortBy}`, sortOrder);

    const postComments = await postCommentsQueryBuilder.getMany();

    // Get poll comments (including replies)
    const pollCommentsQueryBuilder = this.pollCommentRepository
      .createQueryBuilder('comment')
      .where('comment.user_id = :userId', { userId })
      .leftJoinAndSelect('comment.user', 'user')
      .leftJoinAndSelect('comment.poll', 'poll');

    if (listQueryDto.is_approved !== undefined) {
      pollCommentsQueryBuilder.andWhere('comment.is_approved = :isApproved', {
        isApproved: listQueryDto.is_approved ? 1 : 0,
      });
    } else {
      pollCommentsQueryBuilder.andWhere('comment.is_approved = :isApproved', {
        isApproved: 1,
      });
    }

    if (listQueryDto.search) {
      pollCommentsQueryBuilder.andWhere('comment.comment_content LIKE :search', {
        search: `%${listQueryDto.search}%`,
      });
    }

    pollCommentsQueryBuilder.orderBy(`comment.${sortBy}`, sortOrder);

    const pollComments = await pollCommentsQueryBuilder.getMany();

    // Combine and sort all comments
    const allComments: any[] = [];
    
    // Process post comments
    for (const comment of postComments) {
      const userIds = new Set<number>();
      if (comment.user_id) userIds.add(comment.user_id);

      const userProfilesMap = new Map<number, UserProfile>();
      if (userIds.size > 0) {
        const profiles = await this.userProfileRepository.find({
          where: { user_id: In(Array.from(userIds)) },
          select: ['user_id', 'full_name', 'profile_picture'],
        });
        profiles.forEach((profile) => {
          userProfilesMap.set(profile.user_id, profile);
        });
      }

      const response: any = { ...comment };
      
      if (comment.user && userProfilesMap.has(comment.user.id)) {
        const profile = userProfilesMap.get(comment.user.id);
        (comment.user as any).profile_picture = profile?.profile_picture || null;
        (comment.user as any).full_name = profile?.full_name || null;
        (comment.user as any).name = profile?.full_name || comment.user.username || null;
        (comment.user as any).image = profile?.profile_picture || null;
      }

      // Get user like status (only for post comments)
      if (loggedUserId) {
        const userLike = await this.commentLikeRepository.findOne({
          where: {
            comment_id: comment.id,
            user_id: loggedUserId,
          },
        });
        response.user_like_status = userLike?.like_status || null;
      } else {
        response.user_like_status = null;
      }

      // Get replies count
      const repliesCount = await this.postCommentRepository.count({
        where: { parent_comment_id: comment.id, is_approved: true },
      });
      response.replies_count = repliesCount;

      allComments.push(this.mapPostCommentToResponseDto(response));
    }

    // Process poll comments
    for (const comment of pollComments) {
      const userIds = new Set<number>();
      if (comment.user_id) userIds.add(comment.user_id);

      const userProfilesMap = new Map<number, UserProfile>();
      if (userIds.size > 0) {
        const profiles = await this.userProfileRepository.find({
          where: { user_id: In(Array.from(userIds)) },
          select: ['user_id', 'full_name', 'profile_picture'],
        });
        profiles.forEach((profile) => {
          userProfilesMap.set(profile.user_id, profile);
        });
      }

      const response: any = { ...comment };
      
      if (comment.user && userProfilesMap.has(comment.user.id)) {
        const profile = userProfilesMap.get(comment.user.id);
        (comment.user as any).profile_picture = profile?.profile_picture || null;
        (comment.user as any).full_name = profile?.full_name || null;
        (comment.user as any).name = profile?.full_name || comment.user.username || null;
        (comment.user as any).image = profile?.profile_picture || null;
      }

      // Poll comments don't support likes
      response.user_like_status = null;

      // Get replies count
      const repliesCount = await this.pollCommentRepository.count({
        where: { parent_comment_id: comment.id, is_approved: true },
      });
      response.replies_count = repliesCount;

      allComments.push(this.mapPollCommentToResponseDto(response));
    }

    // Sort by created_at DESC
    allComments.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA;
    });

    // Apply pagination
    const total = allComments.length;
    const paginatedComments = allComments.slice(skip, skip + limit);

    return {
      data: paginatedComments,
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  }
}

