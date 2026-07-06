import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentResponseDto } from './dto/comment-response.dto';
import { ListCommentsQueryDto } from './dto/list-comments-query.dto';
import { LikeCommentDto } from './dto/like-comment.dto';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '@prisma/client';
import { QuotaService } from '../entitlements/quota.service';

@Injectable()
export class CommentService {
  private readonly logger = new Logger(CommentService.name);

  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
    private quotaService: QuotaService,
  ) {}

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
      throw new BadRequestException(
        'Either post_id or poll_id must be provided',
      );
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
      const post = await this.prisma.userPost.findUnique({
        where: { id: createCommentDto.post_id },
        select: { id: true, post_status: true },
      });

      if (!post) {
        throw new NotFoundException('Post not found');
      }

      // Validate parent comment if provided
      if (createCommentDto.parent_comment_id) {
        const parentComment = await this.prisma.postComment.findFirst({
          where: {
            id: createCommentDto.parent_comment_id,
            post_id: createCommentDto.post_id,
          },
          select: { id: true },
        });

        if (!parentComment) {
          throw new NotFoundException(
            'Parent comment not found or does not belong to this post',
          );
        }
      }

      const savedComment = await this.prisma.postComment.create({
        data: {
          post_id: createCommentDto.post_id,
          user_id: userId,
          parent_comment_id: createCommentDto.parent_comment_id || null,
          comment_content: createCommentDto.comment_content,
          like_count: 0,
          dislike_count: 0,
          is_approved: true,
          created_by: userId,
        },
      });

      // Update post comment count
      await this.incrementPostCommentCount(createCommentDto.post_id);

      // Notify post owner OR parent-comment author (reply takes priority)
      const postFull = await this.prisma.userPost.findUnique({
        where: { id: createCommentDto.post_id },
        select: { id: true, user_id: true, post_title: true, post_slug: true },
      });
      const actor = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, username: true },
      });
      const actorName = actor?.username || 'Someone';

      if (createCommentDto.parent_comment_id) {
        // Notify parent comment author about the reply
        const parentComment = await this.prisma.postComment.findUnique({
          where: { id: createCommentDto.parent_comment_id },
          select: { id: true, user_id: true },
        });
        if (parentComment) {
          await this.safeNotify({
            user_id: parentComment.user_id,
            actor_id: userId,
            notification_type: NotificationType.reply,
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
          notification_type: NotificationType.comment,
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
      const poll = await this.prisma.userPoll.findUnique({
        where: { id: createCommentDto.poll_id },
        select: { id: true, poll_status: true },
      });

      if (!poll) {
        throw new NotFoundException('Poll not found');
      }

      // Validate parent comment if provided
      if (createCommentDto.parent_comment_id) {
        const parentComment = await this.prisma.pollComment.findFirst({
          where: {
            id: createCommentDto.parent_comment_id,
            poll_id: createCommentDto.poll_id,
          },
          select: { id: true },
        });

        if (!parentComment) {
          throw new NotFoundException(
            'Parent comment not found or does not belong to this poll',
          );
        }
      }

      const savedComment = await this.prisma.pollComment.create({
        data: {
          poll_id: createCommentDto.poll_id,
          user_id: userId,
          parent_comment_id: createCommentDto.parent_comment_id || null,
          comment_content: createCommentDto.comment_content,
          like_count: 0,
          dislike_count: 0,
          is_approved: true,
          created_by: userId,
        },
      });

      // Notify poll owner OR parent-comment author
      const pollFull = await this.prisma.userPoll.findUnique({
        where: { id: createCommentDto.poll_id },
        select: { id: true, user_id: true, poll_title: true, poll_slug: true },
      });
      const actor = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, username: true },
      });
      const actorName = actor?.username || 'Someone';

      if (createCommentDto.parent_comment_id) {
        const parentComment = await this.prisma.pollComment.findUnique({
          where: { id: createCommentDto.parent_comment_id },
          select: { id: true, user_id: true },
        });
        if (parentComment) {
          await this.safeNotify({
            user_id: parentComment.user_id,
            actor_id: userId,
            notification_type: NotificationType.reply,
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
          notification_type: NotificationType.comment,
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

    const isPostComments = !!listQueryDto.post_id;
    const isPollComments = !!listQueryDto.poll_id;

    if (isPostComments) {
      return this.getPostComments(listQueryDto, userId, page, limit, skip);
    } else if (isPollComments) {
      return this.getPollComments(listQueryDto, userId, page, limit, skip);
    } else {
      return {
        data: [],
        meta: { total: 0, page, limit, total_pages: 0 },
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
    // Only top-level comments (no parent)
    const where: any = { parent_comment_id: null };

    if (listQueryDto.post_id) {
      where.post_id = listQueryDto.post_id;
    }

    if (listQueryDto.user_id) {
      where.user_id = listQueryDto.user_id;
    }

    where.is_approved =
      listQueryDto.is_approved !== undefined ? listQueryDto.is_approved : true;

    if (listQueryDto.search) {
      where.comment_content = { contains: listQueryDto.search };
    }

    const sortBy = listQueryDto.sort_by || 'created_at';
    const sortOrder = (listQueryDto.sort_order || 'DESC').toLowerCase();
    const orderBy: any = { [sortBy]: sortOrder };

    // Get total count
    const total = await this.prisma.postComment.count({ where });

    const comments = await this.prisma.postComment.findMany({
      where,
      orderBy,
      take: limit,
      skip,
      include: { user: true, post: true },
    });

    // Get unique user IDs for batch profile loading
    const userIds = new Set<number>();
    comments.forEach((comment) => {
      if (comment.user_id) userIds.add(comment.user_id);
    });

    const userProfilesMap = new Map<number, any>();
    if (userIds.size > 0) {
      const profiles = await this.prisma.userProfile.findMany({
        where: { user_id: { in: Array.from(userIds) } },
        select: { user_id: true, full_name: true, profile_picture: true },
      });
      profiles.forEach((profile) => {
        userProfilesMap.set(profile.user_id, profile);
      });
    }

    // Process comments
    const commentsWithData = await Promise.all(
      comments.map(async (comment) => {
        const response: any = { ...comment };

        // Attach profile data to user
        if (comment.user && userProfilesMap.has(comment.user.id)) {
          const profile = userProfilesMap.get(comment.user.id);
          (comment.user as any).profile_picture =
            profile?.profile_picture || null;
          (comment.user as any).full_name = profile?.full_name || null;
        }

        // Get user like status
        if (userId) {
          const userLike = await this.prisma.commentLike.findFirst({
            where: { comment_id: comment.id, user_id: userId },
          });
          response.user_like_status = userLike?.like_status || null;
        }

        // Get replies count
        response.replies_count = await this.prisma.postComment.count({
          where: { parent_comment_id: comment.id, is_approved: true },
        });

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
    // Only top-level comments (no parent)
    const where: any = { parent_comment_id: null };

    if (listQueryDto.poll_id) {
      where.poll_id = listQueryDto.poll_id;
    }

    if (listQueryDto.user_id) {
      where.user_id = listQueryDto.user_id;
    }

    where.is_approved =
      listQueryDto.is_approved !== undefined ? listQueryDto.is_approved : true;

    if (listQueryDto.search) {
      where.comment_content = { contains: listQueryDto.search };
    }

    const sortBy = listQueryDto.sort_by || 'created_at';
    const sortOrder = (listQueryDto.sort_order || 'DESC').toLowerCase();
    const orderBy: any = { [sortBy]: sortOrder };

    // Get total count
    const total = await this.prisma.pollComment.count({ where });

    const comments = await this.prisma.pollComment.findMany({
      where,
      orderBy,
      take: limit,
      skip,
      include: { user: true, poll: true },
    });

    // Get unique user IDs for batch profile loading
    const userIds = new Set<number>();
    comments.forEach((comment) => {
      if (comment.user_id) userIds.add(comment.user_id);
    });

    const userProfilesMap = new Map<number, any>();
    if (userIds.size > 0) {
      const profiles = await this.prisma.userProfile.findMany({
        where: { user_id: { in: Array.from(userIds) } },
        select: { user_id: true, full_name: true, profile_picture: true },
      });
      profiles.forEach((profile) => {
        userProfilesMap.set(profile.user_id, profile);
      });
    }

    // Process comments
    const commentsWithData = await Promise.all(
      comments.map(async (comment) => {
        const response: any = { ...comment };

        // Attach profile data to user
        if (comment.user && userProfilesMap.has(comment.user.id)) {
          const profile = userProfilesMap.get(comment.user.id);
          (comment.user as any).profile_picture =
            profile?.profile_picture || null;
          (comment.user as any).full_name = profile?.full_name || null;
        }

        // Note: Poll comments don't have likes yet
        response.user_like_status = null;

        // Get replies count
        response.replies_count = await this.prisma.pollComment.count({
          where: { parent_comment_id: comment.id, is_approved: true },
        });

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
    const postComment: any = await this.prisma.postComment.findUnique({
      where: { id: commentId },
      include: { user: true, post: true },
    });

    const isPostComment = !!postComment;
    let comment: any = postComment;

    // If not found, try poll comment
    if (!comment) {
      comment = await this.prisma.pollComment.findUnique({
        where: { id: commentId },
        include: { user: true, poll: true },
      });
    }

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Load user profile
    const userProfilesMap = new Map<number, any>();
    if (comment.user_id) {
      const profile = await this.prisma.userProfile.findFirst({
        where: { user_id: comment.user_id },
        select: { user_id: true, full_name: true, profile_picture: true },
      });
      if (profile) {
        userProfilesMap.set(comment.user_id, profile);
      }
    }

    // Attach profile to user
    if (comment.user && userProfilesMap.has(comment.user.id)) {
      const profile = userProfilesMap.get(comment.user.id);
      comment.user.profile_picture = profile?.profile_picture || null;
      comment.user.full_name = profile?.full_name || null;
    }

    const commentResponse: any = { ...comment };

    // Get user like status (only for post comments)
    if (userId && isPostComment) {
      const userLike = await this.prisma.commentLike.findFirst({
        where: { comment_id: commentId, user_id: userId },
      });
      commentResponse.user_like_status = userLike?.like_status || null;
    } else {
      commentResponse.user_like_status = null;
    }

    // Get replies count
    if (isPostComment) {
      commentResponse.replies_count = await this.prisma.postComment.count({
        where: { parent_comment_id: commentId, is_approved: true },
      });
      return this.mapPostCommentToResponseDto(commentResponse);
    } else {
      commentResponse.replies_count = await this.prisma.pollComment.count({
        where: { parent_comment_id: commentId, is_approved: true },
      });
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
    const postComment = await this.prisma.postComment.findUnique({
      where: { id: commentId },
      select: { id: true, post_id: true },
    });

    if (postComment) {
      return this.getPostCommentReplies(commentId, listQueryDto, userId);
    }

    const pollComment = await this.prisma.pollComment.findUnique({
      where: { id: commentId },
      select: { id: true, poll_id: true },
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

    const where: any = { parent_comment_id: commentId };

    where.is_approved =
      listQueryDto.is_approved !== undefined ? listQueryDto.is_approved : true;

    if (listQueryDto.search) {
      where.comment_content = { contains: listQueryDto.search };
    }

    const sortBy = listQueryDto.sort_by || 'created_at';
    const sortOrder = (listQueryDto.sort_order || 'ASC').toLowerCase();
    const orderBy: any = { [sortBy]: sortOrder };

    const total = await this.prisma.postComment.count({ where });

    const replies = await this.prisma.postComment.findMany({
      where,
      orderBy,
      take: limit,
      skip,
      include: { user: true, post: true },
    });

    // Load user profiles
    const userIds = new Set<number>();
    replies.forEach((reply) => {
      if (reply.user_id) userIds.add(reply.user_id);
    });

    const userProfilesMap = new Map<number, any>();
    if (userIds.size > 0) {
      const profiles = await this.prisma.userProfile.findMany({
        where: { user_id: { in: Array.from(userIds) } },
        select: { user_id: true, full_name: true, profile_picture: true },
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
          const userLike = await this.prisma.commentLike.findFirst({
            where: { comment_id: reply.id, user_id: userId },
          });
          reply.user_like_status = userLike?.like_status || null;
        }

        // Get replies count for each reply
        reply.replies_count = await this.prisma.postComment.count({
          where: { parent_comment_id: reply.id, is_approved: true },
        });

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

    const where: any = { parent_comment_id: commentId };

    where.is_approved =
      listQueryDto.is_approved !== undefined ? listQueryDto.is_approved : true;

    if (listQueryDto.search) {
      where.comment_content = { contains: listQueryDto.search };
    }

    const sortBy = listQueryDto.sort_by || 'created_at';
    const sortOrder = (listQueryDto.sort_order || 'ASC').toLowerCase();
    const orderBy: any = { [sortBy]: sortOrder };

    const total = await this.prisma.pollComment.count({ where });

    const replies = await this.prisma.pollComment.findMany({
      where,
      orderBy,
      take: limit,
      skip,
      include: { user: true, poll: true },
    });

    // Load user profiles
    const userIds = new Set<number>();
    replies.forEach((reply) => {
      if (reply.user_id) userIds.add(reply.user_id);
    });

    const userProfilesMap = new Map<number, any>();
    if (userIds.size > 0) {
      const profiles = await this.prisma.userProfile.findMany({
        where: { user_id: { in: Array.from(userIds) } },
        select: { user_id: true, full_name: true, profile_picture: true },
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
        reply.replies_count = await this.prisma.pollComment.count({
          where: { parent_comment_id: reply.id, is_approved: true },
        });

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
    const postComment: any = await this.prisma.postComment.findUnique({
      where: { id: commentId },
    });

    const isPostComment = !!postComment;
    let comment: any = postComment;

    // If not found, try poll comment
    if (!comment) {
      comment = await this.prisma.pollComment.findUnique({
        where: { id: commentId },
      });
    }

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Check if user owns the comment (unless updating approval status - admin only)
    if (updateCommentDto.is_approved !== undefined) {
      // Approval status update requires admin role - this would be checked in controller
    } else if (comment.user_id !== userId) {
      throw new ForbiddenException('You can only update your own comments');
    }

    const updateData: any = { ...updateCommentDto, updated_by: userId };

    if (isPostComment) {
      const updatedComment = await this.prisma.postComment.update({
        where: { id: commentId },
        data: updateData,
      });
      return this.mapPostCommentToResponseDto(updatedComment);
    } else {
      const updatedComment = await this.prisma.pollComment.update({
        where: { id: commentId },
        data: updateData,
      });
      return this.mapPollCommentToResponseDto(updatedComment);
    }
  }

  // Delete Comment (Post or Poll)
  async deleteComment(
    commentId: number,
    userId: number,
  ): Promise<{ message: string }> {
    // Try to find as post comment first
    const postComment: any = await this.prisma.postComment.findUnique({
      where: { id: commentId },
    });

    const isPostComment = !!postComment;
    let comment: any = postComment;

    // If not found, try poll comment
    if (!comment) {
      comment = await this.prisma.pollComment.findUnique({
        where: { id: commentId },
      });
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
      repliesCount = await this.prisma.postComment.count({
        where: { parent_comment_id: commentId },
      });
    } else {
      repliesCount = await this.prisma.pollComment.count({
        where: { parent_comment_id: commentId },
      });
    }

    if (repliesCount > 0) {
      // Soft delete: mark as not approved instead of deleting
      if (isPostComment) {
        await this.prisma.postComment.update({
          where: { id: commentId },
          data: { is_approved: false, updated_by: userId },
        });
      } else {
        await this.prisma.pollComment.update({
          where: { id: commentId },
          data: { is_approved: false, updated_by: userId },
        });
      }
      return { message: 'Comment deleted successfully (soft delete)' };
    }

    // Hard delete if no replies
    if (isPostComment) {
      const postId = comment.post_id;
      await this.prisma.postComment.delete({ where: { id: commentId } });
      // Update post comment count
      await this.decrementPostCommentCount(postId);
    } else {
      await this.prisma.pollComment.delete({ where: { id: commentId } });
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
    const comment = await this.prisma.postComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      // Check if it's a poll comment
      const pollComment = await this.prisma.pollComment.findUnique({
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
    const existingLike = await this.prisma.commentLike.findFirst({
      where: { comment_id: commentId, user_id: userId },
    });

    if (existingLike) {
      // If same status, remove like/dislike
      if (existingLike.like_status === likeCommentDto.like_status) {
        await this.prisma.commentLike.delete({
          where: { id: existingLike.id },
        });

        // Update counts
        const countUpdate: any = {};
        if (existingLike.like_status === 'like') {
          countUpdate.like_count = { decrement: 1 };
        } else {
          countUpdate.dislike_count = { decrement: 1 };
        }

        const updatedComment = await this.prisma.postComment.update({
          where: { id: commentId },
          data: countUpdate,
        });

        return {
          message: 'Comment like/dislike removed successfully',
          like_count: updatedComment.like_count,
          dislike_count: updatedComment.dislike_count,
          like_status: null,
        };
      } else {
        // Update existing like/dislike
        const oldStatus = existingLike.like_status;
        await this.prisma.commentLike.update({
          where: { id: existingLike.id },
          data: { like_status: likeCommentDto.like_status, updated_by: userId },
        });

        // Update counts (decrement old, increment new)
        const countUpdate: any = {};
        if (oldStatus === 'like') {
          countUpdate.like_count = { decrement: 1 };
          countUpdate.dislike_count = { increment: 1 };
        } else {
          countUpdate.dislike_count = { decrement: 1 };
          countUpdate.like_count = { increment: 1 };
        }

        const updatedComment = await this.prisma.postComment.update({
          where: { id: commentId },
          data: countUpdate,
        });

        return {
          message: `Comment ${likeCommentDto.like_status}d successfully`,
          like_count: updatedComment.like_count,
          dislike_count: updatedComment.dislike_count,
          like_status: likeCommentDto.like_status,
        };
      }
    }

    // Create new like/dislike
    await this.prisma.commentLike.create({
      data: {
        comment_id: commentId,
        user_id: userId,
        like_status: likeCommentDto.like_status,
        created_by: userId,
      },
    });

    // Update counts
    const countUpdate: any = {};
    if (likeCommentDto.like_status === 'like') {
      countUpdate.like_count = { increment: 1 };
    } else {
      countUpdate.dislike_count = { increment: 1 };
    }

    const updatedComment = await this.prisma.postComment.update({
      where: { id: commentId },
      data: countUpdate,
    });

    // Notify comment author only on a new LIKE (not dislike, not status change)
    if (likeCommentDto.like_status === 'like') {
      const actor = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, username: true },
      });
      const actorName = actor?.username || 'Someone';
      await this.safeNotify({
        user_id: comment.user_id,
        actor_id: userId,
        notification_type: NotificationType.like,
        title: 'Someone liked your comment',
        body: `${actorName} liked your comment`,
        related_id: comment.id,
        related_type: 'comment',
      });
    }

    return {
      message: `Comment ${likeCommentDto.like_status}d successfully`,
      like_count: updatedComment.like_count,
      dislike_count: updatedComment.dislike_count,
      like_status: likeCommentDto.like_status,
    };
  }

  // Helper: Increment post comment count
  private async incrementPostCommentCount(postId: number): Promise<void> {
    await this.prisma.userPost.update({
      where: { id: postId },
      data: { comment_count: { increment: 1 } },
    });
  }

  // Helper: Decrement post comment count
  private async decrementPostCommentCount(postId: number): Promise<void> {
    await this.prisma.userPost.update({
      where: { id: postId },
      data: { comment_count: { decrement: 1 } },
    });
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

    const sortBy = listQueryDto.sort_by || 'created_at';
    const sortOrder = (listQueryDto.sort_order || 'DESC').toLowerCase();
    const orderBy: any = { [sortBy]: sortOrder };

    const isApproved =
      listQueryDto.is_approved !== undefined ? listQueryDto.is_approved : true;

    // Build post comments where
    const postWhere: any = { user_id: userId, is_approved: isApproved };
    if (listQueryDto.search) {
      postWhere.comment_content = { contains: listQueryDto.search };
    }

    // Build poll comments where
    const pollWhere: any = { user_id: userId, is_approved: isApproved };
    if (listQueryDto.search) {
      pollWhere.comment_content = { contains: listQueryDto.search };
    }

    // Fetch post and poll comments in parallel
    const [postComments, pollComments] = await Promise.all([
      this.prisma.postComment.findMany({
        where: postWhere,
        orderBy,
        include: { user: true, post: true },
      }),
      this.prisma.pollComment.findMany({
        where: pollWhere,
        orderBy,
        include: { user: true, poll: true },
      }),
    ]);

    // Combine and sort all comments
    const allComments: any[] = [];

    // Process post comments
    for (const comment of postComments) {
      const response: any = { ...comment };

      // Load user profile
      if (comment.user_id) {
        const profile = await this.prisma.userProfile.findFirst({
          where: { user_id: comment.user_id },
          select: { user_id: true, full_name: true, profile_picture: true },
        });
        if (profile && comment.user) {
          (comment.user as any).profile_picture =
            profile.profile_picture || null;
          (comment.user as any).full_name = profile.full_name || null;
          (comment.user as any).name =
            profile.full_name || comment.user.username || null;
          (comment.user as any).image = profile.profile_picture || null;
        }
      }

      // Get user like status (only for post comments)
      if (loggedUserId) {
        const userLike = await this.prisma.commentLike.findFirst({
          where: { comment_id: comment.id, user_id: loggedUserId },
        });
        response.user_like_status = userLike?.like_status || null;
      } else {
        response.user_like_status = null;
      }

      // Get replies count
      response.replies_count = await this.prisma.postComment.count({
        where: { parent_comment_id: comment.id, is_approved: true },
      });

      allComments.push(this.mapPostCommentToResponseDto(response));
    }

    // Process poll comments
    for (const comment of pollComments) {
      const response: any = { ...comment };

      // Load user profile
      if (comment.user_id) {
        const profile = await this.prisma.userProfile.findFirst({
          where: { user_id: comment.user_id },
          select: { user_id: true, full_name: true, profile_picture: true },
        });
        if (profile && comment.user) {
          (comment.user as any).profile_picture =
            profile.profile_picture || null;
          (comment.user as any).full_name = profile.full_name || null;
          (comment.user as any).name =
            profile.full_name || comment.user.username || null;
          (comment.user as any).image = profile.profile_picture || null;
        }
      }

      // Poll comments don't support likes
      response.user_like_status = null;

      // Get replies count
      response.replies_count = await this.prisma.pollComment.count({
        where: { parent_comment_id: comment.id, is_approved: true },
      });

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
