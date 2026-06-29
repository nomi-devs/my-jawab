import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, LessThan } from 'typeorm';
import { createHash } from 'crypto';
import { UserPoll, PollStatus } from './entities/user-poll.entity';
import { PollOption } from './entities/poll-option.entity';
import { PollVote } from './entities/poll-vote.entity';
import { PollLike, LikeStatus } from './entities/poll-like.entity';
import { User } from '../auth/entities/user.entity';
import { CreatePollDto } from './dto/create-poll.dto';
import { UpdatePollDto } from './dto/update-poll.dto';
import { PollResponseDto, PollOptionResponseDto } from './dto/poll-response.dto';
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
    @InjectRepository(UserPoll)
    private pollRepository: Repository<UserPoll>,
    @InjectRepository(PollOption)
    private pollOptionRepository: Repository<PollOption>,
    @InjectRepository(PollVote)
    private pollVoteRepository: Repository<PollVote>,
    @InjectRepository(PollLike)
    private pollLikeRepository: Repository<PollLike>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private notificationService: NotificationService,
  ) { }

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
    const tomorrow = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0, 0, 0, 0
    ));
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
      const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds, 0));
      // Subtract the offset to convert from local to UTC
      // If offset is +3 (UTC+3), subtract 3 hours to get UTC
      const adjustedUtcDate = new Date(utcDate.getTime() - (serverOffsetHours * 60 * 60 * 1000));
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
    const localTimeMs = utcDate.getTime() + (serverOffsetHours * 60 * 60 * 1000);
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

    // Create poll with initial slug (will be updated with hash after save)
    const poll = this.pollRepository.create({
      user_id: userId,
      community_ids: communityIdsString,
      poll_slug: createPollDto.poll_slug, // Temporary slug, will be updated with hash
      poll_title: createPollDto.poll_title,
      poll_description: createPollDto.poll_description,
      poll_expires_at: expiresAt,
      poll_status: createPollDto.poll_status || PollStatus.DRAFT,
      vote_count: 0,
      view_count: 0,
      is_featured: createPollDto.is_featured === 'featured',
      created_by: userId,
    });

    // Save to get the ID
    const savedPoll = await this.pollRepository.save(poll);

    // Generate slug with ID hash and update
    savedPoll.poll_slug = this.generateSlugWithHash(createPollDto.poll_slug, savedPoll.id);
    const finalPoll = await this.pollRepository.save(savedPoll);

    // Create poll options
    const options = createPollDto.options.map((optionDto, index) => {
      return this.pollOptionRepository.create({
        poll_id: savedPoll.id,
        option_text: optionDto.option_text,
        display_order: optionDto.display_order ?? index,
        vote_count: 0,
        is_active: true,
        created_by: userId,
      });
    });

    await this.pollOptionRepository.save(options);

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
    const where: FindOptionsWhere<UserPoll> = {};

    if (listQueryDto.user_id) {
      where.user_id = listQueryDto.user_id;
    }

    if (listQueryDto.poll_status) {
      where.poll_status = listQueryDto.poll_status;
    } else {
      // By default, only show published polls
      where.poll_status = PollStatus.PUBLISHED;
    }

    if (listQueryDto.is_featured !== undefined) {
      where.is_featured = listQueryDto.is_featured;
    }

    // Build relations array
    const relations: string[] = [];
    if (listQueryDto.include_user) {
      relations.push('user');
    }
    // Always include options for logged users (userId provided)
    if (listQueryDto.include_options || userId) {
      relations.push('options');
    }

    // Build query
    const queryBuilder = this.pollRepository
      .createQueryBuilder('poll')
      .where(where);

    // Filter by community if provided
    if (listQueryDto.community_id) {
      queryBuilder.andWhere(
        `(poll.community_ids LIKE :communityId OR poll.community_ids LIKE :communityIdStart OR poll.community_ids LIKE :communityIdEnd OR poll.community_ids LIKE :communityIdMiddle)`,
        {
          communityId: `${listQueryDto.community_id}`,
          communityIdStart: `${listQueryDto.community_id},%`,
          communityIdEnd: `%,${listQueryDto.community_id}`,
          communityIdMiddle: `%,${listQueryDto.community_id},%`,
        },
      );
    }

    // Add search if provided
    if (listQueryDto.search) {
      queryBuilder.andWhere(
        '(poll.poll_title LIKE :search OR poll.poll_description LIKE :search)',
        {
          search: `%${listQueryDto.search}%`,
        },
      );
    }

    // Add relations
    if (relations.length > 0) {
      relations.forEach((rel) => {
        queryBuilder.leftJoinAndSelect(`poll.${rel}`, rel);
      });
    }

    // Add sorting with special sort options
    const sortBy = listQueryDto.sort_by || 'created_at';
    const sortOrder = listQueryDto.sort_order || 'DESC';

    // Handle special sort options: top, hot, new, rising
    if (sortBy === 'top') {
      // Sort by vote_count (most votes first) - Top polls
      queryBuilder.orderBy('poll.vote_count', 'DESC');
      queryBuilder.addOrderBy('poll.created_at', 'DESC'); // Secondary sort by date
    } else if (sortBy === 'hot') {
      // Sort by recent activity: polls created in last 7 days, then by vote_count
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      queryBuilder.andWhere('poll.created_at >= :sevenDaysAgo', { sevenDaysAgo });
      queryBuilder.orderBy('poll.vote_count', 'DESC');
      queryBuilder.addOrderBy('poll.created_at', 'DESC');
    } else if (sortBy === 'new') {
      // Sort by created_at (newest first)
      queryBuilder.orderBy('poll.created_at', 'DESC');
    } else if (sortBy === 'rising') {
      // Sort by vote_count per day (rising polls with good engagement)
      // For now, sort by vote_count with recent creation date preference
      queryBuilder.orderBy('poll.vote_count', 'DESC');
      queryBuilder.addOrderBy('poll.created_at', 'DESC');
    } else {
      // Default: sort by the specified field (vote_count, view_count, created_at, etc.)
      queryBuilder.orderBy(`poll.${sortBy}`, sortOrder);
    }

    // Add pagination
    queryBuilder.skip(skip).take(limit);

    const [polls, total] = await queryBuilder.getManyAndCount();

    // Get user vote and like status for each poll if userId provided
    const pollsWithUserData = await Promise.all(
      polls.map(async (poll) => {
        const response: any = { ...poll };

        // Calculate like and dislike counts
        const likeCount = await this.pollLikeRepository.count({
          where: {
            poll_id: poll.id,
            like_status: LikeStatus.LIKE,
          },
        });
        const dislikeCount = await this.pollLikeRepository.count({
          where: {
            poll_id: poll.id,
            like_status: LikeStatus.DISLIKE,
          },
        });
        response.like_count = likeCount;
        response.dislike_count = dislikeCount;

        if (userId) {
          // Get user vote (always include for logged users)
          const userVote = await this.pollVoteRepository.findOne({
            where: {
              poll_id: poll.id,
              user_id: userId,
            },
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
          const userLike = await this.pollLikeRepository.findOne({
            where: {
              poll_id: poll.id,
              user_id: userId,
            },
          });
          response.user_like_status = userLike?.like_status || null;
          response.is_liked = userLike?.like_status === LikeStatus.LIKE;
          response.is_disliked = userLike?.like_status === LikeStatus.DISLIKE;
        }

        // Check if poll is expired (only if expiration date is set)
        response.is_expired = poll.poll_expires_at ? new Date(poll.poll_expires_at) < new Date() : false;

        // Calculate option percentages and mark user's voted option if options included
        if (poll.options && poll.options.length > 0) {
          const totalVotes = poll.vote_count || 0;
          const userVotedOptionId = response.user_vote?.vote_option_id;

          response.options = poll.options.map((option: any) => ({
            ...option,
            percentage:
              totalVotes > 0
                ? Math.round((option.vote_count / totalVotes) * 100 * 100) /
                100
                : 0,
            is_voted: userId && userVotedOptionId ? option.id === userVotedOptionId : false,
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
  async getPollById(pollId: number, userId?: number, skipViewCount?: boolean): Promise<PollResponseDto> {
    const poll = await this.pollRepository.findOne({
      where: { id: pollId },
      relations: ['user', 'options'],
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    // Increment view count only if not skipped (skip for admin views)
    if (!skipViewCount) {
      poll.view_count += 1;
      await this.pollRepository.save(poll);
    }

    const response: any = { ...poll };

    // Get user vote if userId provided
    if (userId) {
      const userVote = await this.pollVoteRepository.findOne({
        where: {
          poll_id: pollId,
          user_id: userId,
        },
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
      const userLike = await this.pollLikeRepository.findOne({
        where: {
          poll_id: pollId,
          user_id: userId,
        },
      });
      response.user_like_status = userLike?.like_status || null;
      response.is_liked = userLike?.like_status === LikeStatus.LIKE;
      response.is_disliked = userLike?.like_status === LikeStatus.DISLIKE;
    }

    // Calculate like and dislike counts
    const likeCount = await this.pollLikeRepository.count({
      where: {
        poll_id: pollId,
        like_status: LikeStatus.LIKE,
      },
    });
    const dislikeCount = await this.pollLikeRepository.count({
      where: {
        poll_id: pollId,
        like_status: LikeStatus.DISLIKE,
      },
    });
    response.like_count = likeCount;
    response.dislike_count = dislikeCount;

    // Check if poll is expired (only if expiration date is set)
    response.is_expired = poll.poll_expires_at ? new Date(poll.poll_expires_at) < new Date() : false;

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
        is_voted: userId && userVotedOptionId ? option.id === userVotedOptionId : false,
      }));
    }

    return this.mapToResponseDto(response);
  }

  // Get Poll by Slug
  async getPollBySlug(
    slug: string,
    userId?: number,
  ): Promise<PollResponseDto> {
    const poll = await this.pollRepository.findOne({
      where: { poll_slug: slug },
      relations: ['user', 'options'],
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
    const poll = await this.pollRepository.findOne({
      where: { id: pollId },
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    // Check if user owns the poll
    if (poll.user_id !== userId) {
      throw new ForbiddenException('You can only update your own polls');
    }

    // If slug is being updated, generate new slug with ID hash
    if (updatePollDto.poll_slug && updatePollDto.poll_slug !== poll.poll_slug) {
      // Remove any existing hash and generate new one with current ID
      updatePollDto.poll_slug = this.generateSlugWithHash(updatePollDto.poll_slug, poll.id);
    }

    // Validate expiration date if being updated - must be at least tomorrow
    // Allow null/empty to clear expiration date
    if ('poll_expires_at' in updatePollDto) {
      if (updatePollDto.poll_expires_at && typeof updatePollDto.poll_expires_at === 'string' && updatePollDto.poll_expires_at.trim() !== '') {
        const expiresAt = this.parseDateString(updatePollDto.poll_expires_at);
        if (!this.isAtLeastTomorrow(expiresAt)) {
          throw new BadRequestException(
            'Poll expiration date must be at least tomorrow. Polls cannot expire on the same day they are created.',
          );
        }
        (poll as any).poll_expires_at = expiresAt;
      } else {
        // Clear expiration date if null or empty string provided
        (poll as any).poll_expires_at = null;
      }
      delete (updatePollDto as any).poll_expires_at;
    }

    // Convert community_ids array to comma-separated string if provided
    if (updatePollDto.community_ids !== undefined) {
      const communityIdsString = updatePollDto.community_ids.length
        ? updatePollDto.community_ids.join(',')
        : null;
      (poll as any).community_ids = communityIdsString;
      delete (updatePollDto as any).community_ids;
    }

    // Convert is_featured string to boolean if provided
    if (updatePollDto.is_featured !== undefined) {
      poll.is_featured = updatePollDto.is_featured === 'featured';
      delete (updatePollDto as any).is_featured;
    }

    // Handle options update if provided
    let optionsToSave: PollOption[] = [];
    if (updatePollDto.options) {
      const existingOptions = await this.pollOptionRepository.find({
        where: { poll_id: pollId },
      });

      const newOptionsDto = updatePollDto.options;
      const keepOptionIds: number[] = [];

      // Process provided options
      for (const optionDto of newOptionsDto) {
        if (optionDto.id) {
          // Update existing option
          const existingOption = existingOptions.find(o => o.id == optionDto.id);
          if (existingOption) {
            existingOption.option_text = optionDto.option_text;
            existingOption.display_order = optionDto.display_order ?? existingOption.display_order;
            optionsToSave.push(existingOption);
            keepOptionIds.push(existingOption.id);
          }
        } else {
          // Create new option
          const newOption = this.pollOptionRepository.create({
            poll_id: pollId,
            option_text: optionDto.option_text,
            display_order: optionDto.display_order ?? 0,
            vote_count: 0,
            is_active: true,
            created_by: userId,
          });
          optionsToSave.push(newOption);
        }
      }

      // Delete removed options (those present in DB but not in payload)
      // Only delete if we are actually updating options, otherwise we'd wipe them out
      const optionsToDelete = existingOptions.filter(o => !keepOptionIds.includes(o.id));
      if (optionsToDelete.length > 0) {
        await this.pollOptionRepository.remove(optionsToDelete);
      }

      // Save updated/new options
      if (optionsToSave.length > 0) {
        await this.pollOptionRepository.save(optionsToSave);
      }

      // Remove options from DTO so Object.assign doesn't overwrite with plain objects
      delete (updatePollDto as any).options;
    }

    // Update poll
    Object.assign(poll, updatePollDto);
    poll.updated_by = userId;

    const updatedPoll = await this.pollRepository.save(poll);

    // Re-fetch with options and user relations to ensure response includes updated data
    const pollWithRelations = await this.pollRepository.findOne({
      where: { id: pollId },
      relations: ['user', 'options'],
    });

    return this.mapToResponseDto(pollWithRelations);
  }

  // Delete Poll
  async deletePoll(pollId: number, userId: number): Promise<{ message: string }> {
    const poll = await this.pollRepository.findOne({
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
    poll.poll_status = PollStatus.ENDED;
    poll.updated_by = userId;
    await this.pollRepository.save(poll);

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
    const poll = await this.pollRepository.findOne({
      where: { id: pollId },
      relations: ['options'],
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    // Check if poll is published
    if (poll.poll_status !== PollStatus.PUBLISHED) {
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
    const existingVote = await this.pollVoteRepository.findOne({
      where: {
        poll_id: pollId,
        user_id: userId,
      },
    });

    if (existingVote) {
      // Update existing vote
      const oldOptionId = existingVote.vote_option_id;

      // Decrement old option vote count
      await this.pollOptionRepository.decrement(
        { id: oldOptionId },
        'vote_count',
        1,
      );

      // Update vote
      existingVote.vote_option_id = votePollDto.vote_option_id;
      existingVote.updated_by = userId;
      await this.pollVoteRepository.save(existingVote);

      // Increment new option vote count
      await this.pollOptionRepository.increment(
        { id: votePollDto.vote_option_id },
        'vote_count',
        1,
      );
    } else {
      // Create new vote
      const vote = this.pollVoteRepository.create({
        poll_id: pollId,
        user_id: userId,
        vote_option_id: votePollDto.vote_option_id,
        created_by: userId,
      });

      await this.pollVoteRepository.save(vote);

      // Increment option and poll vote counts
      await this.pollOptionRepository.increment(
        { id: votePollDto.vote_option_id },
        'vote_count',
        1,
      );
      await this.pollRepository.increment({ id: pollId }, 'vote_count', 1);

      // Notify poll owner about the new vote
      const actor = await this.userRepository.findOne({
        where: { id: userId },
        select: ['id', 'username'],
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
    const updatedOptions = await this.pollOptionRepository.find({
      where: { poll_id: pollId },
      select: ['id', 'vote_count'],
    });

    const optionVoteCounts: Record<number, number> = {};
    updatedOptions.forEach((opt) => {
      optionVoteCounts[opt.id] = opt.vote_count;
    });

    const updatedPoll = await this.pollRepository.findOne({
      where: { id: pollId },
      select: ['vote_count'],
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
    // Note: This is a simplified version - polls may not have like/dislike counts in the schema
    // Adjust based on actual requirements
    const poll = await this.pollRepository.findOne({
      where: { id: pollId },
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    // Check if user already liked/disliked
    const existingLike = await this.pollLikeRepository.findOne({
      where: {
        poll_id: pollId,
        user_id: userId,
      },
    });

    if (existingLike) {
      // If same status, remove like/dislike
      if (existingLike.like_status === likePollDto.like_status) {
        await this.pollLikeRepository.remove(existingLike);

        // Get updated counts
        const likeCount = await this.pollLikeRepository.count({
          where: { poll_id: pollId, like_status: LikeStatus.LIKE },
        });
        const dislikeCount = await this.pollLikeRepository.count({
          where: { poll_id: pollId, like_status: LikeStatus.DISLIKE },
        });

        return {
          message: 'Poll like/dislike removed successfully',
          like_count: likeCount,
          dislike_count: dislikeCount,
          like_status: null,
        };
      } else {
        // Update existing like/dislike
        const oldStatus = existingLike.like_status;
        existingLike.like_status = likePollDto.like_status;
        existingLike.updated_by = userId;
        await this.pollLikeRepository.save(existingLike);

        // Get updated counts
        const likeCount = await this.pollLikeRepository.count({
          where: { poll_id: pollId, like_status: LikeStatus.LIKE },
        });
        const dislikeCount = await this.pollLikeRepository.count({
          where: { poll_id: pollId, like_status: LikeStatus.DISLIKE },
        });

        return {
          message: `Poll ${likePollDto.like_status}d successfully`,
          like_count: likeCount,
          dislike_count: dislikeCount,
          like_status: likePollDto.like_status,
        };
      }
    }

    // Create new like/dislike
    const pollLike = this.pollLikeRepository.create({
      poll_id: pollId,
      user_id: userId,
      like_status: likePollDto.like_status,
      created_by: userId,
    });

    await this.pollLikeRepository.save(pollLike);

    // Get updated counts
    const likeCount = await this.pollLikeRepository.count({
      where: { poll_id: pollId, like_status: LikeStatus.LIKE },
    });
    const dislikeCount = await this.pollLikeRepository.count({
      where: { poll_id: pollId, like_status: LikeStatus.DISLIKE },
    });

    // Notify poll owner — only on a new LIKE (not dislike)
    if (likePollDto.like_status === LikeStatus.LIKE) {
      const actor = await this.userRepository.findOne({
        where: { id: userId },
        select: ['id', 'username'],
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

