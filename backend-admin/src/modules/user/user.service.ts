import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { UserProfile, ProfileGender } from './entities/user-profile.entity';
import { UserFollower } from './entities/user-follower.entity';
import { UserTopic } from './entities/user-topic.entity';
import { Topic } from '../general/entities/topic.entity';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { FollowUserDto } from './dto/follow-user.dto';
import { SubscribeTopicDto } from './dto/subscribe-topic.dto';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { MediaClientService } from '../shared/services/media-client.service';
import { User, UserRole } from '../auth/entities/user.entity';
import { UserPost } from '../post/entities/user-post.entity';
import { UserPoll } from '../poll/entities/user-poll.entity';
import { PostComment } from '../comment/entities/post-comment.entity';
import { PollComment } from '../poll/entities/poll-comment.entity';
import { CommunityUser } from '../community/entities/community-user.entity';
import { PostService } from '../post/post.service';
import { PollService } from '../poll/poll.service';
import { CommentService } from '../comment/comment.service';
import { ListPostsQueryDto } from '../post/dto/list-posts-query.dto';
import { ListPollsQueryDto } from '../poll/dto/list-polls-query.dto';
import { ListCommentsQueryDto } from '../comment/dto/list-comments-query.dto';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/entities/notification.entity';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private readonly profileRepository: Repository<UserProfile>,
    @InjectRepository(UserFollower)
    private readonly followerRepository: Repository<UserFollower>,
    @InjectRepository(UserTopic)
    private readonly topicRepository: Repository<UserTopic>,
    @InjectRepository(Topic)
    private readonly topicEntityRepository: Repository<Topic>,
    @InjectRepository(CommunityUser)
    private readonly communityUserRepository: Repository<CommunityUser>,
    @InjectRepository(UserPost)
    private readonly postRepository: Repository<UserPost>,
    @InjectRepository(UserPoll)
    private readonly pollRepository: Repository<UserPoll>,
    @InjectRepository(PostComment)
    private readonly postCommentRepository: Repository<PostComment>,
    @InjectRepository(PollComment)
    private readonly pollCommentRepository: Repository<PollComment>,
    private readonly mediaClientService: MediaClientService,
    private readonly postService: PostService,
    private readonly pollService: PollService,
    private readonly commentService: CommentService,
    private readonly notificationService: NotificationService,
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

  // Profile Management
  async createProfile(
    userId: number,
    createProfileDto: CreateProfileDto,
    profilePictureFile?: Express.Multer.File,
    profileBackgroundFile?: Express.Multer.File,
  ): Promise<ProfileResponseDto> {
    // Check if profile already exists
    const existingProfile = await this.profileRepository.findOne({
      where: { user_id: userId },
      select: ['id'],
    });

    if (existingProfile) {
      throw new ConflictException('Profile already exists for this user');
    }

    let profilePicture = createProfileDto.profile_picture;
    let profileBackground = createProfileDto.profile_background;

    // Upload profile picture if provided
    if (profilePictureFile) {
      try {
        const mediaResponse = await this.mediaClientService.uploadFile(
          profilePictureFile,
          {
            folder: 'profile-pictures',
            userId,
            optimize: true,
            is_public: true,
          },
        );
        profilePicture = this.mediaClientService.buildFileUrl(
          mediaResponse.file_path,
        );
      } catch (error) {
        this.logger.error(
          `Failed to upload profile picture: ${error.message}`,
        );
        throw new BadRequestException('Failed to upload profile picture');
      }
    }

    // Upload profile background if provided
    if (profileBackgroundFile) {
      try {
        const mediaResponse = await this.mediaClientService.uploadFile(
          profileBackgroundFile,
          {
            folder: 'profile-backgrounds',
            userId,
            optimize: true,
            is_public: true,
          },
        );
        profileBackground = this.mediaClientService.buildFileUrl(
          mediaResponse.file_path,
        );
      } catch (error) {
        this.logger.error(
          `Failed to upload profile background: ${error.message}`,
        );
        throw new BadRequestException('Failed to upload profile background');
      }
    }

    const profile = this.profileRepository.create({
      user_id: userId,
      full_name: createProfileDto.full_name,
      profile_picture: profilePicture,
      profile_background: profileBackground,
      tagline: createProfileDto.tagline,
      profile_bio: createProfileDto.profile_bio,
      profile_gender: createProfileDto.profile_gender,
      profile_birthday: createProfileDto.profile_birthday
        ? new Date(createProfileDto.profile_birthday)
        : null,
      profile_website: createProfileDto.profile_website,
      profile_location: createProfileDto.profile_location,
      created_by: userId,
    });

    const savedProfile = await this.profileRepository.save(profile);
    return this.mapToProfileResponse(savedProfile);
  }

  async getProfile(userId: number): Promise<ProfileResponseDto> {
    const profile = await this.profileRepository.findOne({
      where: { user_id: userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return this.mapToProfileResponse(profile);
  }

  async getProfileByUserId(userId: number): Promise<ProfileResponseDto> {
    const profile = await this.profileRepository.findOne({
      where: { user_id: userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return this.mapToProfileResponse(profile);
  }

  async updateProfile(
    userId: number,
    updateProfileDto: UpdateProfileDto,
    profilePictureFile?: Express.Multer.File,
    profileBackgroundFile?: Express.Multer.File,
  ): Promise<ProfileResponseDto> {
    let profile = await this.profileRepository.findOne({
      where: { user_id: userId },
    });

    // Create profile if it doesn't exist
    if (!profile) {
      profile = this.profileRepository.create({
        user_id: userId,
        created_by: userId,
      });
    }

    // Upload profile picture if provided
    if (profilePictureFile) {
      try {
        const mediaResponse = await this.mediaClientService.uploadFile(
          profilePictureFile,
          {
            folder: 'profile-pictures',
            userId,
            optimize: true,
            is_public: true,
          },
        );
        updateProfileDto.profile_picture = this.mediaClientService.buildFileUrl(
          mediaResponse.file_path,
        );
      } catch (error) {
        this.logger.error(
          `Failed to upload profile picture: ${error.message}`,
        );
        throw new BadRequestException('Failed to upload profile picture');
      }
    }

    // Upload profile background if provided
    if (profileBackgroundFile) {
      try {
        const mediaResponse = await this.mediaClientService.uploadFile(
          profileBackgroundFile,
          {
            folder: 'profile-backgrounds',
            userId,
            optimize: true,
            is_public: true,
          },
        );
        updateProfileDto.profile_background = this.mediaClientService.buildFileUrl(
          mediaResponse.file_path,
        );
      } catch (error) {
        this.logger.error(
          `Failed to upload profile background: ${error.message}`,
        );
        throw new BadRequestException('Failed to upload profile background');
      }
    }

    // Update fields
    if (updateProfileDto.full_name !== undefined) {
      profile.full_name = updateProfileDto.full_name;
    }
    if (updateProfileDto.profile_picture !== undefined) {
      profile.profile_picture = updateProfileDto.profile_picture;
    }
    if (updateProfileDto.profile_background !== undefined) {
      profile.profile_background = updateProfileDto.profile_background;
    }
    if (updateProfileDto.tagline !== undefined) {
      profile.tagline = updateProfileDto.tagline;
    }
    if (updateProfileDto.profile_bio !== undefined) {
      profile.profile_bio = updateProfileDto.profile_bio;
    }
    if (updateProfileDto.profile_gender !== undefined) {
      profile.profile_gender = updateProfileDto.profile_gender;
    }
    if (updateProfileDto.profile_birthday !== undefined) {
      profile.profile_birthday = updateProfileDto.profile_birthday
        ? new Date(updateProfileDto.profile_birthday)
        : null;
    }
    if (updateProfileDto.profile_website !== undefined) {
      profile.profile_website = updateProfileDto.profile_website;
    }
    if (updateProfileDto.profile_location !== undefined) {
      profile.profile_location = updateProfileDto.profile_location;
    }

    profile.updated_by = userId;
    const updatedProfile = await this.profileRepository.save(profile);
    return this.mapToProfileResponse(updatedProfile);
  }

  // Follow/Unfollow Management
  async followUser(
    followerId: number,
    followUserDto: FollowUserDto,
  ): Promise<{ message: string }> {
    const { user_id } = followUserDto;

    // Cannot follow yourself
    if (followerId === user_id) {
      throw new BadRequestException('Cannot follow yourself');
    }

    // Check if already following
    const existingFollow = await this.followerRepository.findOne({
      where: {
        user_id: user_id,
        follower_id: followerId,
      },
    });

    if (existingFollow) {
      if (existingFollow.is_active) {
        throw new ConflictException('Already following this user');
      } else {
        // Reactivate follow
        existingFollow.is_active = true;
        existingFollow.updated_by = followerId;
        await this.followerRepository.save(existingFollow);
        await this.notifyFollow(user_id, followerId);
        return { message: 'Successfully followed user' };
      }
    }

    // Create new follow relationship
    const follow = this.followerRepository.create({
      user_id: user_id,
      follower_id: followerId,
      is_active: true,
      created_by: followerId,
    });

    await this.followerRepository.save(follow);
    await this.notifyFollow(user_id, followerId);
    return { message: 'Successfully followed user' };
  }

  /**
   * Helper: notify the user that someone followed them.
   */
  private async notifyFollow(followedUserId: number, followerId: number): Promise<void> {
    const follower = await this.userRepository.findOne({
      where: { id: followerId },
      select: ['id', 'username'],
    });
    const followerName = follower?.username || 'Someone';
    await this.safeNotify({
      user_id: followedUserId,
      actor_id: followerId,
      notification_type: NotificationType.FOLLOW,
      title: 'New follower',
      body: `${followerName} started following you`,
      action_url: `/users/${followerId}`,
      related_id: followerId,
      related_type: 'user',
    });
  }

  async unfollowUser(
    followerId: number,
    userId: number,
  ): Promise<{ message: string }> {
    const follow = await this.followerRepository.findOne({
      where: {
        user_id: userId,
        follower_id: followerId,
      },
    });

    if (!follow || !follow.is_active) {
      throw new NotFoundException('Not following this user');
    }

    follow.is_active = false;
    follow.updated_by = followerId;
    await this.followerRepository.save(follow);

    return { message: 'Successfully unfollowed user' };
  }

  async getFollowers(userId: number): Promise<UserFollower[]> {
    return await this.followerRepository.find({
      where: {
        user_id: userId,
        is_active: true,
      },
      relations: ['follower'],
      order: { created_at: 'DESC' },
    });
  }

  async getFollowing(userId: number): Promise<UserFollower[]> {
    return await this.followerRepository.find({
      where: {
        follower_id: userId,
        is_active: true,
      },
      relations: ['user'],
      order: { created_at: 'DESC' },
    });
  }

  async getFollowerCount(userId: number): Promise<number> {
    return await this.followerRepository.count({
      where: {
        user_id: userId,
        is_active: true,
      },
    });
  }

  async getFollowingCount(userId: number): Promise<number> {
    return await this.followerRepository.count({
      where: {
        follower_id: userId,
        is_active: true,
      },
    });
  }

  // Topic Subscription Management
  async subscribeTopic(
    userId: number,
    subscribeTopicDto: SubscribeTopicDto,
  ): Promise<{ 
    message: string; 
    subscribed: number[];
    already_subscribed: number[];
    not_found: number[];
    failed: number[];
  }> {
    // Normalize topic IDs: support both single topic_id and array of topic_ids
    let topicIds: number[] = [];
    
    if (subscribeTopicDto.topic_ids && subscribeTopicDto.topic_ids.length > 0) {
      topicIds = subscribeTopicDto.topic_ids;
    } else if (subscribeTopicDto.topic_id) {
      topicIds = [subscribeTopicDto.topic_id];
    } else {
      throw new BadRequestException('Either topic_id or topic_ids must be provided');
    }

    // Remove duplicates
    topicIds = [...new Set(topicIds)];

    if (topicIds.length === 0) {
      throw new BadRequestException('At least one topic ID must be provided');
    }

    // Validate that all topics exist and are active
    const topics = await this.topicEntityRepository.find({
      where: {
        id: In(topicIds),
        is_active: true,
      },
      select: ['id'],
    });

    const existingTopicIds = new Set(topics.map(t => t.id));
    const notFoundTopicIds = topicIds.filter(id => !existingTopicIds.has(id));

    if (notFoundTopicIds.length > 0 && topicIds.length === 1) {
      throw new NotFoundException(`Topic with ID ${notFoundTopicIds[0]} not found or inactive`);
    }

    // Get existing subscriptions for the user
    const existingSubscriptions = await this.topicRepository.find({
      where: {
        user_id: userId,
        topic_id: In(topicIds),
      },
    });

    const existingSubscriptionsMap = new Map(
      existingSubscriptions.map(sub => [sub.topic_id, sub])
    );

    const subscribed: number[] = [];
    const alreadySubscribed: number[] = [];
    const notFound: number[] = [...notFoundTopicIds];
    const failed: number[] = [];

    // Process each topic subscription
    for (const topicId of topicIds) {
      // Skip if topic doesn't exist
      if (notFound.includes(topicId)) {
        continue;
      }

      const existingSubscription = existingSubscriptionsMap.get(topicId);

      if (existingSubscription) {
        if (existingSubscription.is_active) {
          alreadySubscribed.push(topicId);
        } else {
          // Reactivate subscription
          try {
            existingSubscription.is_active = true;
            existingSubscription.updated_by = userId;
            await this.topicRepository.save(existingSubscription);
            subscribed.push(topicId);
          } catch (error) {
            this.logger.error(`Failed to reactivate subscription for topic ${topicId}: ${error.message}`);
            failed.push(topicId);
          }
        }
      } else {
        // Create new subscription
        try {
          const subscription = this.topicRepository.create({
            user_id: userId,
            topic_id: topicId,
            is_active: true,
            created_by: userId,
          });
          await this.topicRepository.save(subscription);
          subscribed.push(topicId);
        } catch (error) {
          this.logger.error(`Failed to create subscription for topic ${topicId}: ${error.message}`);
          failed.push(topicId);
        }
      }
    }

    // Build response message
    let message = '';
    if (subscribed.length > 0) {
      message += `Successfully subscribed to ${subscribed.length} topic(s). `;
    }
    if (alreadySubscribed.length > 0) {
      message += `${alreadySubscribed.length} topic(s) already subscribed. `;
    }
    if (notFound.length > 0) {
      message += `${notFound.length} topic(s) not found or inactive. `;
    }
    if (failed.length > 0) {
      message += `${failed.length} topic(s) failed to subscribe. `;
    }
    message = message.trim() || 'No topics processed.';

    // For backward compatibility: if single topic and error, throw exception
    if (topicIds.length === 1) {
      if (notFound.length > 0) {
        throw new NotFoundException(`Topic with ID ${topicIds[0]} not found or inactive`);
      }
      if (alreadySubscribed.length > 0) {
        throw new ConflictException('Already subscribed to this topic');
      }
      if (failed.length > 0) {
        throw new BadRequestException(`Failed to subscribe to topic: ${topicIds[0]}`);
      }
      return { 
        message: 'Successfully subscribed to topic',
        subscribed,
        already_subscribed: alreadySubscribed,
        not_found: notFound,
        failed,
      };
    }

    return {
      message,
      subscribed,
      already_subscribed: alreadySubscribed,
      not_found: notFound,
      failed,
    };
  }

  async unsubscribeTopic(
    userId: number,
    topicId: number,
  ): Promise<{ message: string }> {
    const subscription = await this.topicRepository.findOne({
      where: {
        user_id: userId,
        topic_id: topicId,
      },
    });

    if (!subscription || !subscription.is_active) {
      throw new NotFoundException('Not subscribed to this topic');
    }

    subscription.is_active = false;
    subscription.updated_by = userId;
    await this.topicRepository.save(subscription);

    return { message: 'Successfully unsubscribed from topic' };
  }

  async getUserTopics(userId: number): Promise<UserTopic[]> {
    return await this.topicRepository.find({
      where: {
        user_id: userId,
        is_active: true,
      },
      order: { created_at: 'DESC' },
    });
  }

  async getTopicSubscriberCount(topicId: number): Promise<number> {
    return await this.topicRepository.count({
      where: {
        topic_id: topicId,
        is_active: true,
      },
    });
  }

  // User Status Check
  async getUserStatus(userId: number): Promise<{
    user_id: number;
    is_active: 'yes' | 'no';
    is_verified: 'yes' | 'no';
    is_pro_user: 'yes' | 'no';
    user_profile: 'yes' | 'no';
    user_topics: 'yes' | 'no';
    user_communities: 'yes' | 'no';
  }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [profileCount, topicsCount, communitiesCount] = await Promise.all([
      this.profileRepository.count({ where: { user_id: userId } }),
      this.topicRepository.count({
        where: { user_id: userId, is_active: true },
      }),
      this.communityUserRepository.count({
        where: { user_id: userId, is_active: true },
      }),
    ]);

    const toYesNo = (value: boolean): 'yes' | 'no' =>
      value ? 'yes' : 'no';

    return {
      user_id: user.id,
      is_active: toYesNo(!!user.is_active),
      is_verified: toYesNo(!!user.is_verified),
      is_pro_user: toYesNo(user.role === UserRole.PRO_USER),
      user_profile: toYesNo(profileCount > 0),
      user_topics: toYesNo(topicsCount > 0),
      user_communities: toYesNo(communitiesCount > 0),
    };
  }

  // Delete My Account (Soft Delete)
  async deleteMyAccount(userId: number): Promise<{ message: string; hardDeleted: boolean }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.is_deleted) {
      return {
        message: 'Your account has already been deleted.',
        hardDeleted: false,
      };
    }

    // Count user's content — determines hard vs soft delete
    const hasContent = await this.userHasContent(userId);

    if (!hasContent) {
      // No content → hard delete: remove the row entirely + profile
      // Related rows without FK cascade are cleaned up explicitly below.
      await this.profileRepository.delete({ user_id: userId });
      await this.followerRepository.delete([{ user_id: userId }, { follower_id: userId }]);
      await this.topicRepository.delete({ user_id: userId });
      await this.communityUserRepository.delete({ user_id: userId });
      await this.userRepository.delete(userId);

      this.logger.log(`User hard-deleted (no content): User ID ${userId}`);

      return {
        message: 'Your account has been permanently deleted.',
        hardDeleted: true,
      };
    }

    // Has content → soft delete
    user.is_deleted = true;
    user.is_active = false;
    user.deleted_at = new Date();
    user.access_token = null;
    user.refresh_token = null;
    user.updated_by = userId;
    await this.userRepository.save(user);

    this.logger.log(`User soft-deleted (has content): User ID ${userId}`);

    return {
      message: 'Your account has been deleted. Your content remains on the platform. Contact support if you need to reactivate.',
      hardDeleted: false,
    };
  }

  /**
   * Returns true if the user has ANY user-generated content that we should retain.
   * Short-circuits at the first hit for performance.
   */
  private async userHasContent(userId: number): Promise<boolean> {
    const [posts, polls, postComments, pollComments] = await Promise.all([
      this.postRepository.count({ where: { user_id: userId } }),
      this.pollRepository.count({ where: { user_id: userId } }),
      this.postCommentRepository.count({ where: { user_id: userId } }),
      this.pollCommentRepository.count({ where: { user_id: userId } }),
    ]);
    return posts > 0 || polls > 0 || postComments > 0 || pollComments > 0;
  }

  // Get My Posts
  async getMyPosts(
    userId: number,
    listQueryDto: ListPostsQueryDto,
  ): Promise<{
    data: any[];
    meta: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  }> {
    return this.postService.getUserPosts(userId, listQueryDto);
  }

  // Get My Polls
  async getMyPolls(
    userId: number,
    listQueryDto: ListPollsQueryDto,
  ): Promise<{
    data: any[];
    meta: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  }> {
    return this.pollService.getUserPolls(userId, listQueryDto);
  }

  // Get My Replies (Comments)
  async getMyReplies(
    userId: number,
    listQueryDto: ListCommentsQueryDto,
  ): Promise<{
    data: any[];
    meta: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  }> {
    // Get all comments (post and poll) created by the user
    // userId is both the comment author and the logged user viewing their own comments
    return this.commentService.getUserComments(userId, listQueryDto, userId);
  }

  // Helper method to map entity to response DTO
  private mapToProfileResponse(profile: UserProfile): ProfileResponseDto {
    return {
      id: profile.id,
      user_id: profile.user_id,
      full_name: profile.full_name,
      profile_picture: profile.profile_picture,
      profile_background: profile.profile_background,
      tagline: profile.tagline,
      profile_bio: profile.profile_bio,
      profile_gender: profile.profile_gender,
      profile_birthday: profile.profile_birthday,
      profile_website: profile.profile_website,
      profile_location: profile.profile_location,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    };
  }
}

