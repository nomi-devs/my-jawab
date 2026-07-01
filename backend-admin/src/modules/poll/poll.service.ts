import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePollDto } from './dto/create-poll.dto';
import { UpdatePollDto } from './dto/update-poll.dto';
import {
  PollResponseDto,
  PollOptionResponseDto,
} from './dto/poll-response.dto';
import { ListPollsQueryDto } from './dto/list-polls-query.dto';
import { VotePollDto } from './dto/vote-poll.dto';
import { LikePollDto } from './dto/like-poll.dto';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/entities/notification.entity';

@Injectable()
export class PollService {
  private readonly logger = new Logger(PollService.name);

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
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  /**
   * Helper: send a notification without breaking the main flow.
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

  // Helper: Check if date is at least tomorrow (not same day)
  private isAtLeastTomorrow(date: Date): boolean {
    // Get tomorrow at 00:00:00 UTC for consistent comparison
    const now = new Date();
    const tomorrow = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1,
        0,
        0,
        0,
        0,
      ),
    );
    return date >= tomorrow;
  }

  // Helper: Get server timezone offset in hours (positive for ahead of UTC, e.g., 3 for UTC+3)
  // Automatically detects server's timezone offset
  private getServerTimezoneOffsetHours(): number {
    // Automatically get server's timezone offset
    // getTimezoneOffset() returns minutes, negative for ahead of UTC
    // Convert to hours and negate (e.g., -180 minutes for UTC+3 becomes 3 hours)
    const serverOffsetMinutes = new Date().getTimezoneOffset();
    return -serverOffsetMinutes / 60;
  }

  // Helper: Parse date string properly (handles datetime-local format from frontend)
  // Parses datetime-local as local time, then converts to UTC for storage
  private parseDateString(dateString: string): Date {
    // If the string is in datetime-local format (YYYY-MM-DDTHH:mm), parse it as local time
    // then convert to UTC for storage in MySQL TIMESTAMP (which stores in UTC)
    const datetimeLocalPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/;

    if (datetimeLocalPattern.test(dateString)) {
      // Format: YYYY-MM-DDTHH:mm or YYYY-MM-DDTHH:mm:ss (datetime-local format)
      const [datePart, timePart] = dateString.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      const timeComponents = timePart.split(':');
      const hours = Number(timeComponents[0]) || 0;
      const minutes = Number(timeComponents[1]) || 0;
      const seconds = Number(timeComponents[2]) || 0;

      // Get server timezone offset in hours (e.g., 3 for UTC+3)
      const serverOffsetHours = this.getServerTimezoneOffsetHours();

      // Parse the datetime-local as if it's in the server's timezone
      // Then convert to UTC by subtracting the offset
      // Example: If server is UTC+3 and user selects 10:00 AM, we store 7:00 AM UTC
      // Create date components in UTC, adjusting for the offset
      const utcDate = new Date(
        Date.UTC(year, month - 1, day, hours, minutes, seconds, 0),
      );
      // Subtract the offset to convert from local to UTC
      // If offset is +3 (UTC+3), subtract 3 hours to get UTC
      const adjustedUtcDate = new Date(
        utcDate.getTime() - serverOffsetHours * 60 * 60 * 1000,
      );
      return adjustedUtcDate;
    }

    // For ISO strings with timezone info (e.g., "2024-12-23T10:00:00Z" or "2024-12-23T10:00:00+03:00")
    // use standard Date constructor which handles timezone conversion
    return new Date(dateString);
  }

  // Helper: Convert UTC date to local time string for display
  // Returns date as string in format "YYYY-MM-DDTHH:mm:ss" (local time, no timezone indicator)
  private convertUtcToLocalString(utcDate: Date | null): string | null {
    if (!utcDate) return null;

    // Get server timezone offset in hours (e.g., 3 for UTC+3)
    const serverOffsetHours = this.getServerTimezoneOffsetHours();

    // Convert UTC to local time by adding the offset
    // Example: If server is UTC+3 and we have 7:00 AM UTC, return 10:00 AM local
    // If offset is +3 (UTC+3), add 3 hours to get local time
    const localTimeMs = utcDate.getTime() + serverOffsetHours * 60 * 60 * 1000;
    const localDate = new Date(localTimeMs);

    // Format as YYYY-MM-DDTHH:mm:ss using UTC methods (since we've already adjusted the time)
    // The localDate now represents local time, so we use UTC methods to extract the components
    const year = localDate.getUTCFullYear();
    const month = String(localDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(localDate.getUTCDate()).padStart(2, '0');
    const hours = String(localDate.getUTCHours()).padStart(2, '0');
    const minutes = String(localDate.getUTCMinutes()).padStart(2, '0');
    const seconds = String(localDate.getUTCSeconds()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  }

  // Create Poll
  async createPoll(
    createPollDto: CreatePollDto,
    userId: number,
  ): Promise<PollResponseDto> {
    // Note: Slug uniqueness check removed - slugs will include ID hash to ensure uniqueness

    // Parse and validate expiration date if provided (must be at least tomorrow if set)
    let expiresAt: Date | null = null;
    if (createPollDto.poll_expires_at) {
      expiresAt = this.parseDateString(createPollDto.poll_expires_at);
      if (!this.isAtLeastTomorrow(expiresAt)) {
        throw new BadRequestException(
          'Poll expiration date must be at least tomorrow. Polls cannot expire on the same day they are created.',
        );
      }
    }

    // Convert community_ids array to comma-separated string
    const communityIdsString = createPollDto.community_ids
      ? createPollDto.community_ids.join(',')
      : null;

    // Save to get the ID (with initial slug; will be updated with hash)
    const savedPoll = await this.prisma.userPoll.create({
      data: {
        user_id: userId,
        community_ids: communityIdsString,
        poll_slug: createPollDto.poll_slug,
        poll_title: createPollDto.poll_title,
        poll_description: createPollDto.poll_description,
        poll_expires_at: expiresAt,
        poll_status: createPollDto.poll_status || 'draft',
        vote_count: 0,
        view_count: 0,
        is_featured: createPollDto.is_featured === 'featured',
        created_by: userId,
      },
    });

    // Generate slug with ID hash and update
    const finalSlug = this.generateSlugWithHash(
      createPollDto.poll_slug,
      savedPoll.id,
    );
    const finalPoll = await this.prisma.userPoll.update({
      where: { id: savedPoll.id },
      data: { poll_slug: finalSlug },
    });

    // Create poll options
    await this.prisma.pollOption.createMany({
      data: createPollDto.options.map((optionDto, index) => ({
        poll_id: savedPoll.id,
        option_text: optionDto.option_text,
        display_order: optionDto.display_order ?? index,
        vote_count: 0,
        is_active: true,
        created_by: userId,
      })),
    });

    return this.mapToResponseDto(finalPoll);
  }

  // Get All Polls with pagination and filters
  async getPolls(
    listQueryDto: ListPollsQueryDto,
    userId?: number,
  ): Promise<{
    data: PollResponseDto[];
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

    // Build where condition
    const where: any = {};

    if (listQueryDto.user_id) {
      where.user_id = listQueryDto.user_id;
    }

    if (listQueryDto.poll_status) {
      where.poll_status = listQueryDto.poll_status;
    } else {
      where.poll_status = 'published';
    }

    if (listQueryDto.is_featured !== undefined) {
      where.is_featured = listQueryDto.is_featured;
    }

    // Filter by community if provided (CSV matching)
    if (listQueryDto.community_id) {
      const cid = `${listQueryDto.community_id}`;
      where.OR = [
        { community_ids: cid },
        { community_ids: { startsWith: `${cid},` } },
        { community_ids: { endsWith: `,${cid}` } },
        { community_ids: { contains: `,${cid},` } },
      ];
    }

    // Add search if provided
    if (listQueryDto.search) {
      const searchCondition = {
        OR: [
          { poll_title: { contains: listQueryDto.search } },
          { poll_description: { contains: listQueryDto.search } },
        ],
      };
      // Merge with existing where conditions
      if (where.OR) {
        where.AND = [{ OR: where.OR }, searchCondition];
        delete where.OR;
      } else {
        Object.assign(where, searchCondition);
      }
    }

    // Build orderBy
    const sortBy = listQueryDto.sort_by || 'created_at';
    const sortOrder = (listQueryDto.sort_order || 'DESC').toLowerCase() as
      | 'asc'
      | 'desc';
    let orderBy: any = {};

    if (sortBy === 'top') {
      orderBy = [{ vote_count: 'desc' }, { created_at: 'desc' }];
    } else if (sortBy === 'hot') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      where.created_at = { gte: sevenDaysAgo };
      orderBy = [{ vote_count: 'desc' }, { created_at: 'desc' }];
    } else if (sortBy === 'new') {
      orderBy = { created_at: 'desc' };
    } else if (sortBy === 'rising') {
      orderBy = [{ vote_count: 'desc' }, { created_at: 'desc' }];
    } else {
      orderBy = { [sortBy]: sortOrder };
    }

    // Build include
    const include: any = {};
    if (listQueryDto.include_user) {
      include.user = true;
    }
    if (listQueryDto.include_options || userId) {
      include.options = true;
    }

    const [polls, total] = await Promise.all([
      this.prisma.userPoll.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: Object.keys(include).length > 0 ? include : undefined,
      }),
      this.prisma.userPoll.count({ where }),
    ]);

    // Get user vote and like status for each poll if userId provided
    const pollsWithUserData = await Promise.all(
      polls.map(async (poll) => {
        const response: any = { ...poll };

        // Calculate like and dislike counts
        const [likeCount, dislikeCount] = await Promise.all([
          this.prisma.pollLike.count({
            where: { poll_id: poll.id, like_status: 'like' },
          }),
          this.prisma.pollLike.count({
            where: { poll_id: poll.id, like_status: 'dislike' },
          }),
        ]);
        response.like_count = likeCount;
        response.dislike_count = dislikeCount;

        if (userId) {
          // Get user vote (always include for logged users)
          const userVote = await this.prisma.pollVote.findFirst({
            where: { poll_id: poll.id, user_id: userId },
          });
          if (userVote) {
            response.user_vote = {
              vote_option_id: userVote.vote_option_id,
              created_at: userVote.created_at,
            };
            response.user_has_voted = true;
          } else {
            response.user_has_voted = false;
          }

          // Get user like status
          const userLike = await this.prisma.pollLike.findFirst({
            where: { poll_id: poll.id, user_id: userId },
          });
          response.user_like_status = userLike?.like_status || null;
          response.is_liked = userLike?.like_status === 'like';
          response.is_disliked = userLike?.like_status === 'dislike';
        }

        // Check if poll is expired (only if expiration date is set)
        response.is_expired = poll.poll_expires_at
          ? new Date(poll.poll_expires_at) < new Date()
          : false;

        // Calculate option percentages and mark user's voted option if options included
        if ((response as any).options && (response as any).options.length > 0) {
          const totalVotes = poll.vote_count || 0;
          const userVotedOptionId = response.user_vote?.vote_option_id;

          response.options = (response as any).options.map((option: any) => ({
            ...option,
            percentage:
              totalVotes > 0
                ? Math.round((option.vote_count / totalVotes) * 100 * 100) / 100
                : 0,
            is_voted:
              userId && userVotedOptionId
                ? option.id === userVotedOptionId
                : false,
          }));
        }

        return response;
      }),
    );

    return {
      data: pollsWithUserData.map((poll) => this.mapToResponseDto(poll)),
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  // Get Poll by ID
  async getPollById(
    pollId: number,
    userId?: number,
    skipViewCount?: boolean,
  ): Promise<PollResponseDto> {
    const poll = await this.prisma.userPoll.findUnique({
      where: { id: pollId },
      include: { user: true, options: true },
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    // Increment view count only if not skipped (skip for admin views)
    if (!skipViewCount) {
      await this.prisma.userPoll.update({
        where: { id: pollId },
        data: { view_count: { increment: 1 } },
      });
    }

    const response: any = { ...poll };

    // Get user vote if userId provided
    if (userId) {
      const userVote = await this.prisma.pollVote.findFirst({
        where: { poll_id: pollId, user_id: userId },
      });
      if (userVote) {
        response.user_vote = {
          vote_option_id: userVote.vote_option_id,
          created_at: userVote.created_at,
        };
        response.user_has_voted = true;
      } else {
        response.user_has_voted = false;
      }

      // Get user like status
      const userLike = await this.prisma.pollLike.findFirst({
        where: { poll_id: pollId, user_id: userId },
      });
      response.user_like_status = userLike?.like_status || null;
      response.is_liked = userLike?.like_status === 'like';
      response.is_disliked = userLike?.like_status === 'dislike';
    }

    // Calculate like and dislike counts
    const [likeCount, dislikeCount] = await Promise.all([
      this.prisma.pollLike.count({
        where: { poll_id: pollId, like_status: 'like' },
      }),
      this.prisma.pollLike.count({
        where: { poll_id: pollId, like_status: 'dislike' },
      }),
    ]);
    response.like_count = likeCount;
    response.dislike_count = dislikeCount;

    // Check if poll is expired (only if expiration date is set)
    response.is_expired = poll.poll_expires_at
      ? new Date(poll.poll_expires_at) < new Date()
      : false;

    // Calculate option percentages and mark user's voted option
    if (poll.options && poll.options.length > 0) {
      const totalVotes = poll.vote_count || 0;
      const userVotedOptionId = response.user_vote?.vote_option_id;

      response.options = poll.options.map((option: any) => ({
        ...option,
        percentage:
          totalVotes > 0
            ? Math.round((option.vote_count / totalVotes) * 100 * 100) / 100
            : 0,
        is_voted:
          userId && userVotedOptionId ? option.id === userVotedOptionId : false,
      }));
    }

    return this.mapToResponseDto(response);
  }

  // Get Poll by Slug
  async getPollBySlug(slug: string, userId?: number): Promise<PollResponseDto> {
    const poll = await this.prisma.userPoll.findFirst({
      where: { poll_slug: slug },
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    return this.getPollById(poll.id, userId);
  }

  // Update Poll
  async updatePoll(
    pollId: number,
    updatePollDto: UpdatePollDto,
    userId: number,
  ): Promise<PollResponseDto> {
    const poll = await this.prisma.userPoll.findUnique({
      where: { id: pollId },
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    // Check if user owns the poll
    if (poll.user_id !== userId) {
      throw new ForbiddenException('You can only update your own polls');
    }

    const updateData: any = { updated_by: userId };

    // If slug is being updated, generate new slug with ID hash
    if (updatePollDto.poll_slug && updatePollDto.poll_slug !== poll.poll_slug) {
      updateData.poll_slug = this.generateSlugWithHash(
        updatePollDto.poll_slug,
        poll.id,
      );
    } else if (updatePollDto.poll_slug) {
      updateData.poll_slug = updatePollDto.poll_slug;
    }

    // Validate expiration date if being updated - must be at least tomorrow
    if ('poll_expires_at' in updatePollDto) {
      if (
        updatePollDto.poll_expires_at &&
        typeof updatePollDto.poll_expires_at === 'string' &&
        updatePollDto.poll_expires_at.trim() !== ''
      ) {
        const expiresAt = this.parseDateString(updatePollDto.poll_expires_at);
        if (!this.isAtLeastTomorrow(expiresAt)) {
          throw new BadRequestException(
            'Poll expiration date must be at least tomorrow. Polls cannot expire on the same day they are created.',
          );
        }
        updateData.poll_expires_at = expiresAt;
      } else {
        updateData.poll_expires_at = null;
      }
    }

    // Convert community_ids array to comma-separated string if provided
    if (updatePollDto.community_ids !== undefined) {
      updateData.community_ids = updatePollDto.community_ids.length
        ? updatePollDto.community_ids.join(',')
        : null;
    }

    // Convert is_featured string to boolean if provided
    if (updatePollDto.is_featured !== undefined) {
      updateData.is_featured = updatePollDto.is_featured === 'featured';
    }

    // Copy remaining scalar fields (exclude already-handled ones)
    const {
      poll_slug,
      poll_expires_at,
      community_ids,
      is_featured,
      options,
      ...restDto
    } = updatePollDto as any;
    Object.assign(updateData, restDto);

    // Handle options update if provided
    if (updatePollDto.options) {
      const existingOptions = await this.prisma.pollOption.findMany({
        where: { poll_id: pollId },
      });

      const newOptionsDto = updatePollDto.options;
      const keepOptionIds: number[] = [];

      for (const optionDto of newOptionsDto) {
        if (optionDto.id) {
          const existingOption = existingOptions.find(
            (o) => o.id == optionDto.id,
          );
          if (existingOption) {
            await this.prisma.pollOption.update({
              where: { id: existingOption.id },
              data: {
                option_text: optionDto.option_text,
                display_order:
                  optionDto.display_order ?? existingOption.display_order,
              },
            });
            keepOptionIds.push(existingOption.id);
          }
        } else {
          // Create new option
          const newOption = await this.prisma.pollOption.create({
            data: {
              poll_id: pollId,
              option_text: optionDto.option_text,
              display_order: optionDto.display_order ?? 0,
              vote_count: 0,
              is_active: true,
              created_by: userId,
            },
          });
          keepOptionIds.push(newOption.id);
        }
      }

      // Delete removed options
      const optionIdsToDelete = existingOptions
        .filter((o) => !keepOptionIds.includes(o.id))
        .map((o) => o.id);

      if (optionIdsToDelete.length > 0) {
        await this.prisma.pollOption.deleteMany({
          where: { id: { in: optionIdsToDelete } },
        });
      }
    }

    await this.prisma.userPoll.update({
      where: { id: pollId },
      data: updateData,
    });

    // Re-fetch with options and user relations
    const pollWithRelations = await this.prisma.userPoll.findUnique({
      where: { id: pollId },
      include: { user: true, options: true },
    });

    return this.mapToResponseDto(pollWithRelations);
  }

  // Delete Poll
  async deletePoll(
    pollId: number,
    userId: number,
  ): Promise<{ message: string }> {
    const poll = await this.prisma.userPoll.findUnique({
      where: { id: pollId },
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    // Check if user owns the poll
    if (poll.user_id !== userId) {
      throw new ForbiddenException('You can only delete your own polls');
    }

    // Soft delete by changing status to ended
    await this.prisma.userPoll.update({
      where: { id: pollId },
      data: { poll_status: 'ended', updated_by: userId },
    });

    return { message: 'Poll deleted successfully' };
  }

  // Vote on Poll
  async votePoll(
    pollId: number,
    votePollDto: VotePollDto,
    userId: number,
  ): Promise<{
    message: string;
    vote_count: number;
    option_vote_counts: Record<number, number>;
  }> {
    const poll = await this.prisma.userPoll.findUnique({
      where: { id: pollId },
      include: { options: true },
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    // Check if poll is published
    if (poll.poll_status !== 'published') {
      throw new BadRequestException('Poll is not published');
    }

    // Check if poll is expired (only if expiration date is set)
    if (poll.poll_expires_at && new Date(poll.poll_expires_at) < new Date()) {
      throw new BadRequestException('Poll has expired');
    }

    // Validate option exists and belongs to poll
    const option = poll.options.find(
      (opt) => opt.id === votePollDto.vote_option_id,
    );

    if (!option || !option.is_active) {
      throw new NotFoundException('Poll option not found or inactive');
    }

    // Check if user already voted
    const existingVote = await this.prisma.pollVote.findFirst({
      where: { poll_id: pollId, user_id: userId },
    });

    if (existingVote) {
      // Update existing vote
      const oldOptionId = existingVote.vote_option_id;

      // Decrement old option vote count
      await this.prisma.pollOption.update({
        where: { id: oldOptionId },
        data: { vote_count: { decrement: 1 } },
      });

      // Update vote
      await this.prisma.pollVote.update({
        where: { id: existingVote.id },
        data: {
          vote_option_id: votePollDto.vote_option_id,
          updated_by: userId,
        },
      });

      // Increment new option vote count
      await this.prisma.pollOption.update({
        where: { id: votePollDto.vote_option_id },
        data: { vote_count: { increment: 1 } },
      });
    } else {
      // Create new vote
      await this.prisma.pollVote.create({
        data: {
          poll_id: pollId,
          user_id: userId,
          vote_option_id: votePollDto.vote_option_id,
          created_by: userId,
        },
      });

      // Increment option and poll vote counts
      await this.prisma.pollOption.update({
        where: { id: votePollDto.vote_option_id },
        data: { vote_count: { increment: 1 } },
      });
      await this.prisma.userPoll.update({
        where: { id: pollId },
        data: { vote_count: { increment: 1 } },
      });

      // Notify poll owner about the new vote
      const actor = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, username: true },
      });
      const actorName = actor?.username || 'Someone';
      await this.safeNotify({
        user_id: poll.user_id,
        actor_id: userId,
        notification_type: NotificationType.SYSTEM,
        title: 'Someone voted on your poll',
        body: `${actorName} voted on "${poll.poll_title}"`,
        action_url: `/polls/${poll.poll_slug}`,
        related_id: poll.id,
        related_type: 'poll',
      });
    }

    // Get updated vote counts
    const updatedOptions = await this.prisma.pollOption.findMany({
      where: { poll_id: pollId },
      select: { id: true, vote_count: true },
    });

    const optionVoteCounts: Record<number, number> = {};
    updatedOptions.forEach((opt) => {
      optionVoteCounts[opt.id] = opt.vote_count;
    });

    const updatedPoll = await this.prisma.userPoll.findUnique({
      where: { id: pollId },
      select: { vote_count: true },
    });

    return {
      message: existingVote
        ? 'Vote updated successfully'
        : 'Vote submitted successfully',
      vote_count: updatedPoll?.vote_count || 0,
      option_vote_counts: optionVoteCounts,
    };
  }

  // Like/Dislike Poll
  async likePoll(
    pollId: number,
    likePollDto: LikePollDto,
    userId: number,
  ): Promise<{
    message: string;
    like_count: number;
    dislike_count: number;
    like_status: 'like' | 'dislike' | null;
  }> {
    const poll = await this.prisma.userPoll.findUnique({
      where: { id: pollId },
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    // Check if user already liked/disliked
    const existingLike = await this.prisma.pollLike.findFirst({
      where: { poll_id: pollId, user_id: userId },
    });

    if (existingLike) {
      // If same status, remove like/dislike
      if (existingLike.like_status === likePollDto.like_status) {
        await this.prisma.pollLike.delete({ where: { id: existingLike.id } });

        const [likeCount, dislikeCount] = await Promise.all([
          this.prisma.pollLike.count({
            where: { poll_id: pollId, like_status: 'like' },
          }),
          this.prisma.pollLike.count({
            where: { poll_id: pollId, like_status: 'dislike' },
          }),
        ]);

        return {
          message: 'Poll like/dislike removed successfully',
          like_count: likeCount,
          dislike_count: dislikeCount,
          like_status: null,
        };
      } else {
        // Update existing like/dislike
        await this.prisma.pollLike.update({
          where: { id: existingLike.id },
          data: { like_status: likePollDto.like_status, updated_by: userId },
        });

        const [likeCount, dislikeCount] = await Promise.all([
          this.prisma.pollLike.count({
            where: { poll_id: pollId, like_status: 'like' },
          }),
          this.prisma.pollLike.count({
            where: { poll_id: pollId, like_status: 'dislike' },
          }),
        ]);

        return {
          message: `Poll ${likePollDto.like_status}d successfully`,
          like_count: likeCount,
          dislike_count: dislikeCount,
          like_status: likePollDto.like_status,
        };
      }
    }

    // Create new like/dislike
    await this.prisma.pollLike.create({
      data: {
        poll_id: pollId,
        user_id: userId,
        like_status: likePollDto.like_status,
        created_by: userId,
      },
    });

    const [likeCount, dislikeCount] = await Promise.all([
      this.prisma.pollLike.count({
        where: { poll_id: pollId, like_status: 'like' },
      }),
      this.prisma.pollLike.count({
        where: { poll_id: pollId, like_status: 'dislike' },
      }),
    ]);

    // Notify poll owner — only on a new LIKE (not dislike)
    if (likePollDto.like_status === 'like') {
      const actor = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, username: true },
      });
      const actorName = actor?.username || 'Someone';
      await this.safeNotify({
        user_id: poll.user_id,
        actor_id: userId,
        notification_type: NotificationType.LIKE,
        title: 'Someone liked your poll',
        body: `${actorName} liked your poll "${poll.poll_title}"`,
        action_url: `/polls/${poll.poll_slug}`,
        related_id: poll.id,
        related_type: 'poll',
      });
    }

    return {
      message: `Poll ${likePollDto.like_status}d successfully`,
      like_count: likeCount,
      dislike_count: dislikeCount,
      like_status: likePollDto.like_status,
    };
  }

  // Get User's Polls
  async getUserPolls(
    userId: number,
    listQueryDto: ListPollsQueryDto,
  ): Promise<{
    data: PollResponseDto[];
    meta: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  }> {
    return this.getPolls({ ...listQueryDto, user_id: userId }, userId);
  }

  // Get Featured Polls
  async getFeaturedPolls(
    listQueryDto: ListPollsQueryDto,
    userId?: number,
  ): Promise<{
    data: PollResponseDto[];
    meta: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  }> {
    return this.getPolls({ ...listQueryDto, is_featured: true }, userId);
  }

  // Helper: Map entity to response DTO
  private mapToResponseDto(poll: any): PollResponseDto {
    // Convert poll_expires_at from UTC to local time string for display
    const pollExpiresAt = poll.poll_expires_at
      ? this.convertUtcToLocalString(new Date(poll.poll_expires_at))
      : null;

    return {
      id: poll.id,
      user_id: poll.user_id,
      community_ids: poll.community_ids,
      poll_slug: poll.poll_slug,
      poll_title: poll.poll_title,
      poll_description: poll.poll_description,
      poll_expires_at: pollExpiresAt,
      poll_status: poll.poll_status,
      poll_winner_option_id: poll.poll_winner_option_id,
      vote_count: poll.vote_count,
      like_count: poll.like_count || 0,
      dislike_count: poll.dislike_count || 0,
      view_count: poll.view_count,
      is_featured: poll.is_featured,
      created_by: poll.created_by,
      updated_by: poll.updated_by,
      created_at: poll.created_at,
      updated_at: poll.updated_at,
      ...(poll.user && {
        user: {
          id: poll.user.id,
          username: poll.user.username,
          email: poll.user.email,
        },
      }),
      ...(poll.options && {
        options: poll.options.map((option: any) => ({
          id: option.id,
          poll_id: option.poll_id,
          option_text: option.option_text,
          vote_count: option.vote_count,
          display_order: option.display_order,
          is_active: option.is_active,
          created_at: option.created_at,
          updated_at: option.updated_at,
          ...(option.percentage !== undefined && {
            percentage: option.percentage,
          }),
          ...(option.is_voted !== undefined && {
            is_voted: option.is_voted,
          }),
        })),
      }),
      ...(poll.user_vote && {
        user_vote: poll.user_vote,
      }),
      ...(poll.user_has_voted !== undefined && {
        user_has_voted: poll.user_has_voted,
      }),
      // Include like/dislike status when userId was provided (user_like_status is defined)
      ...(poll.user_like_status !== undefined && {
        user_like_status: poll.user_like_status,
        like_status: poll.user_like_status, // Alias
        is_liked: poll.is_liked !== undefined ? poll.is_liked : false,
        is_like: poll.is_liked !== undefined ? poll.is_liked : false, // Alias
        is_disliked: poll.is_disliked !== undefined ? poll.is_disliked : false,
      }),
      ...(poll.is_expired !== undefined && {
        is_expired: poll.is_expired,
      }),
    };
  }
}
