import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  Inject,
  Logger,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan, Between, In, IsNull, Not, Like, DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import * as bcrypt from 'bcrypt';
import { User, UserRole, AuthType } from '../auth/entities/user.entity';
import { UserPasswordReset } from '../auth/entities/user-password-reset.entity';
import { UserProfile } from '../user/entities/user-profile.entity';
import { UserFollower } from '../user/entities/user-follower.entity';
import { UserTopic } from '../user/entities/user-topic.entity';
import { UserDevice, DeviceType } from '../auth/entities/user-device.entity';
// Import services from other modules
import { PostService } from '../post/post.service';
import { CommentService } from '../comment/comment.service';
import { CommunityService } from '../community/community.service';
import { PollService } from '../poll/poll.service';
import { GeneralService } from '../general/general.service';
import { TopicSelectListDto } from '../general/dto/topic-select-list.dto';
import { SubscriptionService } from '../subscription/subscription.service';
import { NotificationService } from '../notification/notification.service';
import { MediaClientService } from '../shared/services/media-client.service';
import { EmailTemplatesService } from '../email/services/email-templates.service';
// Import entities for direct repository access
import { UserPost, PostStatus } from '../post/entities/user-post.entity';
import { PostLike } from '../post/entities/post-like.entity';
import { PostComment } from '../comment/entities/post-comment.entity';
import { CommentLike } from '../comment/entities/comment-like.entity';
import { Community } from '../community/entities/community.entity';
import { CommunityTopic } from '../community/entities/community-topic.entity';
import { CommunityUser, CommunityUserRole } from '../community/entities/community-user.entity';
import { UserPoll, PollStatus } from '../poll/entities/user-poll.entity';
import { PollOption } from '../poll/entities/poll-option.entity';
import { PollVote } from '../poll/entities/poll-vote.entity';
import { PollLike } from '../poll/entities/poll-like.entity';
import { PollComment } from '../poll/entities/poll-comment.entity';
import { Topic } from '../general/entities/topic.entity';
import { DashboardStatsDto, TrendingTopicDto, TrendsDto } from './dto/dashboard-stats.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { ListQueryDto } from './dto/list-query.dto';
import { SearchQueryDto } from './dto/search-query.dto';
import { ListUsersQueryDto, ActiveStatus, VerifiedStatus } from './dto/list-users-query.dto';
import { ListPostsQueryDto } from './dto/list-posts-query.dto';
import { ListCommentsQueryDto, ApprovedStatus, RepliesStatus } from './dto/list-comments-query.dto';
import { ListTopicsQueryDto, ChildrenStatus } from './dto/list-topics-query.dto';
import { ListCommunitiesQueryDto } from './dto/list-communities-query.dto';
import { ListPollsQueryDto } from './dto/list-polls-query.dto';
import { BulkUpdateDto } from './dto/bulk-update.dto';
import { DashboardStatsQueryDto } from './dto/dashboard-stats-query.dto';
import { UserGrowthQueryDto } from './dto/user-growth-query.dto';
import { UpdatePostStatusDto } from './dto/update-post-status.dto';
import { UpdateTopicStatusDto } from './dto/update-topic-status.dto';
import { UpdateCommunityStatusDto } from './dto/update-community-status.dto';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminForgotPasswordDto } from './dto/admin-forgot-password.dto';
import { AdminResetPasswordDto } from './dto/admin-reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuthResponseDto } from '../auth/dto/auth-response.dto';
// Import DTOs from other modules
import { CreatePostDto } from '../post/dto/create-post.dto';
import { UpdatePostDto } from '../post/dto/update-post.dto';
import { CreateTopicDto } from '../general/dto/create-topic.dto';
import { UpdateTopicDto } from '../general/dto/update-topic.dto';
import { CreateCommunityDto } from '../community/dto/create-community.dto';
import { UpdateCommunityDto } from '../community/dto/update-community.dto';
import { CreatePollDto } from '../poll/dto/create-poll.dto';
import { UpdatePollDto } from '../poll/dto/update-poll.dto';
import { UpdateCommentDto } from '../comment/dto/update-comment.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AddTopicToCommunityDto } from '../community/dto/add-topic-to-community.dto';
import { UpdateMemberRoleDto } from '../community/dto/update-member-role.dto';
import { CreateSubscriptionDto } from '../subscription/dto/create-subscription.dto';
import { UpdateSubscriptionDto } from '../subscription/dto/update-subscription.dto';
import { ListSubscriptionsQueryDto } from '../subscription/dto/list-subscriptions-query.dto';
import { ListUserSubscriptionsQueryDto } from '../subscription/dto/list-user-subscriptions-query.dto';
import { ListPaymentsQueryDto } from '../subscription/dto/list-payments-query.dto';
import { CreatePaymentDto } from '../subscription/dto/create-payment.dto';
import { SubscriptionStatus } from '../subscription/entities/user-subscription.entity';
import { PaymentStatus, Payment } from '../subscription/entities/payment.entity';
import { Subscription } from '../subscription/entities/subscription.entity';
import { Notification, NotificationType } from '../notification/entities/notification.entity';
import { ListSubscriptionPaymentNotificationsDto, ReadStatus } from './dto/list-subscription-payment-notifications.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserPasswordReset)
    private passwordResetRepository: Repository<UserPasswordReset>,
    @InjectRepository(UserProfile)
    private profileRepository: Repository<UserProfile>,
    @InjectRepository(UserFollower)
    private followerRepository: Repository<UserFollower>,
    @InjectRepository(UserTopic)
    private topicRepository: Repository<UserTopic>,
    @InjectRepository(UserDevice)
    private deviceRepository: Repository<UserDevice>,
    @InjectRepository(UserPost)
    private postRepository: Repository<UserPost>,
    @InjectRepository(PostLike)
    private postLikeRepository: Repository<PostLike>,
    @InjectRepository(PostComment)
    private commentRepository: Repository<PostComment>,
    @InjectRepository(CommentLike)
    private commentLikeRepository: Repository<CommentLike>,
    @InjectRepository(Community)
    private communityRepository: Repository<Community>,
    @InjectRepository(CommunityTopic)
    private communityTopicRepository: Repository<CommunityTopic>,
    @InjectRepository(CommunityUser)
    private communityUserRepository: Repository<CommunityUser>,
    @InjectRepository(UserPoll)
    private pollRepository: Repository<UserPoll>,
    @InjectRepository(PollOption)
    private pollOptionRepository: Repository<PollOption>,
    @InjectRepository(PollVote)
    private pollVoteRepository: Repository<PollVote>,
    @InjectRepository(PollLike)
    private pollLikeRepository: Repository<PollLike>,
    @InjectRepository(PollComment)
    private pollCommentRepository: Repository<PollComment>,
    @InjectRepository(Topic)
    private topicEntityRepository: Repository<Topic>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectDataSource()
    private dataSource: DataSource,
    private jwtService: JwtService,
    private configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    // Inject services from other modules
    private postService: PostService,
    private commentService: CommentService,
    private communityService: CommunityService,
    private pollService: PollService,
    private generalService: GeneralService,
    private subscriptionService: SubscriptionService,
    private notificationService: NotificationService,
    private mediaClientService: MediaClientService,
    private emailTemplatesService: EmailTemplatesService,
  ) { }

  // Helper methods for token generation
  private async generateTokens(user: User) {
    const payload = { sub: user.id, username: user.username, role: user.role };

    // Access token: 1 month (30 days)
    const accessTokenExpiresIn = '30d'; // 1 month
    const accessTokenExpiresInSeconds = 30 * 24 * 60 * 60; // 2,592,000 seconds

    // Refresh token: 3 months (90 days)
    const refreshTokenExpiresIn = '90d'; // 3 months

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: accessTokenExpiresIn,
    });
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: refreshTokenExpiresIn,
    });

    user.access_token = accessToken;
    user.refresh_token = refreshToken;
    await this.userRepository.save(user);

    // Invalidate cache when user data changes
    await this.invalidateUserCache(user.id);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: accessTokenExpiresInSeconds, // Return in seconds for API response
    };
  }

  private async invalidateUserCache(userId: number): Promise<void> {
    const cacheKey = `user:${userId}`;
    await this.cacheManager.del(cacheKey);
  }

  private async registerDevice(userId: number, deviceData: {
    device_id: string;
    device_type: DeviceType;
    device_token?: string;
  }): Promise<UserDevice> {
    let device = await this.deviceRepository.findOne({
      where: {
        user_id: userId,
        device_id: deviceData.device_id,
      },
      select: ['id', 'device_token', 'device_type', 'is_active'],
    });

    if (device) {
      device.device_token = deviceData.device_token || device.device_token;
      device.device_type = deviceData.device_type;
      device.is_active = true;
      device.last_active_at = new Date();
      return await this.deviceRepository.save(device);
    }

    device = this.deviceRepository.create({
      user_id: userId,
      device_id: deviceData.device_id,
      device_type: deviceData.device_type,
      device_token: deviceData.device_token,
      is_active: true,
      last_active_at: new Date(),
    });

    return await this.deviceRepository.save(device);
  }

  // Admin Login
  async login(adminLoginDto: AdminLoginDto): Promise<AuthResponseDto> {
    // Validate input
    if (!adminLoginDto.identifier || !adminLoginDto.identifier.trim()) {
      throw new BadRequestException('Identifier (email or username) is required');
    }

    if (!adminLoginDto.password || !adminLoginDto.password.trim()) {
      throw new BadRequestException('Password is required');
    }

    // Find user by identifier (email or username)
    const user = await this.userRepository.findOne({
      where: [
        { email: adminLoginDto.identifier.trim() },
        { username: adminLoginDto.identifier.trim() },
      ],
      select: [
        'id',
        'username',
        'email',
        'password_hash',
        'role',
        'auth_type',
        'is_active',
        'is_verified',
        'expires_in',
      ],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password exists
    if (!user.password_hash) {
      throw new UnauthorizedException('Password is not set for this account');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      adminLoginDto.password,
      user.password_hash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user has admin or sub_admin role
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUB_ADMIN) {
      throw new UnauthorizedException('Access denied. Admin or sub-admin role required.');
    }

    // Check if user is active
    if (!user.is_active) {
      throw new UnauthorizedException('Account is inactive. Please contact administrator.');
    }

    // Check if user is verified
    if (!user.is_verified) {
      throw new UnauthorizedException('Please verify your account first');
    }

    // Register/update device if provided
    if (adminLoginDto.device_id) {
      await this.registerDevice(user.id, {
        device_id: adminLoginDto.device_id,
        device_type: (adminLoginDto.device_type as DeviceType) || DeviceType.WEB,
        device_token: adminLoginDto.device_token,
      });
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        auth_type: user.auth_type,
        is_active: user.is_active,
        is_verified: user.is_verified,
      },
      ...tokens,
    };
  }

  // Admin Logout
  async logout(userId: number): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'access_token', 'refresh_token'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Clear tokens
    user.access_token = null;
    user.refresh_token = null;
    await this.userRepository.save(user);

    // Invalidate cache
    await this.invalidateUserCache(userId);

    return { message: 'Logged out successfully' };
  }

  // Admin Forgot Password
  async forgotPassword(forgotPasswordDto: AdminForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { email: forgotPasswordDto.email },
      select: ['id', 'email', 'role'],
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      return { message: 'If the email exists, a password reset code has been sent' };
    }

    // Check if user has admin or sub_admin role
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUB_ADMIN) {
      // Don't reveal role information for security
      return { message: 'If the email exists, a password reset code has been sent' };
    }

    const resetCode = this.generateResetCode();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

    await this.passwordResetRepository.save({
      user_id: user.id,
      email: forgotPasswordDto.email,
      reset_code: resetCode,
      expires_at: expiresAt,
      is_used: false,
    });

    // Send password reset email
    try {
      const appUrl = this.configService.get<string>('app.url', 'https://demo.jantrah.com/jawaab');
      const resetUrl = `${appUrl}/admin/reset-password?code=${resetCode}&email=${encodeURIComponent(user.email)}`;

      await this.emailTemplatesService.sendPasswordResetEmail({
        recipientEmail: user.email,
        recipientName: user.email,
        resetCode,
        resetUrl,
      });

      this.logger.log(`Password reset email sent to admin: ${user.email}`);
    } catch (error) {
      this.logger.error('Failed to send password reset email:', error);
      // Log code for development (remove in production)
      if (this.configService.get<string>('NODE_ENV') === 'development') {
        console.log(`Password reset code for admin ${user.email}: ${resetCode}`);
      }
    }

    return { message: 'If the email exists, a password reset code has been sent' };
  }

  // Admin Reset Password
  async resetPassword(resetPasswordDto: AdminResetPasswordDto): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { email: resetPasswordDto.email },
      select: ['id', 'email', 'password_hash', 'role'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user has admin or sub_admin role
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUB_ADMIN) {
      throw new UnauthorizedException('Access denied. Admin or sub-admin role required.');
    }

    const passwordReset = await this.passwordResetRepository.findOne({
      where: {
        user_id: user.id,
        reset_code: resetPasswordDto.reset_code,
        is_used: false,
        expires_at: MoreThan(new Date()),
      },
    });

    if (!passwordReset) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    // Mark reset code as used
    passwordReset.is_used = true;
    await this.passwordResetRepository.save(passwordReset);

    // Update password
    const passwordHash = await bcrypt.hash(resetPasswordDto.new_password, 10);
    user.password_hash = passwordHash;
    await this.userRepository.save(user);

    // Invalidate cache when password changes
    await this.invalidateUserCache(user.id);

    return { message: 'Password reset successfully' };
  }

  // Admin Change Password (requires old password)
  async changePassword(
    userId: number,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'password_hash', 'role'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user has admin or sub_admin role
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUB_ADMIN) {
      throw new UnauthorizedException('Access denied. Admin or sub-admin role required.');
    }

    // Verify old password
    if (!user.password_hash) {
      throw new BadRequestException('Password not set. Please use reset password instead.');
    }

    const isOldPasswordValid = await bcrypt.compare(
      changePasswordDto.old_password,
      user.password_hash,
    );

    if (!isOldPasswordValid) {
      throw new UnauthorizedException('Invalid old password');
    }

    // Check if new password is different from old password
    const isSamePassword = await bcrypt.compare(
      changePasswordDto.new_password,
      user.password_hash,
    );

    if (isSamePassword) {
      throw new BadRequestException('New password must be different from old password');
    }

    // Update password
    const passwordHash = await bcrypt.hash(changePasswordDto.new_password, 10);
    user.password_hash = passwordHash;

    // Clear tokens to force re-login after password change
    user.access_token = null;
    user.refresh_token = null;

    await this.userRepository.save(user);

    // Invalidate cache when password changes
    await this.invalidateUserCache(user.id);

    return { message: 'Password changed successfully. Please login again.' };
  }

  // Helper method to generate reset code
  private generateResetCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Helper method to normalize date to start of day (00:00:00.000)
  private normalizeStartDate(date: Date): Date {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }

  // Helper method to normalize date to end of day (23:59:59.999)
  private normalizeEndDate(date: Date): Date {
    const normalized = new Date(date);
    normalized.setHours(23, 59, 59, 999);
    return normalized;
  }

  // Dashboard Stats
  async getDashboardStats(queryDto?: DashboardStatsQueryDto): Promise<DashboardStatsDto> {
    try {
      const { time_range, start_date, end_date } = queryDto || {};
      const effectiveTimeRange = time_range || 'all';

      // Validate: Cannot use time_range and custom dates together
      if (time_range && (start_date || end_date)) {
        throw new BadRequestException('Cannot use time_range together with start_date/end_date. Use either time_range OR custom dates.');
      }

      // Validate custom date range
      if ((start_date && !end_date) || (!start_date && end_date)) {
        throw new BadRequestException('Both start_date and end_date are required together');
      }
      if (start_date && end_date) {
        const start = new Date(start_date);
        const end = new Date(end_date);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          throw new BadRequestException('Invalid date format');
        }
        if (end < start) {
          throw new BadRequestException('end_date must be after start_date');
        }
      }

      // Calculate date ranges
      let periodStart: Date;
      let periodEnd: Date;
      let previousPeriodStart: Date;
      let previousPeriodEnd: Date;
      let isAllTime = false;
      const now = new Date();

      if (start_date && end_date) {
        // Custom date range: normalize start to beginning of day, end to end of day
        periodStart = this.normalizeStartDate(new Date(start_date));
        periodEnd = this.normalizeEndDate(new Date(end_date));
        const periodDuration = periodEnd.getTime() - periodStart.getTime();
        previousPeriodEnd = new Date(periodStart.getTime() - 1);
        previousPeriodStart = new Date(previousPeriodEnd.getTime() - periodDuration);
        previousPeriodStart = this.normalizeStartDate(previousPeriodStart);
        previousPeriodEnd = this.normalizeEndDate(previousPeriodEnd);
      } else {
        switch (effectiveTimeRange) {
          case 'week':
            // Last 7 days (including today)
            periodStart = this.normalizeStartDate(new Date(now));
            periodStart.setDate(periodStart.getDate() - 6); // Include today, so go back 6 days
            periodEnd = this.normalizeEndDate(now);
            // Previous week (7 days before periodStart)
            previousPeriodStart = new Date(periodStart);
            previousPeriodStart.setDate(previousPeriodStart.getDate() - 7);
            previousPeriodStart = this.normalizeStartDate(previousPeriodStart);
            previousPeriodEnd = new Date(periodStart.getTime() - 1);
            previousPeriodEnd = this.normalizeEndDate(previousPeriodEnd);
            break;
          case 'month':
            // Last 30 days (including today)
            periodStart = this.normalizeStartDate(new Date(now));
            periodStart.setDate(periodStart.getDate() - 29); // Include today, so go back 29 days
            periodEnd = this.normalizeEndDate(now);
            // Previous 30 days
            previousPeriodStart = new Date(periodStart);
            previousPeriodStart.setDate(previousPeriodStart.getDate() - 30);
            previousPeriodStart = this.normalizeStartDate(previousPeriodStart);
            previousPeriodEnd = new Date(periodStart.getTime() - 1);
            previousPeriodEnd = this.normalizeEndDate(previousPeriodEnd);
            break;
          case 'year':
            // Last 365 days (including today)
            periodStart = this.normalizeStartDate(new Date(now));
            periodStart.setDate(periodStart.getDate() - 364); // Include today, so go back 364 days
            periodEnd = this.normalizeEndDate(now);
            // Previous 365 days
            previousPeriodStart = new Date(periodStart);
            previousPeriodStart.setDate(previousPeriodStart.getDate() - 365);
            previousPeriodStart = this.normalizeStartDate(previousPeriodStart);
            previousPeriodEnd = new Date(periodStart.getTime() - 1);
            previousPeriodEnd = this.normalizeEndDate(previousPeriodEnd);
            break;
          default: // 'all'
            isAllTime = true;
            periodStart = new Date(0); // Beginning of time
            periodEnd = this.normalizeEndDate(now);
            previousPeriodStart = new Date(0);
            previousPeriodEnd = new Date(0);
        }
      }

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      // Current period stats
      const currentStats = await this.getPeriodStats(periodStart, periodEnd, isAllTime);
      // Previous period stats for trends (only if not all time)
      const previousStats = isAllTime
        ? { total_users: 0, active_users: 0, verified_users: 0, pro_users: 0, total_posts: 0, published_posts: 0, draft_posts: 0, total_comments: 0, total_topics: 0, active_topics: 0, total_communities: 0, active_communities: 0, total_polls: 0, published_polls: 0, recent_users: 0, recent_posts: 0 }
        : await this.getPeriodStats(previousPeriodStart, previousPeriodEnd, false);

      // Calculate trends (percentage change)
      const trends = this.calculateTrends(currentStats, previousStats);

      // Active users by period
      const dailyActiveUsers = await this.getActiveUsersCount(oneDayAgo, new Date());
      const weeklyActiveUsers = await this.getActiveUsersCount(oneWeekAgo, new Date());
      const monthlyActiveUsers = await this.getActiveUsersCount(oneMonthAgo, new Date());

      // Engagement rate calculation
      const totalViewsResult = await this.postRepository
        .createQueryBuilder('post')
        .select('COALESCE(SUM(post.view_count), 0)', 'total')
        .where('post.created_at >= :start', { start: periodStart })
        .andWhere('post.created_at <= :end', { end: periodEnd })
        .getRawOne();
      const totalLikesResult = await this.postRepository
        .createQueryBuilder('post')
        .select('COALESCE(SUM(post.like_count), 0)', 'total')
        .where('post.created_at >= :start', { start: periodStart })
        .andWhere('post.created_at <= :end', { end: periodEnd })
        .getRawOne();
      const totalComments = await this.commentRepository.count({
        where: {
          created_at: Between(periodStart, periodEnd),
        },
      });
      const totalInteractions = (parseInt(totalLikesResult?.total || '0', 10) + totalComments);
      const totalViewsNum = parseInt(totalViewsResult?.total || '0', 10);
      const engagementRate = totalViewsNum > 0 ? (totalInteractions / totalViewsNum) * 100 : 0;

      // Top posts - get all posts first, then sort in memory to avoid SQL arithmetic issues
      const allPosts = await this.postRepository
        .createQueryBuilder('post')
        .leftJoinAndSelect('post.user', 'user')
        .where('post.created_at >= :start', { start: periodStart })
        .andWhere('post.created_at <= :end', { end: periodEnd })
        .getMany();

      const topPosts = allPosts
        .map(post => ({
          ...post,
          engagement_score: (post.like_count || 0) + (post.comment_count || 0),
        }))
        .sort((a, b) => b.engagement_score - a.engagement_score)
        .slice(0, 10);

      // Top users (by activity) - simplified query
      const topUsersRaw = await this.userRepository
        .createQueryBuilder('user')
        .select([
          'user.id as user_id',
          'user.username as user_username',
          'user.email as user_email',
          'COUNT(DISTINCT post.id) as post_count',
          'COUNT(DISTINCT comment.id) as comment_count',
        ])
        .leftJoin('user_posts', 'post', 'post.user_id = user.id AND post.created_at BETWEEN :start AND :end', { start: periodStart, end: periodEnd })
        .leftJoin('post_comments', 'comment', 'comment.user_id = user.id AND comment.created_at BETWEEN :start AND :end', { start: periodStart, end: periodEnd })
        .groupBy('user.id')
        .having('COUNT(DISTINCT post.id) > 0 OR COUNT(DISTINCT comment.id) > 0')
        .getRawMany();

      // Sort by activity score in memory
      const topUsers = topUsersRaw
        .map(u => ({
          ...u,
          activity_score: parseInt(u.post_count || '0', 10) + parseInt(u.comment_count || '0', 10),
        }))
        .sort((a, b) => b.activity_score - a.activity_score)
        .slice(0, 10);

      // Recent activity
      let recentActivity: any[] = [];
      try {
        recentActivity = await this.getRecentActivity(10);
      } catch (error) {
        console.error('Error fetching recent activity:', error);
      }

      // Trending Topics
      let trendingTopics: TrendingTopicDto[] = [];
      try {
        trendingTopics = await this.getTrendingTopics(10);
      } catch (error) {
        console.error('Error fetching trending topics:', error);
      }

      return {
        ...currentStats,
        daily_active_users: dailyActiveUsers,
        weekly_active_users: weeklyActiveUsers,
        monthly_active_users: monthlyActiveUsers,
        engagement_rate: engagementRate,
        trends,
        top_posts: topPosts.map((p) => ({
          id: p.id,
          post_title: p.post_title,
          like_count: p.like_count,
          comment_count: p.comment_count,
          user: { id: p.user?.id, username: p.user?.username },
        })),
        top_users: topUsers.map((u) => ({
          id: u.user_id,
          username: u.user_username,
          email: u.user_email,
          post_count: parseInt(u.post_count || '0', 10),
          comment_count: parseInt(u.comment_count || '0', 10),
        })),
        recent_activity: recentActivity,
        trending_topics: trendingTopics,
      };
    } catch (error) {
      console.error('Error in getDashboardStats:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to fetch dashboard stats: ${error.message || 'Unknown error'}`);
    }
  }

  private async getPeriodStats(start: Date, end: Date, isAllTime: boolean = false) {
    // For "all time", get current totals, not historical counts
    if (isAllTime) {
      return {
        total_users: await this.userRepository.count(),
        active_users: await this.userRepository.count({
          where: { is_active: true },
        }),
        verified_users: await this.userRepository.count({
          where: { is_verified: true },
        }),
        pro_users: await this.userRepository.count({
          where: { role: UserRole.PRO_USER },
        }),
        total_posts: await this.postRepository.count(),
        published_posts: await this.postRepository.count({
          where: { post_status: PostStatus.PUBLISHED },
        }),
        draft_posts: await this.postRepository.count({
          where: { post_status: PostStatus.DRAFT },
        }),
        total_comments: await this.commentRepository.count(),
        total_topics: await this.topicEntityRepository.count(),
        active_topics: await this.topicEntityRepository.count({
          where: { is_active: true },
        }),
        total_communities: await this.communityRepository.count(),
        active_communities: await this.communityRepository.count({
          where: { is_active: true },
        }),
        total_polls: await this.pollRepository.count(),
        published_polls: await this.pollRepository.count({
          where: { poll_status: PollStatus.PUBLISHED },
        }),
        recent_users: await this.userRepository.count({
          where: { created_at: MoreThan(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) },
        }),
        recent_posts: await this.postRepository.count({
          where: { created_at: MoreThan(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) },
        }),
      };
    }

    // For specific time ranges, count items created in that period
    return {
      total_users: await this.userRepository.count({
        where: { created_at: Between(start, end) },
      }),
      active_users: await this.userRepository.count({
        where: { is_active: true, created_at: Between(start, end) },
      }),
      verified_users: await this.userRepository.count({
        where: { is_verified: true, created_at: Between(start, end) },
      }),
      pro_users: await this.userRepository.count({
        where: { role: UserRole.PRO_USER, created_at: Between(start, end) },
      }),
      total_posts: await this.postRepository.count({
        where: { created_at: Between(start, end) },
      }),
      published_posts: await this.postRepository.count({
        where: { post_status: PostStatus.PUBLISHED, created_at: Between(start, end) },
      }),
      draft_posts: await this.postRepository.count({
        where: { post_status: PostStatus.DRAFT, created_at: Between(start, end) },
      }),
      total_comments: await this.commentRepository.count({
        where: { created_at: Between(start, end) },
      }),
      total_topics: await this.topicEntityRepository.count({
        where: { created_at: Between(start, end) },
      }),
      active_topics: await this.topicEntityRepository.count({
        where: { is_active: true, created_at: Between(start, end) },
      }),
      total_communities: await this.communityRepository.count({
        where: { created_at: Between(start, end) },
      }),
      active_communities: await this.communityRepository.count({
        where: { is_active: true, created_at: Between(start, end) },
      }),
      total_polls: await this.pollRepository.count({
        where: { created_at: Between(start, end) },
      }),
      published_polls: await this.pollRepository.count({
        where: { poll_status: PollStatus.PUBLISHED, created_at: Between(start, end) },
      }),
      recent_users: await this.userRepository.count({
        where: { created_at: MoreThan(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) },
      }),
      recent_posts: await this.postRepository.count({
        where: { created_at: MoreThan(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) },
      }),
    };
  }

  private calculateTrends(current: any, previous: any) {
    const calculateChange = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    return {
      total_users_change: calculateChange(current.total_users, previous.total_users),
      active_users_change: calculateChange(current.active_users, previous.active_users),
      verified_users_change: calculateChange(current.verified_users, previous.verified_users),
      pro_users_change: calculateChange(current.pro_users, previous.pro_users),
      total_posts_change: calculateChange(current.total_posts, previous.total_posts),
      published_posts_change: calculateChange(current.published_posts, previous.published_posts),
      draft_posts_change: calculateChange(current.draft_posts, previous.draft_posts),
      total_comments_change: calculateChange(current.total_comments, previous.total_comments),
      total_topics_change: calculateChange(current.total_topics, previous.total_topics),
      active_topics_change: calculateChange(current.active_topics, previous.active_topics),
      total_communities_change: calculateChange(current.total_communities, previous.total_communities),
      active_communities_change: calculateChange(current.active_communities, previous.active_communities),
      total_polls_change: calculateChange(current.total_polls, previous.total_polls),
      published_polls_change: calculateChange(current.published_polls, previous.published_polls),
    };
  }

  private async getActiveUsersCount(start: Date, end: Date): Promise<number> {
    // Users who have created posts, comments, or polls in the period
    const result = await this.userRepository
      .createQueryBuilder('user')
      .select('COUNT(DISTINCT user.id)', 'count')
      .leftJoin('user_posts', 'post', 'post.user_id = user.id AND post.created_at BETWEEN :start AND :end', { start, end })
      .leftJoin('post_comments', 'comment', 'comment.user_id = user.id AND comment.created_at BETWEEN :start AND :end', { start, end })
      .leftJoin('user_polls', 'poll', 'poll.user_id = user.id AND poll.created_at BETWEEN :start AND :end', { start, end })
      .where('post.id IS NOT NULL OR comment.id IS NOT NULL OR poll.id IS NOT NULL')
      .getRawOne();
    return parseInt(result?.count || '0');
  }

  private async getRecentActivity(limit: number = 10): Promise<any[]> {
    const activities: any[] = [];

    // Recent posts
    const recentPosts = await this.postRepository.find({
      take: limit,
      order: { created_at: 'DESC' },
      relations: ['user'],
      select: ['id', 'post_title', 'created_at', 'user'],
    });
    activities.push(
      ...recentPosts.map((p) => ({
        type: 'post',
        id: p.id,
        title: p.post_title,
        user: { id: p.user?.id, username: p.user?.username },
        created_at: p.created_at,
      })),
    );

    // Recent comments
    const recentComments = await this.commentRepository.find({
      take: limit,
      order: { created_at: 'DESC' },
      relations: ['user', 'post'],
      select: ['id', 'comment_content', 'created_at', 'user', 'post'],
    });
    activities.push(
      ...recentComments.map((c) => ({
        type: 'comment',
        id: c.id,
        content: c.comment_content.substring(0, 50),
        user: { id: c.user?.id, username: c.user?.username },
        post_id: c.post_id,
        created_at: c.created_at,
      })),
    );

    // Sort by created_at and return top limit
    return activities.sort((a, b) => b.created_at.getTime() - a.created_at.getTime()).slice(0, limit);
  }

  // Get Trending Topics based on usage in communities and posts
  private async getTrendingTopics(limit: number = 10): Promise<TrendingTopicDto[]> {
    try {
      // Query to get trending topics based on:
      // 1. Number of communities using the topic (from community_topics table)
      // 2. Number of posts using the topic (from user_posts.post_topic_id)
      const query = `
        SELECT 
          t.id as topic_id,
          t.topic_name,
          t.topic_slug,
          COALESCE(ct.community_count, 0) as community_count,
          COALESCE(pt.post_count, 0) as post_count,
          (COALESCE(ct.community_count, 0) + COALESCE(pt.post_count, 0)) as usage_count
        FROM topics t
        LEFT JOIN (
          SELECT 
            topic_id,
            COUNT(*) as community_count
          FROM community_topics
          WHERE is_active = 1
          GROUP BY topic_id
        ) ct ON t.id = ct.topic_id
        LEFT JOIN (
          SELECT 
            post_topic_id as topic_id,
            COUNT(*) as post_count
          FROM user_posts
          WHERE post_status = 'published'
          GROUP BY post_topic_id
        ) pt ON t.id = pt.topic_id
        WHERE t.is_active = 1
        ORDER BY usage_count DESC, community_count DESC, post_count DESC
        LIMIT ?
      `;

      const results = await this.dataSource.query(query, [limit]);

      return results.map((row: any) => ({
        topic_id: row.topic_id,
        topic_name: row.topic_name,
        topic_slug: row.topic_slug,
        usage_count: parseInt(row.usage_count) || 0,
        community_count: parseInt(row.community_count) || 0,
        post_count: parseInt(row.post_count) || 0,
      }));
    } catch (error) {
      // If tables don't exist yet, return empty array
      // This will work once topic/post/community modules are implemented
      console.warn('Trending topics query failed (tables may not exist yet):', error.message);
      return [];
    }
  }

  // User Management
  async createUser(
    createUserDto: CreateUserDto,
    adminId: number,
  ) {
    // Validate that at least email or phone_number is provided
    if (!createUserDto.email && !createUserDto.phone_number) {
      throw new BadRequestException('Either email or phone_number must be provided');
    }

    // Determine auth_type based on provided fields
    let authType = createUserDto.auth_type;
    if (!authType) {
      if (createUserDto.email && !createUserDto.phone_number) {
        authType = AuthType.EMAIL;
      } else if (createUserDto.phone_number && !createUserDto.email) {
        authType = AuthType.PHONE;
      } else {
        // If both are provided, default to email
        authType = AuthType.EMAIL;
      }
    }

    // For phone auth, username should be the phone number
    // For email auth, username is provided separately
    const username = authType === AuthType.PHONE && createUserDto.phone_number
      ? createUserDto.phone_number
      : createUserDto.username;

    // Check if user already exists
    const whereConditions: any[] = [{ username: username }];
    if (createUserDto.email) {
      whereConditions.push({ email: createUserDto.email });
    }

    const existingUser = await this.userRepository.findOne({
      where: whereConditions,
      select: ['id'],
    });

    if (existingUser) {
      throw new ConflictException('User with this email or username already exists');
    }

    // Hash password if provided
    let passwordHash: string | null = null;
    if (createUserDto.password && (authType === AuthType.EMAIL || authType === AuthType.PHONE)) {
      passwordHash = await bcrypt.hash(createUserDto.password, 10);
    }

    // Create user - ensure email is always a string (not null)
    // If email is not provided, use empty string (entity requires string, not nullable)
    // Determine default values for is_active and is_verified based on role
    // Use is_active from DTO if provided, otherwise use default logic
    const defaultIsActive = createUserDto.role === UserRole.ADMIN || createUserDto.role === UserRole.SUB_ADMIN
      ? true
      : (createUserDto.role === UserRole.PRO_USER ? true : false);
    const defaultIsVerified = createUserDto.role === UserRole.ADMIN || createUserDto.role === UserRole.SUB_ADMIN
      ? true
      : false;

    const user = this.userRepository.create({
      username: username,
      email: createUserDto.email || '',
      password_hash: passwordHash,
      auth_type: authType,
      role: createUserDto.role || UserRole.USER,
      is_active: createUserDto.is_active !== undefined ? createUserDto.is_active : defaultIsActive,
      is_verified: defaultIsVerified,
      created_by: adminId,
    } as Partial<User>);

    const savedUser: User = await this.userRepository.save(user);

    // Register device if provided
    if (createUserDto.device_id) {
      await this.registerDevice(savedUser.id, {
        device_id: createUserDto.device_id,
        device_type: (createUserDto.device_type as DeviceType) || DeviceType.WEB,
        device_token: createUserDto.device_token,
      });
    }

    // Invalidate cache
    await this.invalidateUserCache(savedUser.id);

    return {
      id: savedUser.id,
      username: savedUser.username,
      email: savedUser.email,
      role: savedUser.role,
      auth_type: savedUser.auth_type,
      is_active: savedUser.is_active,
      is_verified: savedUser.is_verified,
      created_at: savedUser.created_at,
    };
  }

  async getUsers(listQueryDto: ListUsersQueryDto, options: { onlyDeleted?: boolean } = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      sort_by = 'created_at',
      sort_order = 'DESC',
      role,
      is_active,
      is_verified,
      created_from,
      created_to,
      user_id,
    } = listQueryDto;

    // Explicit casting to ensure numbers
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Debug logging
    this.logger.debug(`getUsers: page=${pageNum}, limit=${limitNum}, skip=${skip}, sort=${sort_by}, order=${sort_order}, onlyDeleted=${!!options.onlyDeleted}`);

    const queryBuilder = this.getUsersQueryBuilder(listQueryDto, options);

    // Clone query builder for count (without joins to avoid counting issues)
    const countQueryBuilder = queryBuilder.clone();

    // Get total count before adding joins and pagination
    const total = await countQueryBuilder.getCount();

    const sortField = this.getUserSortField(sort_by || 'created_at');

    // Create a subquery to get paginated user IDs first
    const paginatedUserIdsQuery = queryBuilder
      .clone()
      .select('user.id', 'user_id')
      .addSelect(`user.${sortField}`) // Required for DISTINCT + ORDER BY
      .distinct(true) // Ensure unique user IDs
      .orderBy(`user.${sortField}`, sort_order)
      .offset(skip)
      .limit(limitNum);

    // Get the paginated user IDs
    const paginatedUserIds = await paginatedUserIdsQuery.getRawMany();
    const userIds = paginatedUserIds.map((row: any) => row.user_id);

    // If no users found, return empty result
    if (userIds.length === 0) {
      return {
        data: [],
        meta: {
          total,
          page: pageNum,
          limit: limitNum,
          total_pages: Math.ceil(total / limitNum),
        },
      };
    }

    // Now fetch the full user data with profiles for these specific IDs
    const usersQueryBuilder = this.userRepository.createQueryBuilder('user')
      .leftJoin('user_profile', 'profile', 'profile.user_id = user.id')
      .where('user.id IN (:...userIds)', { userIds })
      .orderBy(`user.${sortField}`, sort_order)
      .select([
        'user.id',
        'user.username',
        'user.email',
        'user.role',
        'user.auth_type',
        'user.is_active',
        'user.is_verified',
        'user.created_at',
        'user.updated_at',
        'profile.full_name',
        'profile.profile_picture',
      ]);

    // Get raw results to access joined profile data
    const usersRaw = await usersQueryBuilder.getRawMany();

    // Map users to include profile data in the response
    const usersWithProfile = usersRaw.map((row: any) => ({
      id: row.user_id,
      username: row.user_username,
      email: row.user_email,
      role: row.user_role,
      auth_type: row.user_auth_type,
      is_active: Boolean(row.user_is_active),
      is_verified: Boolean(row.user_is_verified),
      created_at: row.user_created_at,
      updated_at: row.user_updated_at,
      profile: row.profile_full_name || row.profile_profile_picture ? {
        full_name: row.profile_full_name || null,
        profile_picture: row.profile_profile_picture || null,
      } : null,
    }));

    return {
      data: usersWithProfile,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        total_pages: Math.ceil(total / limitNum),
      },
    };
  }

  async getUserById(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: [
        'id',
        'username',
        'email',
        'role',
        'auth_type',
        'is_active',
        'is_verified',
        'created_at',
        'updated_at',
      ],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get user profile with all fields if exists
    const profile = await this.profileRepository.findOne({
      where: { user_id: userId },
      select: [
        'id',
        'user_id',
        'full_name',
        'profile_picture',
        'profile_background',
        'tagline',
        'profile_bio',
        'profile_gender',
        'profile_birthday',
        'profile_website',
        'profile_location',
        'created_by',
        'updated_by',
        'created_at',
        'updated_at',
      ],
    });

    // Get follower counts
    const followerCount = await this.followerRepository.count({
      where: { user_id: userId, is_active: true },
    });

    const followingCount = await this.followerRepository.count({
      where: { follower_id: userId, is_active: true },
    });

    // Get additional statistics
    const postsCount = await this.postRepository.count({
      where: { user_id: userId },
    });

    const commentsCount = await this.commentRepository.count({
      where: { user_id: userId },
    });

    const communitiesCount = await this.communityUserRepository.count({
      where: { user_id: userId, is_active: true },
    });

    return {
      ...user,
      profile: profile || null,
      follower_count: followerCount,
      following_count: followingCount,
      posts_count: postsCount,
      comments_count: commentsCount,
      communities_count: communitiesCount,
    };
  }

  async updateUserStatus(
    userId: number,
    updateUserStatusDto: UpdateUserStatusDto,
    adminId: number,
  ) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prevent admin from deactivating themselves
    if (userId === adminId && updateUserStatusDto.is_active === false) {
      throw new BadRequestException('Cannot deactivate your own account');
    }

    // Prevent changing role of admin accounts (only super admin should do this)
    if (user.role === UserRole.ADMIN && updateUserStatusDto.role) {
      throw new BadRequestException('Cannot change role of admin accounts');
    }

    if (updateUserStatusDto.is_active !== undefined) {
      user.is_active = updateUserStatusDto.is_active;
    }
    if (updateUserStatusDto.is_verified !== undefined) {
      user.is_verified = updateUserStatusDto.is_verified;
    }
    if (updateUserStatusDto.role !== undefined) {
      user.role = updateUserStatusDto.role;
    }

    user.updated_by = adminId;
    await this.userRepository.save(user);

    return {
      message: 'User status updated successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
        is_verified: user.is_verified,
      },
    };
  }

  async updateUser(
    userId: number,
    updateUserDto: UpdateUserDto,
    adminId: number,
    files?: Express.Multer.File[],
  ) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prevent admin from deactivating themselves
    if (userId === adminId && updateUserDto.is_active === ActiveStatus.INACTIVE) {
      throw new BadRequestException('Cannot deactivate your own account');
    }

    // Prevent changing role of admin accounts
    if (user.role === UserRole.ADMIN && updateUserDto.role && updateUserDto.role !== UserRole.ADMIN) {
      throw new BadRequestException('Cannot change role of admin accounts');
    }

    // Check if username is being changed and if it's already taken
    if (updateUserDto.username && updateUserDto.username !== user.username) {
      const existingUser = await this.userRepository.findOne({
        where: { username: updateUserDto.username },
      });
      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException('Username already taken');
      }
      user.username = updateUserDto.username;
    }

    // Check if email is being changed and if it's already taken
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });
      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException('Email already taken');
      }
      user.email = updateUserDto.email;
    }

    // Update password if provided
    if (updateUserDto.password) {
      const passwordHash = await bcrypt.hash(updateUserDto.password, 10);
      user.password_hash = passwordHash;
      // Clear tokens to force re-login after password change
      user.access_token = null;
      user.refresh_token = null;
    }

    // Update auth_type if provided
    if (updateUserDto.auth_type !== undefined) {
      user.auth_type = updateUserDto.auth_type;
    }

    // Update role if provided (with validation)
    if (updateUserDto.role !== undefined) {
      // Additional validation: prevent downgrading admin role
      if (user.role === UserRole.ADMIN && updateUserDto.role !== UserRole.ADMIN) {
        throw new BadRequestException('Cannot change role of admin accounts');
      }
      user.role = updateUserDto.role;
    }

    // Update is_active if provided (convert from enum to boolean)
    if (updateUserDto.is_active !== undefined) {
      user.is_active = updateUserDto.is_active === ActiveStatus.ACTIVE;
    }

    // Update is_verified if provided (convert from enum to boolean)
    if (updateUserDto.is_verified !== undefined) {
      user.is_verified = updateUserDto.is_verified === VerifiedStatus.VERIFIED;
    }

    user.updated_by = adminId;
    await this.userRepository.save(user);

    // Update profile if profile fields are provided
    const profileFields = [
      'full_name',
      'profile_picture',
      'profile_background',
      'tagline',
      'profile_bio',
      'profile_gender',
      'profile_birthday',
      'profile_website',
      'profile_location',
    ];

    const hasProfileFields = profileFields.some(
      (field) => updateUserDto[field] !== undefined,
    ) || (files && files.length > 0);

    if (hasProfileFields) {
      let profile = await this.profileRepository.findOne({
        where: { user_id: userId },
      });

      if (!profile) {
        // Create profile if it doesn't exist
        profile = this.profileRepository.create({
          user_id: userId,
          created_by: adminId,
        });
      }

      // Handle file uploads
      if (files && files.length > 0) {
        // Determine which file is profile picture and which is background
        // Files are sent in order: profile_picture first, then profile_background
        // If only one file is sent, it's assumed to be profile_picture
        const profilePictureFile = files.length >= 1 ? files[0] : null;
        const profileBackgroundFile = files.length >= 2 ? files[1] : null;

        // Upload profile picture if provided
        if (profilePictureFile) {
          try {
            // Validate file before upload
            if (!profilePictureFile.originalname || !profilePictureFile.mimetype) {
              throw new BadRequestException('Invalid file: missing originalname or mimetype');
            }

            const mediaResponse = await this.mediaClientService.uploadFile(
              profilePictureFile,
              {
                folder: 'profile-pictures',
                userId,
                optimize: true,
                is_public: true,
              },
            );
            this.logger.log(
              `File uploaded to media service - ID: ${mediaResponse.id}, file_path: ${mediaResponse.file_path}, filename: ${mediaResponse.filename}`,
            );
            // Get the proper file URL from media service using media ID
            // This ensures we get the correct serving URL format
            try {
              profile.profile_picture = await this.mediaClientService.getFileUrl(
                mediaResponse.id,
                false, // not optimized
              );
              this.logger.log(
                `Profile picture URL retrieved successfully: ${profile.profile_picture} for media ID: ${mediaResponse.id}`,
              );
            } catch (urlError) {
              // Fallback: use buildFileUrl if getFileUrl fails
              this.logger.error(
                `Failed to get file URL by ID (${mediaResponse.id}), using file_path fallback. Error: ${urlError.message}`,
                urlError.stack,
              );
              const fallbackUrl = this.mediaClientService.buildFileUrl(
                mediaResponse.file_path,
              );
              this.logger.warn(
                `Using fallback URL: ${fallbackUrl} (file_path: ${mediaResponse.file_path})`,
              );
              profile.profile_picture = fallbackUrl;
            }
          } catch (error) {
            this.logger.error(
              `Failed to upload profile picture for user ${userId}: ${error.message}`,
              error.stack,
            );
            throw new BadRequestException(
              `Failed to upload profile picture: ${error.message || 'Unknown error'}`,
            );
          }
        }

        // Upload profile background if provided
        if (profileBackgroundFile) {
          try {
            // Validate file before upload
            if (!profileBackgroundFile.originalname || !profileBackgroundFile.mimetype) {
              throw new BadRequestException('Invalid file: missing originalname or mimetype');
            }

            const mediaResponse = await this.mediaClientService.uploadFile(
              profileBackgroundFile,
              {
                folder: 'profile-backgrounds',
                userId,
                optimize: true,
                is_public: true,
              },
            );
            this.logger.log(
              `File uploaded to media service - ID: ${mediaResponse.id}, file_path: ${mediaResponse.file_path}, filename: ${mediaResponse.filename}`,
            );
            // Get the proper file URL from media service using media ID
            // This ensures we get the correct serving URL format
            try {
              profile.profile_background = await this.mediaClientService.getFileUrl(
                mediaResponse.id,
                false, // not optimized
              );
              this.logger.log(
                `Profile background URL retrieved successfully: ${profile.profile_background} for media ID: ${mediaResponse.id}`,
              );
            } catch (urlError) {
              // Fallback: use buildFileUrl if getFileUrl fails
              this.logger.error(
                `Failed to get file URL by ID (${mediaResponse.id}), using file_path fallback. Error: ${urlError.message}`,
                urlError.stack,
              );
              const fallbackUrl = this.mediaClientService.buildFileUrl(
                mediaResponse.file_path,
              );
              this.logger.warn(
                `Using fallback URL: ${fallbackUrl} (file_path: ${mediaResponse.file_path})`,
              );
              profile.profile_background = fallbackUrl;
            }
          } catch (error) {
            this.logger.error(
              `Failed to upload profile background for user ${userId}: ${error.message}`,
              error.stack,
            );
            throw new BadRequestException(
              `Failed to upload profile background: ${error.message || 'Unknown error'}`,
            );
          }
        }
      }

      // Update profile fields (only if not set by file upload)
      // Don't update profile_picture/profile_background if files were uploaded
      const hasFileUploads = files && files.length > 0;

      if (updateUserDto.full_name !== undefined) {
        profile.full_name = updateUserDto.full_name || null;
      }
      // Only update profile_picture from DTO if no file was uploaded
      if (updateUserDto.profile_picture !== undefined && !hasFileUploads) {
        profile.profile_picture = updateUserDto.profile_picture || null;
      }
      // Only update profile_background from DTO if no file was uploaded
      if (updateUserDto.profile_background !== undefined && !hasFileUploads) {
        profile.profile_background = updateUserDto.profile_background || null;
      }
      if (updateUserDto.tagline !== undefined) {
        profile.tagline = updateUserDto.tagline || null;
      }
      if (updateUserDto.profile_bio !== undefined) {
        profile.profile_bio = updateUserDto.profile_bio || null;
      }
      if (updateUserDto.profile_gender !== undefined) {
        profile.profile_gender = updateUserDto.profile_gender || null;
      }
      if (updateUserDto.profile_birthday !== undefined) {
        profile.profile_birthday = updateUserDto.profile_birthday
          ? new Date(updateUserDto.profile_birthday)
          : null;
      }
      if (updateUserDto.profile_website !== undefined) {
        profile.profile_website = updateUserDto.profile_website || null;
      }
      if (updateUserDto.profile_location !== undefined) {
        profile.profile_location = updateUserDto.profile_location || null;
      }

      profile.updated_by = adminId;
      await this.profileRepository.save(profile);
    }

    // Invalidate cache
    await this.invalidateUserCache(userId);

    return {
      message: 'User updated successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        auth_type: user.auth_type,
        is_active: user.is_active,
        is_verified: user.is_verified,
        updated_at: user.updated_at,
      },
    };
  }

  async deleteUser(userId: number, adminId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prevent admin from deleting themselves
    if (userId === adminId) {
      throw new BadRequestException('Cannot delete your own account');
    }

    // Prevent deleting admin accounts
    if (user.role === UserRole.ADMIN) {
      throw new BadRequestException('Cannot delete admin accounts');
    }

    if (user.is_deleted) {
      return { message: 'User is already deleted.' };
    }

    // Soft delete: mark is_deleted + clear tokens so sessions invalidate
    user.is_deleted = true;
    user.is_active = false;
    user.deleted_at = new Date();
    user.access_token = null;
    user.refresh_token = null;
    user.updated_by = adminId;
    await this.userRepository.save(user);

    this.logger.log(`User ${userId} soft-deleted by admin ${adminId}`);

    return { message: 'User deleted successfully. They cannot log in anymore.' };
  }

  /**
   * Admin: list soft-deleted users.
   */
  async getDeletedUsers(listQueryDto: ListUsersQueryDto) {
    return this.getUsers(listQueryDto, { onlyDeleted: true });
  }

  /**
   * Admin: restore a soft-deleted user (only if the email/username hasn't been re-taken).
   */
  async restoreUser(userId: number, adminId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!user.is_deleted) {
      throw new BadRequestException('User is not deleted');
    }

    // Ensure no other active user has grabbed the same email/username
    const clash = await this.userRepository.findOne({
      where: [
        { email: user.email, is_deleted: false },
        { username: user.username, is_deleted: false },
      ],
      select: ['id'],
    });
    if (clash) {
      throw new ConflictException(
        'Cannot restore: another active user has taken this email or username.',
      );
    }

    user.is_deleted = false;
    user.deleted_at = null;
    user.is_active = true;
    user.updated_by = adminId;
    await this.userRepository.save(user);

    this.logger.log(`User ${userId} restored by admin ${adminId}`);

    return { message: 'User restored successfully.' };
  }

  /**
   * Admin: permanently (hard) delete a user from the database.
   * Only allowed for users with NO content. Frees up the email/username.
   */
  async hardDeleteUser(userId: number, adminId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (userId === adminId) {
      throw new BadRequestException('Cannot hard-delete your own account');
    }
    if (user.role === UserRole.ADMIN) {
      throw new BadRequestException('Cannot hard-delete admin accounts');
    }

    // Block if user has content — they must remain as soft-deleted
    const [postCount, pollCount, postComments, pollComments] = await Promise.all([
      this.postRepository.count({ where: { user_id: userId } }),
      this.pollRepository.count({ where: { user_id: userId } }),
      this.commentRepository.count({ where: { user_id: userId } }),
      this.pollCommentRepository.count({ where: { user_id: userId } }),
    ]);
    const totalContent = postCount + pollCount + postComments + pollComments;

    if (totalContent > 0) {
      throw new ConflictException(
        `Cannot permanently delete: user has ${totalContent} item(s) (posts, polls, or comments). Keep soft-deleted or remove the content first.`,
      );
    }

    // Clean up related rows with no FK cascade
    await this.profileRepository.delete({ user_id: userId });
    await this.followerRepository.delete([{ user_id: userId }, { follower_id: userId }]);
    await this.topicRepository.delete({ user_id: userId });
    await this.communityUserRepository.delete({ user_id: userId });
    await this.userRepository.delete(userId);

    this.logger.log(`User ${userId} HARD-deleted by admin ${adminId}`);

    return { message: 'User permanently deleted.' };
  }

  // Post Management - using PostService with enhanced filters
  async getPosts(listQueryDto: ListPostsQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sort_by = 'created_at',
      sort_order = 'DESC',
      post_status,
      is_featured,
      has_media,
      media_type,
      user_id,
      topic_id,
      created_from,
      created_to,
    } = listQueryDto;

    const queryBuilder = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .leftJoinAndSelect('post.topic', 'topic');

    // Search filter
    if (search) {
      queryBuilder.andWhere(
        '(post.post_title LIKE :search OR post.post_content LIKE :search OR post.post_slug LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Status filter
    if (post_status && post_status !== 'all') {
      queryBuilder.andWhere('post.post_status = :post_status', { post_status });
    }

    // Featured filter - convert string to boolean
    // Featured filter
    if (is_featured !== undefined) {
      queryBuilder.andWhere('post.is_featured = :is_featured', {
        is_featured: is_featured === true ? 1 : 0
      });
    }

    // Media filters
    if (has_media !== undefined) {
      if (has_media) {
        queryBuilder.andWhere(
          '(post.post_image IS NOT NULL OR post.post_video IS NOT NULL OR post.post_audio IS NOT NULL)',
        );
      } else {
        queryBuilder.andWhere(
          '(post.post_image IS NULL AND post.post_video IS NULL AND post.post_audio IS NULL)',
        );
      }
    }

    if (media_type) {
      if (media_type === 'image') {
        queryBuilder.andWhere('post.post_image IS NOT NULL');
      } else if (media_type === 'video') {
        queryBuilder.andWhere('post.post_video IS NOT NULL');
      } else if (media_type === 'audio') {
        queryBuilder.andWhere('post.post_audio IS NOT NULL');
      } else if (media_type === 'none') {
        queryBuilder.andWhere(
          '(post.post_image IS NULL AND post.post_video IS NULL AND post.post_audio IS NULL)',
        );
      }
    }

    // User filter
    if (user_id) {
      queryBuilder.andWhere('post.user_id = :user_id', { user_id });
    }

    // Topic filter
    if (topic_id) {
      queryBuilder.andWhere('post.post_topic_id = :topic_id', { topic_id });
    }

    // Date range filters
    if (created_from) {
      queryBuilder.andWhere('post.created_at >= :created_from', {
        created_from: new Date(created_from),
      });
    }
    if (created_to) {
      queryBuilder.andWhere('post.created_at <= :created_to', {
        created_to: new Date(created_to),
      });
    }

    // Validate sort_by field
    const allowedSortFields = [
      'id',
      'post_title',
      'like_count',
      'comment_count',
      'view_count',
      'created_at',
      'updated_at',
    ];
    const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';

    const skip = (page - 1) * limit;

    // Clone query builder for count (before pagination and joins)
    const countQueryBuilder = queryBuilder.clone();
    const total = await countQueryBuilder.getCount();

    // Apply ordering and pagination
    queryBuilder
      .orderBy(`post.${sortField}`, sort_order)
      .skip(skip)
      .take(limit);

    // Get posts with user and topic relations
    const posts = await queryBuilder.getMany();

    // Get all unique user IDs from posts
    const userIds = [...new Set(posts.map((post) => post.user_id).filter(Boolean))];

    // Fetch all profiles for these users in one query
    const profiles = userIds.length > 0
      ? await this.profileRepository.find({
        where: { user_id: In(userIds) },
        select: ['user_id', 'full_name', 'profile_picture'],
      })
      : [];

    // Create a map of user_id -> profile for quick lookup
    const profileMap = new Map(
      profiles.map((profile) => [profile.user_id, profile]),
    );

    // Map posts to include profile data in user object
    const postsWithProfile = posts.map((post: any) => {
      if (post.user) {
        const profile = profileMap.get(post.user.id);
        if (profile) {
          post.user.profile = {
            full_name: profile.full_name || null,
            profile_picture: profile.profile_picture || null,
          };
        }
      }
      return post;
    });

    return {
      data: postsWithProfile,
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  async getPostById(postId: number) {
    // Skip view count increment for admin views
    return this.postService.getPostById(postId, undefined, true);
  }

  async createPost(
    createPostDto: CreatePostDto,
    adminId: number,
    files?: Express.Multer.File[],
  ) {
    // Admin can create posts using the PostService
    return this.postService.createPost(createPostDto, adminId, files);
  }

  async updatePost(
    postId: number,
    updatePostDto: UpdatePostDto,
    adminId: number,
    files?: Express.Multer.File[],
  ) {
    // Debug: Log received is_featured value
    this.logger.debug(`UpdatePost - is_featured value: ${JSON.stringify(updatePostDto.is_featured)}, type: ${typeof updatePostDto.is_featured}`);
    // Get the post first to check if it exists
    const post = await this.postRepository.findOne({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Admin can update any post, so we need to bypass ownership check
    // We'll use the repository directly for admin updates
    // But first validate topic if being updated
    if (updatePostDto.post_topic_id) {
      const topic = await this.topicEntityRepository.findOne({
        where: { id: updatePostDto.post_topic_id, is_active: true },
        select: ['id'],
      });

      if (!topic) {
        throw new NotFoundException('Topic not found or inactive');
      }
    }

    // Check if slug is being updated and if it already exists
    if (updatePostDto.post_slug && updatePostDto.post_slug !== post.post_slug) {
      const existingPost = await this.postRepository.findOne({
        where: { post_slug: updatePostDto.post_slug },
        select: ['id'],
      });

      if (existingPost) {
        throw new ConflictException('Post with this slug already exists');
      }
    }

    // Process file uploads if provided
    if (files && files.length > 0) {
      for (const file of files) {
        try {
          const mediaResponse = await this.mediaClientService.uploadFile(file, {
            folder: 'posts',
            userId: adminId,
            optimize: true,
            is_public: false,
          });

          // Determine media type based on mime type
          if (file.mimetype.startsWith('image/')) {
            post.post_image = this.mediaClientService.buildFileUrl(
              mediaResponse.file_path,
            );
          } else if (file.mimetype.startsWith('video/')) {
            // Note: Video updates are disabled - videos can only be set during creation
            // Skip video file uploads during update
            this.logger.warn(`Video file upload attempted during post update (postId: ${postId}). Video updates are disabled.`);
          } else if (file.mimetype.startsWith('audio/')) {
            post.post_audio = this.mediaClientService.buildFileUrl(
              mediaResponse.file_path,
            );
          }
        } catch (error) {
          throw new BadRequestException(
            `Failed to upload file: ${file.originalname}`,
          );
        }
      }
    }

    // Update media URLs if provided directly (without file upload)
    if (updatePostDto.post_image && !files?.some(f => f.mimetype.startsWith('image/'))) {
      post.post_image = updatePostDto.post_image;
    }
    // Note: post_video is not updatable - videos can only be set during creation
    // Video updates via URL or file upload are disabled for security reasons
    if (updatePostDto.post_audio && !files?.some(f => f.mimetype.startsWith('audio/'))) {
      post.post_audio = updatePostDto.post_audio;
    }

    // Convert community_ids array to comma-separated string if provided
    if (updatePostDto.community_ids !== undefined) {
      post.community_ids = updatePostDto.community_ids.length > 0
        ? updatePostDto.community_ids.join(',')
        : null;
    }

    // Convert post_tags array to comma-separated string if provided
    if (updatePostDto.post_tags !== undefined) {
      post.post_tags = updatePostDto.post_tags.length > 0
        ? updatePostDto.post_tags.join(',')
        : null;
    }

    // Update other fields
    if (updatePostDto.post_slug !== undefined) {
      post.post_slug = updatePostDto.post_slug;
    }
    if (updatePostDto.post_title !== undefined) {
      post.post_title = updatePostDto.post_title;
    }
    if (updatePostDto.post_content !== undefined) {
      post.post_content = updatePostDto.post_content;
    }
    if (updatePostDto.post_link !== undefined) {
      post.post_link = updatePostDto.post_link;
    }
    if (updatePostDto.post_status !== undefined) {
      post.post_status = updatePostDto.post_status;
    }
    if (updatePostDto.post_topic_id !== undefined) {
      post.post_topic_id = updatePostDto.post_topic_id;
    }
    if (updatePostDto.is_featured !== undefined) {
      post.is_featured = updatePostDto.is_featured === 'featured';
    }

    post.updated_by = adminId;
    await this.postRepository.save(post);

    // Get updated post using service for proper formatting
    // Skip view count increment for admin views
    return this.postService.getPostById(postId, undefined, true);
  }

  async updatePostStatus(
    postId: number,
    updatePostStatusDto: UpdatePostStatusDto,
    adminId: number,
  ) {
    // Get the post first to check if it exists
    const post = await this.postRepository.findOne({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Admin can update any post status directly via repository
    if (updatePostStatusDto.post_status !== undefined) {
      post.post_status = updatePostStatusDto.post_status;
    }
    if (updatePostStatusDto.is_featured !== undefined) {
      post.is_featured = !!updatePostStatusDto.is_featured;
    }
    post.updated_by = adminId;
    await this.postRepository.save(post);

    // Get updated post using service for proper formatting
    // Skip view count increment for admin views
    const updatedPost = await this.postService.getPostById(postId, undefined, true);

    return {
      message: 'Post status updated successfully',
      post: updatedPost,
    };
  }

  async deletePost(postId: number, adminId: number) {
    // Get the post first to check if it exists
    const post = await this.postRepository.findOne({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Get all comments for this post (including nested/replies)
    const comments = await this.commentRepository.find({
      where: { post_id: postId },
    });

    // Delete all comment likes for comments on this post
    if (comments.length > 0) {
      const commentIds = comments.map((c) => c.id);
      await this.commentLikeRepository.delete({
        comment_id: In(commentIds),
      });
    }

    // Delete all comments (including nested/replies) for this post
    // This will cascade delete nested comments due to parent_comment_id foreign key
    await this.commentRepository.delete({ post_id: postId });

    // Delete all post likes for this post
    await this.postLikeRepository.delete({ post_id: postId });

    // Permanently delete the post from the database (NOT archiving - complete removal)
    await this.postRepository.delete({ id: postId });

    return { message: 'Post and all related data permanently deleted successfully' };
  }

  // Comment Management - with enhanced filters
  async getComments(listQueryDto: ListCommentsQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sort_by = 'created_at',
      sort_order = 'DESC',
      is_approved,
      post_id,
      user_id,
      has_replies,
      created_from,
      created_to,
    } = listQueryDto;

    const queryBuilder = this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .leftJoinAndSelect('comment.post', 'post');

    // Search filter
    if (search) {
      queryBuilder.andWhere('comment.comment_content LIKE :search', {
        search: `%${search}%`,
      });
    }

    // Approval filter
    // Approved filter
    if (is_approved !== undefined) {
      queryBuilder.andWhere('comment.is_approved = :is_approved', {
        is_approved: is_approved === ApprovedStatus.APPROVED ? 1 : 0,
      });
    }

    // Post filter
    if (post_id) {
      queryBuilder.andWhere('comment.post_id = :post_id', { post_id });
    }

    // User filter
    if (user_id) {
      queryBuilder.andWhere('comment.user_id = :user_id', { user_id });
    }

    // Has replies filter
    if (has_replies) {
      if (has_replies === RepliesStatus.WITH_REPLIES) {
        queryBuilder.andWhere(
          'EXISTS (SELECT 1 FROM post_comments pc WHERE pc.parent_comment_id = comment.id)',
        );
      } else if (has_replies === RepliesStatus.WITHOUT_REPLIES) {
        queryBuilder.andWhere(
          'NOT EXISTS (SELECT 1 FROM post_comments pc WHERE pc.parent_comment_id = comment.id)',
        );
      }
    }

    // Date range filters
    if (created_from) {
      queryBuilder.andWhere('comment.created_at >= :created_from', {
        created_from: new Date(created_from),
      });
    }
    if (created_to) {
      queryBuilder.andWhere('comment.created_at <= :created_to', {
        created_to: new Date(created_to),
      });
    }

    // Validate sort_by field
    const allowedSortFields = [
      'id',
      'like_count',
      'replies_count',
      'created_at',
      'updated_at',
    ];
    const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';

    const skip = (page - 1) * limit;
    queryBuilder
      .orderBy(`comment.${sortField}`, sort_order)
      .skip(skip)
      .take(limit);

    const [comments, total] = await queryBuilder.getManyAndCount();

    // Get unique user IDs
    const userIds = new Set<number>();
    comments.forEach((comment) => {
      if (comment.user_id) userIds.add(comment.user_id);
    });

    // Load user profiles in batch
    const userProfilesMap = new Map<number, any>();
    if (userIds.size > 0) {
      const profiles = await this.profileRepository.find({
        where: { user_id: In(Array.from(userIds)) },
        select: ['user_id', 'full_name', 'profile_picture'],
      });
      profiles.forEach((profile) => {
        userProfilesMap.set(profile.user_id, profile);
      });
    }

    // Add replies count and map to DTOs
    const mappedData = await Promise.all(
      comments.map(async (comment) => {
        const repliesCount = await this.commentRepository.count({
          where: { parent_comment_id: comment.id },
        });

        const commentWithExtras: any = {
          ...comment,
          replies_count: repliesCount,
        };

        // Attach profile data
        if (comment.user && userProfilesMap.has(comment.user.id)) {
          const profile = userProfilesMap.get(comment.user.id);
          commentWithExtras.user.profile_picture = profile?.profile_picture || null;
          commentWithExtras.user.full_name = profile?.full_name || null;
        }

        return this.commentService.mapPostCommentToResponseDto(commentWithExtras);
      }),
    );

    return {
      data: mappedData,
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  async getCommentById(commentId: number) {
    return this.commentService.getCommentById(commentId);
  }

  async updateComment(
    commentId: number,
    updateCommentDto: UpdateCommentDto,
    adminId: number,
  ) {
    // Admin can update any comment (approve/unapprove, edit content)
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Admin can update any comment without ownership check
    if (updateCommentDto.comment_content !== undefined) {
      comment.comment_content = updateCommentDto.comment_content;
    }
    if (updateCommentDto.is_approved !== undefined) {
      comment.is_approved = updateCommentDto.is_approved;
    }

    comment.updated_by = adminId;
    await this.commentRepository.save(comment);

    return this.commentService.getCommentById(commentId);
  }

  async deleteComment(commentId: number, adminId: number) {
    // Get the comment first to check if it exists
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Admin can delete any comment, so we'll directly update the repository
    // Check if comment has replies
    const repliesCount = await this.commentRepository.count({
      where: { parent_comment_id: commentId },
    });

    if (repliesCount > 0) {
      // Soft delete: mark as not approved instead of deleting
      comment.is_approved = false;
      comment.updated_by = adminId;
      await this.commentRepository.save(comment);
      return { message: 'Comment deleted successfully (soft delete)' };
    }

    // Hard delete if no replies
    await this.commentRepository.remove(comment);

    // Update post comment count
    await this.commentRepository.manager.decrement(
      'user_posts',
      { id: comment.post_id },
      'comment_count',
      1,
    );

    return { message: 'Comment deleted successfully' };
  }

  async getCommentReplies(
    commentId: number,
    listQueryDto: ListCommentsQueryDto,
  ) {
    // Convert Admin DTO to Comment DTO format
    // Comment module expects boolean for is_approved
    const { is_approved, ...rest } = listQueryDto;
    const commentListQueryDto: any = {
      ...rest,
      is_approved: is_approved === ApprovedStatus.APPROVED ? true :
        is_approved === ApprovedStatus.NOT_APPROVED ? false :
          undefined,
    };

    return this.commentService.getCommentReplies(commentId, commentListQueryDto);
  }

  // Topic Management - with enhanced filters
  async getTopics(listQueryDto: ListTopicsQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sort_by = 'created_at',
      sort_order = 'DESC',
      is_active,
      parent_id,
      type,
      has_children,
      created_from,
      created_to,
    } = listQueryDto;

    const queryBuilder = this.topicEntityRepository.createQueryBuilder('topic');

    // Search filter
    if (search) {
      queryBuilder.andWhere(
        '(topic.topic_name LIKE :search OR topic.topic_slug LIKE :search OR topic.topic_description LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Active status filter
    if (is_active) {
      const activeValue = is_active === ActiveStatus.ACTIVE;
      queryBuilder.andWhere('topic.is_active = :is_active', { is_active: activeValue });
    }

    // Parent ID filter
    if (parent_id !== undefined) {
      queryBuilder.andWhere('topic.parent_id = :parent_id', { parent_id });
    }

    // Type filter
    if (type) {
      if (type === 'categories') {
        queryBuilder.andWhere('topic.parent_id = 0');
      } else if (type === 'subtopics') {
        queryBuilder.andWhere('topic.parent_id > 0');
      }
    }

    // Has children filter
    if (has_children) {
      if (has_children === ChildrenStatus.WITH_CHILDREN) {
        queryBuilder.andWhere(
          'EXISTS (SELECT 1 FROM topics t WHERE t.parent_id = topic.id)',
        );
      } else if (has_children === ChildrenStatus.WITHOUT_CHILDREN) {
        queryBuilder.andWhere(
          'NOT EXISTS (SELECT 1 FROM topics t WHERE t.parent_id = topic.id)',
        );
      }
    }


    // Date range filters
    if (created_from) {
      queryBuilder.andWhere('topic.created_at >= :created_from', {
        created_from: new Date(created_from),
      });
    }
    if (created_to) {
      queryBuilder.andWhere('topic.created_at <= :created_to', {
        created_to: new Date(created_to),
      });
    }

    // Validate sort_by field
    const allowedSortFields = [
      'id',
      'topic_name',
      'topic_slug',
      'created_at',
      'updated_at',
    ];
    const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';

    const skip = (page - 1) * limit;
    queryBuilder.orderBy(`topic.${sortField}`, sort_order).skip(skip).take(limit);

    // Load parent relation for child topics
    queryBuilder.leftJoinAndSelect('topic.parent', 'parent');

    const [topics, total] = await queryBuilder.getManyAndCount();

    // If fetching parent topics (parent_id = 0 or undefined), load their children
    // Check if we're fetching parent topics based on filters
    const isFetchingParents = parent_id === undefined || parent_id === 0;

    if (isFetchingParents && topics.length > 0) {
      // Get parent topic IDs (only those with parent_id = 0)
      const parentTopicIds = topics.filter(t => t.parent_id === 0).map(t => t.id);

      if (parentTopicIds.length > 0) {
        // Load children for these parent topics
        const childQueryBuilder = this.topicEntityRepository.createQueryBuilder('topic');
        childQueryBuilder.where('topic.parent_id IN (:...parentIds)', { parentIds: parentTopicIds });

        // Apply same is_active filter to children if specified
        if (is_active) {
          const activeValue = is_active === ActiveStatus.ACTIVE;
          childQueryBuilder.andWhere('topic.is_active = :is_active', { is_active: activeValue });
        } else {
          // If is_active filter not specified, only get active children
          childQueryBuilder.andWhere('topic.is_active = :is_active', { is_active: true });
        }

        // Apply same search filter to children if specified
        if (search) {
          childQueryBuilder.andWhere(
            '(topic.topic_name LIKE :search OR topic.topic_slug LIKE :search OR topic.topic_description LIKE :search)',
            { search: `%${search}%` },
          );
        }

        childQueryBuilder.orderBy('topic.parent_id', 'ASC');
        childQueryBuilder.addOrderBy('topic.created_at', 'ASC');
        const childTopics = await childQueryBuilder.getMany();

        // Group children by parent_id
        const childrenByParent = new Map<number, any[]>();
        childTopics.forEach((child) => {
          if (!childrenByParent.has(child.parent_id)) {
            childrenByParent.set(child.parent_id, []);
          }
          childrenByParent.get(child.parent_id)!.push(child);
        });

        // Attach children to their parents
        topics.forEach((topic) => {
          if (topic.parent_id === 0) {
            topic.children = childrenByParent.get(topic.id) || [];
          }
        });
      }
    }

    // Add usage counts for each topic
    const topicsWithUsage = await Promise.all(
      topics.map(async (topic) => {
        const postsCount = await this.postRepository.count({
          where: { post_topic_id: topic.id, post_status: PostStatus.PUBLISHED },
        });
        const communitiesCount = await this.communityTopicRepository.count({
          where: { topic_id: topic.id, is_active: true },
        });
        return {
          ...topic,
          posts_count: postsCount,
          communities_count: communitiesCount,
          usage_count: postsCount + communitiesCount,
          ...(topic.parent && { parent_name: topic.parent.topic_name }),
          // Include children names for parent topics (only basic info)
          ...(topic.children && topic.children.length > 0 && {
            children: topic.children.map((child) => ({
              id: child.id,
              topic_name: child.topic_name,
              topic_slug: child.topic_slug,
            })),
          }),
        };
      }),
    );

    return {
      data: topicsWithUsage,
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  // Get Topics for Select List (Parent-Child format for dropdowns)
  async getTopicsForSelectList(): Promise<TopicSelectListDto[]> {
    return this.generalService.getTopicsForSelectList();
  }

  // Get Parent Topics Only (parent_id = 0)
  async getParentTopics(listQueryDto: ListQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sort_by = 'created_at',
      sort_order = 'DESC',
    } = listQueryDto;

    const queryBuilder = this.topicEntityRepository.createQueryBuilder('topic');

    // Only get parent topics (parent_id = 0)
    queryBuilder.where('topic.parent_id = :parent_id', { parent_id: 0 });

    // Search filter
    if (search) {
      queryBuilder.andWhere(
        '(topic.topic_name LIKE :search OR topic.topic_slug LIKE :search OR topic.topic_description LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Validate sort_by field
    const allowedSortFields = [
      'id',
      'topic_name',
      'topic_slug',
      'created_at',
      'updated_at',
    ];
    const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';

    const skip = (page - 1) * limit;
    queryBuilder.orderBy(`topic.${sortField}`, sort_order).skip(skip).take(limit);

    // Load parent relation (though parent topics don't have parents, this is for consistency)
    queryBuilder.leftJoinAndSelect('topic.parent', 'parent');

    const [topics, total] = await queryBuilder.getManyAndCount();

    // Add usage counts for each topic
    const topicsWithUsage = await Promise.all(
      topics.map(async (topic) => {
        const postsCount = await this.postRepository.count({
          where: { post_topic_id: topic.id, post_status: PostStatus.PUBLISHED },
        });
        const communitiesCount = await this.communityTopicRepository.count({
          where: { topic_id: topic.id, is_active: true },
        });
        const childrenCount = await this.topicEntityRepository.count({
          where: { parent_id: topic.id, is_active: true },
        });
        return {
          ...topic,
          posts_count: postsCount,
          communities_count: communitiesCount,
          children_count: childrenCount,
          usage_count: postsCount + communitiesCount,
          ...(topic.parent && { parent_name: topic.parent.topic_name }),
        };
      }),
    );

    return {
      data: topicsWithUsage,
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  async getTopicById(topicId: number) {
    return this.generalService.getTopicById(topicId);
  }

  async createTopic(
    createTopicDto: CreateTopicDto,
    adminId: number,
    file?: Express.Multer.File,
  ) {
    try {
      // Admin can create topics using the GeneralService
      return await this.generalService.createTopic(createTopicDto, adminId, file);
    } catch (error) {
      // Re-throw known exceptions
      if (error instanceof BadRequestException ||
        error instanceof ConflictException ||
        error instanceof NotFoundException) {
        throw error;
      }
      // Log and wrap unknown errors
      console.error('Error in admin createTopic:', error);
      throw new BadRequestException(`Failed to create topic: ${error.message || 'Unknown error'}`);
    }
  }

  async updateTopic(
    topicId: number,
    updateTopicDto: UpdateTopicDto,
    adminId: number,
    file?: Express.Multer.File,
  ) {
    // Admin can update any topic using the GeneralService
    return this.generalService.updateTopic(topicId, updateTopicDto, adminId, file);
  }

  async updateTopicStatus(
    topicId: number,
    updateTopicStatusDto: UpdateTopicStatusDto,
    adminId: number,
  ) {
    // Get the topic first to check if it exists
    const topic = await this.topicEntityRepository.findOne({
      where: { id: topicId },
    });

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    // Update topic status using GeneralService's updateTopic method
    // Pass the ActiveStatus enum value directly (not boolean)
    await this.generalService.updateTopic(
      topicId,
      {
        is_active: updateTopicStatusDto.is_active, // Pass ActiveStatus enum ('active' or 'inactive')
      },
      adminId,
    );

    // Get updated topic
    const updatedTopic = await this.generalService.getTopicById(topicId);

    return {
      message: 'Topic status updated successfully',
      topic: updatedTopic,
    };
  }

  async deleteTopic(topicId: number, adminId: number): Promise<{ message: string }> {
    // Check if topic exists
    const topic = await this.topicEntityRepository.findOne({
      where: { id: topicId },
    });

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    // Check if topic has children (child topics that reference this as parent)
    const childrenCount = await this.topicEntityRepository.count({
      where: { parent_id: topicId },
    });

    if (childrenCount > 0) {
      throw new BadRequestException(
        `Cannot delete topic: This topic has ${childrenCount} child topic(s). Please delete or reassign child topics first.`,
      );
    }

    // Check if topic is used in posts
    const postsCount = await this.postRepository.count({
      where: { post_topic_id: topicId },
    });

    if (postsCount > 0) {
      throw new BadRequestException(
        `Cannot delete topic: This topic is used in ${postsCount} post(s). The topic is currently in use and cannot be deleted.`,
      );
    }

    // Check if topic is used in communities (community_topics)
    const communityTopicsCount = await this.communityTopicRepository.count({
      where: { topic_id: topicId },
    });

    if (communityTopicsCount > 0) {
      throw new BadRequestException(
        `Cannot delete topic: This topic is associated with ${communityTopicsCount} community/communities. The topic is currently in use and cannot be deleted.`,
      );
    }

    // Check if topic is subscribed by users (user_topics)
    const userTopicsCount = await this.topicRepository.count({
      where: { topic_id: topicId },
    });

    if (userTopicsCount > 0) {
      throw new BadRequestException(
        `Cannot delete topic: This topic is subscribed by ${userTopicsCount} user(s). The topic is currently in use and cannot be deleted.`,
      );
    }

    // If topic is not used anywhere, proceed with permanent hard delete from database
    // This is NOT a soft delete - the topic will be permanently removed
    await this.topicEntityRepository.delete({ id: topicId });

    this.logger.log(`Topic ${topicId} permanently deleted from database by admin ${adminId}`);

    return { message: 'Topic permanently deleted from database' };
  }

  // Community Management - with enhanced filters
  async getCommunities(listQueryDto: ListCommunitiesQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sort_by = 'created_at',
      sort_order = 'DESC',
      is_active,
      category_id,
      min_members,
      max_members,
      created_from,
      created_to,
    } = listQueryDto;

    const queryBuilder = this.communityRepository.createQueryBuilder('community');

    // Search filter
    if (search) {
      queryBuilder.andWhere(
        '(community.community_name LIKE :search OR community.community_slug LIKE :search OR community.community_description LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Active status filter - convert enum to boolean
    if (is_active !== undefined) {
      const activeValue = is_active === ActiveStatus.ACTIVE;
      queryBuilder.andWhere('community.is_active = :is_active', { is_active: activeValue });
    }

    // Category filter (if category_id field exists)
    if (category_id) {
      // This assumes category_id exists, adjust if needed
      queryBuilder.andWhere('community.category_id = :category_id', { category_id });
    }

    // Member count filters - using subqueries to avoid groupBy issues with getManyAndCount
    if (min_members !== undefined || max_members !== undefined) {
      // We use a subquery string to safely include in andWhere/having
      const memberCountSubQuery = this.communityUserRepository
        .createQueryBuilder('cu_filter')
        .select('COUNT(cu_filter.id)')
        .where('cu_filter.community_id = community.id')
        .andWhere('cu_filter.is_active = 1')
        .getQuery();

      if (min_members !== undefined) {
        queryBuilder.andWhere(`(${memberCountSubQuery}) >= :min_members`, {
          min_members,
        });
      }
      if (max_members !== undefined) {
        queryBuilder.andWhere(`(${memberCountSubQuery}) <= :max_members`, {
          max_members,
        });
      }
    }

    // Date range filters
    if (created_from) {
      queryBuilder.andWhere('community.created_at >= :created_from', {
        created_from: new Date(created_from),
      });
    }
    if (created_to) {
      queryBuilder.andWhere('community.created_at <= :created_to', {
        created_to: new Date(created_to),
      });
    }

    // Validate sort_by field
    const allowedSortFields = [
      'id',
      'community_name',
      'community_slug',
      'members_count',
      'created_at',
      'updated_at',
    ];
    const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';

    const skip = (page - 1) * limit;

    // If sorting by members_count, need to use a subquery to avoid groupBy issues
    if (sortField === 'members_count') {
      const memberCountSortSubQuery = this.communityUserRepository
        .createQueryBuilder('cu_sort')
        .select('COUNT(cu_sort.id)')
        .where('cu_sort.community_id = community.id')
        .andWhere('cu_sort.is_active = 1')
        .getQuery();

      queryBuilder
        .orderBy(`(${memberCountSortSubQuery})`, sort_order)
        .skip(skip)
        .take(limit);
    } else {
      queryBuilder.orderBy(`community.${sortField}`, sort_order).skip(skip).take(limit);
    }

    const [communities, total] = await queryBuilder.getManyAndCount();

    // Get all community IDs
    const communityIds = communities.map((c) => c.id);

    // Fetch all topics for these communities in one query
    const communityTopics = communityIds.length > 0
      ? await this.communityTopicRepository.find({
        where: { community_id: In(communityIds), is_active: true },
        relations: ['topic'],
        select: ['community_id', 'topic_id', 'topic'],
      })
      : [];

    // Group topics by community_id
    const topicsByCommunity = new Map<number, any[]>();
    communityTopics.forEach((ct) => {
      if (!topicsByCommunity.has(ct.community_id)) {
        topicsByCommunity.set(ct.community_id, []);
      }
      if (ct.topic) {
        topicsByCommunity.get(ct.community_id)!.push({
          id: ct.topic.id,
          topic_name: ct.topic.topic_name,
          topic_slug: ct.topic.topic_slug,
        });
      }
    });

    // Add member and topic counts, and topics
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const communitiesWithCounts = await Promise.all(
      communities.map(async (community) => {
        const memberCount = await this.communityUserRepository.count({
          where: { community_id: community.id, is_active: true },
        });
        const topicCount = await this.communityTopicRepository.count({
          where: { community_id: community.id, is_active: true },
        });

        // Calculate posts per day based on last 30 days
        const last30DaysPosts = await this.postRepository
          .createQueryBuilder('post')
          .where('(FIND_IN_SET(:communityId, post.community_ids) > 0 OR post.community_ids = :communityIdStr)', {
            communityId: community.id,
            communityIdStr: community.id.toString()
          })
          .andWhere('post.created_at >= :thirtyDaysAgo', { thirtyDaysAgo })
          .getCount();

        const posts_per_day = parseFloat((last30DaysPosts / 30).toFixed(2));

        return {
          ...community,
          member_count: memberCount,
          topic_count: topicCount,
          posts_per_day,
          topics: topicsByCommunity.get(community.id) || [],
        };
      }),
    );

    return {
      data: communitiesWithCounts,
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  async getCommunityById(communityId: number) {
    return this.communityService.getCommunityById(communityId);
  }

  async createCommunity(
    createCommunityDto: CreateCommunityDto,
    adminId: number,
    file?: Express.Multer.File,
  ) {
    // Admin can create communities using the CommunityService
    return this.communityService.createCommunity(createCommunityDto, adminId, file);
  }

  async updateCommunity(
    communityId: number,
    updateCommunityDto: UpdateCommunityDto,
    adminId: number,
    file?: Express.Multer.File,
  ) {
    // Get the community first to check if it exists
    const community = await this.communityRepository.findOne({
      where: { id: communityId },
    });

    if (!community) {
      throw new NotFoundException('Community not found');
    }

    // Admin can update any community, bypassing community admin/moderator check
    // We'll use the repository directly for admin updates
    // But we still need to handle file uploads if provided
    // For now, we'll use the service but need to modify it or use repository directly

    // Check if slug is being updated and if it already exists
    if (updateCommunityDto.community_slug && updateCommunityDto.community_slug !== community.community_slug) {
      const existingCommunity = await this.communityRepository.findOne({
        where: { community_slug: updateCommunityDto.community_slug },
        select: ['id'],
      });

      if (existingCommunity) {
        throw new ConflictException('Community with this slug already exists');
      }
    }

    // Helper function to transform is_active value (handles various input formats)
    const transformIsActive = (value: any): boolean | undefined => {
      if (value === undefined || value === null || value === '') return undefined;
      if (typeof value === 'boolean') return value;
      const stringValue = String(value).toLowerCase().trim();
      if (stringValue === 'active' || stringValue === 'true' || stringValue === '1') return true;
      if (stringValue === 'inactive' || stringValue === 'false' || stringValue === '0') return false;
      if (value === 1 || value === '1') return true;
      if (value === 0 || value === '0') return false;
      return undefined;
    };

    // Update fields (exclude topic_ids - handled separately)
    const { topic_ids, ...communityUpdateData } = updateCommunityDto;
    if (communityUpdateData.community_slug !== undefined) {
      community.community_slug = communityUpdateData.community_slug;
    }
    if (communityUpdateData.community_name !== undefined) {
      community.community_name = communityUpdateData.community_name;
    }
    if (communityUpdateData.community_description !== undefined) {
      community.community_description = communityUpdateData.community_description;
    }
    if (communityUpdateData.community_image !== undefined) {
      community.community_image = communityUpdateData.community_image;
    }

    // Handle is_active/active status update
    // Support both 'is_active' and 'active' field names
    // Check if either field is explicitly provided in the DTO (including false values)
    let activeValue: any = undefined;

    if ('is_active' in updateCommunityDto) {
      activeValue = updateCommunityDto.is_active;
    } else if ('active' in updateCommunityDto) {
      // Support 'active' field as alternative to 'is_active'
      activeValue = (updateCommunityDto as any).active;
    }

    // Always process is_active if it's provided (even if it's a string from FormData)
    if (activeValue !== undefined && activeValue !== null && activeValue !== '') {
      // Transform the value to boolean if needed
      const transformedIsActive = transformIsActive(activeValue);

      if (transformedIsActive !== undefined) {
        // Successfully transformed to boolean
        community.is_active = transformedIsActive;
      } else if (typeof activeValue === 'boolean') {
        // Already a boolean (shouldn't happen if Transform works, but handle it)
        community.is_active = activeValue;
      } else {
        // If transformation fails, log for debugging but try to handle common cases
        this.logger.warn(`Unable to transform is_active value: ${activeValue} (type: ${typeof activeValue})`);
        // Try one more time with direct string comparison
        const stringValue = String(activeValue).toLowerCase().trim();
        if (stringValue === 'active' || stringValue === 'true' || stringValue === '1') {
          community.is_active = true;
        } else if (stringValue === 'inactive' || stringValue === 'false' || stringValue === '0') {
          community.is_active = false;
        }
        // If still can't determine, preserve existing value
      }
    }

    // Handle file upload if provided
    if (file) {
      try {
        const mediaResponse = await this.mediaClientService.uploadFile(file, {
          folder: 'communities',
          userId: adminId,
          optimize: true,
          is_public: true,
        });
        community.community_image = this.mediaClientService.buildFileUrl(
          mediaResponse.file_path,
        );
      } catch (error) {
        throw new BadRequestException('Failed to upload community image');
      }
    }

    community.updated_by = adminId;
    await this.communityRepository.save(community);

    // Handle topic_ids update if provided
    if (updateCommunityDto.topic_ids !== undefined) {
      // Get existing community topics
      const existingTopics = await this.communityTopicRepository.find({
        where: { community_id: communityId },
      });

      // Get the topic IDs that should remain
      const topicIdsToKeep = updateCommunityDto.topic_ids || [];
      const existingTopicIds = existingTopics.map((ct) => ct.topic_id);

      // Topics to add (in new list but not in existing)
      const topicIdsToAdd = topicIdsToKeep.filter(
        (id) => !existingTopicIds.includes(id),
      );

      // Topics to remove (in existing but not in new list)
      const topicIdsToRemove = existingTopicIds.filter(
        (id) => !topicIdsToKeep.includes(id),
      );

      // Validate topics to add exist and are active
      if (topicIdsToAdd.length > 0) {
        const topicsToAdd = await this.topicRepository.find({
          where: { id: In(topicIdsToAdd), is_active: true },
          select: ['id'],
        });

        if (topicsToAdd.length !== topicIdsToAdd.length) {
          throw new BadRequestException(
            'One or more topics not found or inactive',
          );
        }

        // Create new community-topic associations
        const newCommunityTopics = topicIdsToAdd.map((topicId) =>
          this.communityTopicRepository.create({
            community_id: communityId,
            topic_id: topicId,
            is_active: true,
            created_by: adminId,
          }),
        );

        await this.communityTopicRepository.save(newCommunityTopics);
      }

      // Remove topics that are no longer in the list
      if (topicIdsToRemove.length > 0) {
        await this.communityTopicRepository.update(
          {
            community_id: communityId,
            topic_id: In(topicIdsToRemove),
          },
          {
            is_active: false,
            updated_by: adminId,
          },
        );
      }
    }

    // Get updated community using service for proper formatting
    return this.communityService.getCommunityById(communityId);
  }

  async updateCommunityStatus(
    communityId: number,
    updateCommunityStatusDto: UpdateCommunityStatusDto,
    adminId: number,
  ) {
    // Get the community first to check if it exists
    const community = await this.communityRepository.findOne({
      where: { id: communityId },
    });

    if (!community) {
      throw new NotFoundException('Community not found');
    }

    // Admin can update any community status directly
    // Update community status using repository
    community.is_active = updateCommunityStatusDto.is_active;
    community.updated_by = adminId;
    await this.communityRepository.save(community);

    // Get updated community
    const updatedCommunity = await this.communityService.getCommunityById(
      communityId,
    );

    return {
      message: 'Community status updated successfully',
      community: updatedCommunity,
    };
  }

  async deleteCommunity(communityId: number, adminId: number) {
    // Get the community first to check if it exists
    const community = await this.communityRepository.findOne({
      where: { id: communityId },
    });

    if (!community) {
      throw new NotFoundException('Community not found');
    }

    // Admin can delete any community, bypassing community admin check
    // Count active members
    const memberCount = await this.communityUserRepository.count({
      where: { community_id: communityId, is_active: true },
    });

    // Delete all related community-topic associations
    await this.communityTopicRepository.delete({
      community_id: communityId,
    });

    // If community has only one member, delete the record from database
    if (memberCount === 1) {
      await this.communityRepository.remove(community);
      return { message: 'Community deleted successfully (hard delete - only one member)' };
    }

    // If community has more than one member, soft delete (inactivate)
    community.is_active = false;
    community.updated_by = adminId;
    await this.communityRepository.save(community);

    return { message: 'Community deleted successfully (soft delete - multiple members)' };
  }

  async getCommunityMembers(communityId: number, listQueryDto: ListQueryDto) {
    // Admin can view members of any community
    const membersData = await this.communityService.getCommunityMembers(communityId, {
      page: listQueryDto.page || 1,
      limit: listQueryDto.limit || 10,
      role: undefined, // Admin can see all roles
      sort_by: listQueryDto.sort_by || 'created_at',
      sort_order: listQueryDto.sort_order || 'DESC',
    });

    // Enrich with post count and profile info specifically for admin view
    const enrichedData = await Promise.all(
      membersData.data.map(async (member) => {
        // Count posts by this user in this specific community
        // Using FIND_IN_SET because community_ids is a comma-separated string
        const postsCount = await this.postRepository
          .createQueryBuilder('post')
          .where('post.user_id = :userId', { userId: member.user_id })
          .andWhere(
            '(FIND_IN_SET(:communityId, post.community_ids) > 0 OR post.community_ids = :communityIdStr)',
            { communityId, communityIdStr: communityId.toString() },
          )
          .getCount();

        // Fetch user profile for more details (avatar/full name)
        const profile = await this.profileRepository.findOne({
          where: { user_id: member.user_id },
          select: ['full_name', 'profile_picture'],
        });

        return {
          ...member,
          posts_count: postsCount,
          user: {
            ...member.user,
            full_name: profile?.full_name || null,
            profile_picture: profile?.profile_picture || null,
          },
        };
      }),
    );

    return {
      ...membersData,
      data: enrichedData,
    };
  }

  async updateMemberRole(
    communityId: number,
    memberId: number,
    updateMemberRoleDto: UpdateMemberRoleDto,
    adminId: number,
  ) {
    // Admin can update member roles in any community, bypassing community admin check
    // Get the member first
    const targetMember = await this.communityUserRepository.findOne({
      where: {
        community_id: communityId,
        user_id: memberId,
        is_active: true,
      },
      relations: ['user'],
    });

    if (!targetMember) {
      throw new NotFoundException('Member not found');
    }

    // Prevent removing the last admin
    if (
      targetMember.role === CommunityUserRole.ADMIN &&
      updateMemberRoleDto.role !== CommunityUserRole.ADMIN
    ) {
      const adminCount = await this.communityUserRepository.count({
        where: {
          community_id: communityId,
          role: CommunityUserRole.ADMIN,
          is_active: true,
        },
      });

      if (adminCount === 1) {
        throw new BadRequestException(
          'Cannot change role: this is the only admin. Please assign another admin first.',
        );
      }
    }

    targetMember.role = updateMemberRoleDto.role;
    targetMember.updated_by = adminId;
    await this.communityUserRepository.save(targetMember);

    // Return properly formatted member response
    return {
      id: targetMember.id,
      community_id: targetMember.community_id,
      user_id: targetMember.user_id,
      role: targetMember.role,
      is_active: targetMember.is_active,
      created_at: targetMember.created_at,
      updated_at: targetMember.updated_at,
      user: targetMember.user ? {
        id: targetMember.user.id,
        username: targetMember.user.username,
        email: targetMember.user.email,
      } : null,
    };
  }

  async getCommunityTopics(communityId: number) {
    // Admin can view topics of any community
    return this.communityService.getCommunityTopics(communityId);
  }

  async addTopicToCommunity(
    communityId: number,
    addTopicDto: AddTopicToCommunityDto,
    adminId: number,
  ) {
    // Admin can add topics to any community, bypassing community admin/moderator check
    // Check if community exists (admin can add to inactive communities too)
    const community = await this.communityRepository.findOne({
      where: { id: communityId },
      select: ['id'],
    });

    if (!community) {
      throw new NotFoundException('Community not found');
    }

    // Check if topic exists
    const topic = await this.topicEntityRepository.findOne({
      where: { id: addTopicDto.topic_id, is_active: true },
      select: ['id'],
    });

    if (!topic) {
      throw new NotFoundException('Topic not found or inactive');
    }

    // Check if topic is already associated
    const existingAssociation = await this.communityTopicRepository.findOne({
      where: {
        community_id: communityId,
        topic_id: addTopicDto.topic_id,
      },
      relations: ['topic'],
    });

    if (existingAssociation) {
      if (existingAssociation.is_active) {
        throw new ConflictException('Topic is already associated with this community');
      } else {
        // Reactivate association
        existingAssociation.is_active = true;
        existingAssociation.updated_by = adminId;
        await this.communityTopicRepository.save(existingAssociation);
        // Get updated association with relations
        const updated = await this.communityTopicRepository.findOne({
          where: { id: existingAssociation.id },
          relations: ['topic'],
        });

        if (!updated) {
          throw new NotFoundException('Failed to retrieve updated topic association');
        }

        return {
          id: updated.id,
          community_id: updated.community_id,
          topic_id: updated.topic_id,
          is_active: updated.is_active,
          topic: updated.topic ? {
            id: updated.topic.id,
            topic_name: updated.topic.topic_name,
            topic_slug: updated.topic.topic_slug,
          } : null,
        };
      }
    }

    // Create new association
    const communityTopic = this.communityTopicRepository.create({
      community_id: communityId,
      topic_id: addTopicDto.topic_id,
      is_active: true,
      created_by: adminId,
    });

    const savedAssociation = await this.communityTopicRepository.save(communityTopic);

    // Get with relations for proper response
    const withRelations = await this.communityTopicRepository.findOne({
      where: { id: savedAssociation.id },
      relations: ['topic'],
    });

    if (!withRelations) {
      throw new NotFoundException('Failed to retrieve created topic association');
    }

    return {
      id: withRelations.id,
      community_id: withRelations.community_id,
      topic_id: withRelations.topic_id,
      is_active: withRelations.is_active,
      topic: withRelations.topic ? {
        id: withRelations.topic.id,
        topic_name: withRelations.topic.topic_name,
        topic_slug: withRelations.topic.topic_slug,
      } : null,
    };
  }

  async removeTopicFromCommunity(
    communityId: number,
    topicId: number,
    adminId: number,
  ) {
    // Admin can remove topics from any community, bypassing community admin/moderator check
    const association = await this.communityTopicRepository.findOne({
      where: {
        community_id: communityId,
        topic_id: topicId,
        is_active: true,
      },
    });

    if (!association) {
      throw new NotFoundException('Topic is not associated with this community');
    }

    // Soft delete
    association.is_active = false;
    association.updated_by = adminId;
    await this.communityTopicRepository.save(association);

    return { message: 'Topic removed from community successfully' };
  }

  // Poll Management - using PollService
  async getPolls(listQueryDto: ListPollsQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sort_by = 'created_at',
      sort_order = 'DESC',
      poll_status,
      is_featured,
      is_expired,
      user_id,
      expires_from,
      expires_to,
      created_from,
      created_to,
    } = listQueryDto;

    const queryBuilder = this.pollRepository
      .createQueryBuilder('poll')
      .leftJoinAndSelect('poll.user', 'user')
      .leftJoinAndSelect('poll.options', 'options');

    // Search filter
    if (search) {
      queryBuilder.andWhere(
        '(poll.poll_title LIKE :search OR poll.poll_description LIKE :search OR poll.poll_slug LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Status filter
    if (poll_status && poll_status !== 'all') {
      if (poll_status === 'active') {
        queryBuilder.andWhere('poll.poll_status = :status', { status: PollStatus.PUBLISHED });
        queryBuilder.andWhere('poll.poll_expires_at > :now', { now: new Date() });
      } else {
        queryBuilder.andWhere('poll.poll_status = :status', { status: poll_status });
      }
    }

    // Featured filter
    if (is_featured !== undefined) {
      queryBuilder.andWhere('poll.is_featured = :is_featured', { is_featured });
    }

    // Expired filter
    if (is_expired !== undefined) {
      if (is_expired) {
        queryBuilder.andWhere('poll.poll_expires_at < :now', { now: new Date() });
      } else {
        queryBuilder.andWhere('poll.poll_expires_at >= :now', { now: new Date() });
      }
    }

    // User filter
    if (user_id) {
      queryBuilder.andWhere('poll.user_id = :user_id', { user_id });
    }

    // Expiration date range filters
    if (expires_from) {
      queryBuilder.andWhere('poll.poll_expires_at >= :expires_from', {
        expires_from: new Date(expires_from),
      });
    }
    if (expires_to) {
      queryBuilder.andWhere('poll.poll_expires_at <= :expires_to', {
        expires_to: new Date(expires_to),
      });
    }

    // Created date range filters
    if (created_from) {
      queryBuilder.andWhere('poll.created_at >= :created_from', {
        created_from: new Date(created_from),
      });
    }
    if (created_to) {
      queryBuilder.andWhere('poll.created_at <= :created_to', {
        created_to: new Date(created_to),
      });
    }

    // Validate sort_by field
    const allowedSortFields = [
      'id',
      'poll_title',
      'vote_count',
      'view_count',
      'poll_expires_at',
      'created_at',
      'updated_at',
    ];
    const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';

    const skip = (page - 1) * limit;
    queryBuilder
      .orderBy(`poll.${sortField}`, sort_order)
      .skip(skip)
      .take(limit);

    const [polls, total] = await queryBuilder.getManyAndCount();

    // Check and mark expired polls as ended
    const now = new Date();
    const expiredPollsToUpdate: UserPoll[] = [];

    for (const poll of polls) {
      if (
        poll.poll_expires_at &&
        new Date(poll.poll_expires_at) <= now &&
        poll.poll_status !== PollStatus.ENDED
      ) {
        expiredPollsToUpdate.push(poll);
      }
    }

    // Update expired polls in batch
    if (expiredPollsToUpdate.length > 0) {
      await Promise.all(
        expiredPollsToUpdate.map((poll) => {
          poll.poll_status = PollStatus.ENDED;
          return this.pollRepository.save(poll);
        })
      );

      // Update the status in the returned data
      expiredPollsToUpdate.forEach((updatedPoll) => {
        const pollInResult = polls.find((p) => p.id === updatedPoll.id);
        if (pollInResult) {
          pollInResult.poll_status = PollStatus.ENDED;
        }
      });
    }

    return {
      data: polls.map(poll => ({
        ...poll,
        // Format poll_expires_at to match the format used in getPollById
        poll_expires_at: poll.poll_expires_at
          ? this.pollService['convertUtcToLocalString'](new Date(poll.poll_expires_at))
          : null,
      })),
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  async getPollById(pollId: number) {
    // Skip view count increment for admin views
    return this.pollService.getPollById(pollId, undefined, true);
  }

  async createPoll(
    createPollDto: CreatePollDto,
    adminId: number,
  ) {
    // Admin can create polls using the PollService
    return this.pollService.createPoll(createPollDto, adminId);
  }

  async updatePoll(
    pollId: number,
    updatePollDto: UpdatePollDto,
    adminId: number,
  ) {
    // Get the poll first to check if it exists
    const poll = await this.pollRepository.findOne({
      where: { id: pollId },
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    // Admin can update any poll, so we need to bypass ownership check
    // We'll use the repository directly for admin updates

    // Check if slug is being updated and if it already exists
    if (updatePollDto.poll_slug && updatePollDto.poll_slug !== poll.poll_slug) {
      const existingPoll = await this.pollRepository.findOne({
        where: { poll_slug: updatePollDto.poll_slug },
        select: ['id'],
      });

      if (existingPoll) {
        throw new ConflictException('Poll with this slug already exists');
      }
    }

    // Validate expiration date if being updated - must be at least tomorrow
    if (updatePollDto.poll_expires_at) {
      // Parse date string properly (handles datetime-local format from frontend)
      let expiresAt: Date;
      const dateString = updatePollDto.poll_expires_at;
      if (dateString.includes('T') && !dateString.includes('Z') && !dateString.includes('+') && !dateString.includes('-', 10)) {
        // Format: YYYY-MM-DDTHH:mm (datetime-local format)
        // Parse as UTC to match MySQL TIMESTAMP storage (which stores in UTC)
        const [datePart, timePart] = dateString.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        const timeComponents = timePart.split(':');
        const hours = Number(timeComponents[0]) || 0;
        const minutes = Number(timeComponents[1]) || 0;
        const seconds = Number(timeComponents[2]) || 0;
        expiresAt = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds, 0));
      } else {
        expiresAt = new Date(dateString);
      }

      // Get tomorrow at 00:00:00 UTC for consistent comparison
      const now = new Date();
      const tomorrow = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1,
        0, 0, 0, 0
      ));

      if (expiresAt < tomorrow) {
        throw new BadRequestException('Poll expiration date must be at least tomorrow. Polls cannot expire on the same day they are created.');
      }
      poll.poll_expires_at = expiresAt;
    }

    // Convert community_ids array to comma-separated string if provided
    if (updatePollDto.community_ids !== undefined) {
      poll.community_ids = updatePollDto.community_ids.length > 0
        ? updatePollDto.community_ids.join(',')
        : null;
    }

    // Update other fields
    if (updatePollDto.poll_slug !== undefined) {
      poll.poll_slug = updatePollDto.poll_slug;
    }
    if (updatePollDto.poll_title !== undefined) {
      poll.poll_title = updatePollDto.poll_title;
    }
    if (updatePollDto.poll_description !== undefined) {
      poll.poll_description = updatePollDto.poll_description;
    }
    if (updatePollDto.poll_status !== undefined) {
      poll.poll_status = updatePollDto.poll_status;
    }
    if (updatePollDto.is_featured !== undefined) {
      poll.is_featured = updatePollDto.is_featured === 'featured';
    }
    if (updatePollDto.poll_winner_option_id !== undefined) {
      poll.poll_winner_option_id = updatePollDto.poll_winner_option_id;
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
            created_by: adminId,
          });
          optionsToSave.push(newOption);
        }
      }

      // Delete removed options (those present in DB but not in payload)
      const optionsToDelete = existingOptions.filter(o => !keepOptionIds.includes(o.id));
      if (optionsToDelete.length > 0) {
        await this.pollOptionRepository.remove(optionsToDelete);
      }

      // Save updated/new options
      if (optionsToSave.length > 0) {
        await this.pollOptionRepository.save(optionsToSave);
      }
    }

    poll.updated_by = adminId;
    await this.pollRepository.save(poll);

    // Get updated poll using service for proper formatting
    // Skip view count increment for admin views
    return this.pollService.getPollById(pollId, undefined, true);
  }

  async deletePoll(pollId: number, adminId: number) {
    // Get the poll first to check if it exists
    const poll = await this.pollRepository.findOne({
      where: { id: pollId },
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    // Admin can delete any poll - perform hard delete (remove from database)
    // Delete related records first to avoid foreign key constraints

    // Use transaction to ensure all deletions succeed or none
    await this.dataSource.transaction(async (transactionalEntityManager) => {
      // Delete poll comments (including nested replies)
      // Delete all comments for this poll - TypeORM handles nested relationships
      await transactionalEntityManager.delete(PollComment, { poll_id: pollId });

      // Delete poll votes
      await transactionalEntityManager.delete(PollVote, { poll_id: pollId });

      // Delete poll likes
      await transactionalEntityManager.delete(PollLike, { poll_id: pollId });

      // Delete poll options
      await transactionalEntityManager.delete(PollOption, { poll_id: pollId });

      // Finally, delete the poll itself
      await transactionalEntityManager.delete(UserPoll, { id: pollId });
    });

    this.logger.log(`Poll ${pollId} deleted by admin ${adminId}`);
    return { message: 'Poll deleted successfully' };
  }

  // ========== Subscription Management ==========

  async getSubscriptions(listQueryDto: ListSubscriptionsQueryDto) {
    return this.subscriptionService.getSubscriptions(listQueryDto);
  }

  async getSubscriptionById(id: number) {
    return this.subscriptionService.getSubscriptionById(id);
  }

  async createSubscription(
    createSubscriptionDto: CreateSubscriptionDto,
    adminId: number,
  ) {
    return this.subscriptionService.createSubscription(createSubscriptionDto, adminId);
  }

  async updateSubscription(
    id: number,
    updateSubscriptionDto: UpdateSubscriptionDto,
    adminId: number,
  ) {
    return this.subscriptionService.updateSubscription(id, updateSubscriptionDto, adminId);
  }

  async deleteSubscription(id: number, adminId: number) {
    return this.subscriptionService.deleteSubscription(id, adminId);
  }

  // ========== User Subscription Management ==========

  async getUserSubscriptions(listQueryDto: ListUserSubscriptionsQueryDto) {
    return this.subscriptionService.getUserSubscriptions(listQueryDto);
  }

  async getUserSubscriptionById(id: number) {
    return this.subscriptionService.getUserSubscriptionById(id);
  }

  async updateUserSubscriptionStatus(
    id: number,
    status: SubscriptionStatus,
    adminId: number,
  ) {
    return this.subscriptionService.updateUserSubscriptionStatus(id, status, adminId);
  }

  // ========== Payment Management ==========

  async getPayments(listQueryDto: ListPaymentsQueryDto) {
    return this.subscriptionService.getPayments(listQueryDto);
  }

  async getPaymentById(id: number) {
    return this.subscriptionService.getPaymentById(id);
  }

  async createPayment(createPaymentDto: CreatePaymentDto, adminId: number) {
    return this.subscriptionService.createPayment(createPaymentDto, adminId);
  }

  async updatePaymentStatus(id: number, status: PaymentStatus, adminId: number) {
    return this.subscriptionService.updatePaymentStatus(id, status, adminId);
  }

  // ========== Detail Modal Endpoints ==========

  async getUserPosts(userId: number, listQueryDto: ListQueryDto) {
    const { page = 1, limit = 10, search, sort_by = 'created_at', sort_order = 'DESC' } = listQueryDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.topic', 'topic')
      .where('post.user_id = :userId', { userId });

    if (search) {
      queryBuilder.andWhere(
        '(post.post_title LIKE :search OR post.post_content LIKE :search)',
        { search: `%${search}%` },
      );
    }

    const allowedSortFields = ['id', 'post_title', 'like_count', 'comment_count', 'view_count', 'created_at', 'updated_at'];
    const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';

    queryBuilder.orderBy(`post.${sortField}`, sort_order).skip(skip).take(limit);

    const [posts, total] = await queryBuilder.getManyAndCount();

    return {
      data: posts,
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  async getUserCommunities(userId: number, listQueryDto: ListQueryDto) {
    const { page = 1, limit = 10, search, sort_by = 'created_at', sort_order = 'DESC' } = listQueryDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.communityUserRepository
      .createQueryBuilder('cu')
      .leftJoinAndSelect('cu.community', 'community')
      .where('cu.user_id = :userId', { userId })
      .andWhere('cu.is_active = :isActive', { isActive: true });

    if (search) {
      queryBuilder.andWhere(
        '(community.community_name LIKE :search OR community.community_slug LIKE :search)',
        { search: `%${search}%` },
      );
    }

    const allowedSortFields = ['id', 'created_at', 'updated_at'];
    const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';

    queryBuilder.orderBy(`cu.${sortField}`, sort_order).skip(skip).take(limit);

    const [memberships, total] = await queryBuilder.getManyAndCount();

    return {
      data: memberships.map((m) => ({
        ...m.community,
        role: m.role,
        joined_at: m.created_at,
      })),
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  async getUserComments(userId: number, listQueryDto: ListQueryDto) {
    const { page = 1, limit = 10, search, sort_by = 'created_at', sort_order = 'DESC' } = listQueryDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.post', 'post')
      .where('comment.user_id = :userId', { userId });

    if (search) {
      queryBuilder.andWhere('comment.comment_content LIKE :search', {
        search: `%${search}%`,
      });
    }

    const allowedSortFields = ['id', 'like_count', 'created_at', 'updated_at'];
    const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';

    queryBuilder.orderBy(`comment.${sortField}`, sort_order).skip(skip).take(limit);

    const [comments, total] = await queryBuilder.getManyAndCount();

    // Map to DTOs
    const mappedData = await Promise.all(
      comments.map(async (comment) => {
        const repliesCount = await this.commentRepository.count({
          where: { parent_comment_id: comment.id },
        });
        const commentWithExtras = { ...comment, replies_count: repliesCount };
        return this.commentService.mapPostCommentToResponseDto(commentWithExtras);
      }),
    );

    return {
      data: mappedData,
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  async getUserStats(userId: number) {
    const postsCount = await this.postRepository.count({ where: { user_id: userId } });
    const commentsCount = await this.commentRepository.count({ where: { user_id: userId } });
    const communitiesCount = await this.communityUserRepository.count({
      where: { user_id: userId, is_active: true },
    });
    const pollsCount = await this.pollRepository.count({ where: { user_id: userId } });

    return {
      posts_count: postsCount,
      comments_count: commentsCount,
      communities_count: communitiesCount,
      polls_count: pollsCount,
    };
  }

  async getPostComments(postId: number, listQueryDto: ListQueryDto) {
    const { page = 1, limit = 10, search, sort_by = 'created_at', sort_order = 'DESC' } = listQueryDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .where('comment.post_id = :postId', { postId })
      .andWhere('comment.parent_comment_id IS NULL'); // Top-level comments only

    if (search) {
      queryBuilder.andWhere('comment.comment_content LIKE :search', {
        search: `%${search}%`,
      });
    }

    const allowedSortFields = ['id', 'like_count', 'created_at', 'updated_at'];
    const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';

    queryBuilder.orderBy(`comment.${sortField}`, sort_order).skip(skip).take(limit);

    const [comments, total] = await queryBuilder.getManyAndCount();

    // Get unique user IDs
    const userIds = new Set<number>();
    comments.forEach((comment) => {
      if (comment.user_id) userIds.add(comment.user_id);
    });

    // Load user profiles in batch
    const userProfilesMap = new Map<number, any>();
    if (userIds.size > 0) {
      const profiles = await this.profileRepository.find({
        where: { user_id: In(Array.from(userIds)) },
        select: ['user_id', 'full_name', 'profile_picture'],
      });
      profiles.forEach((profile) => {
        userProfilesMap.set(profile.user_id, profile);
      });
    }

    // Add replies for each comment (using common mapping)
    const mappedData = await Promise.all(
      comments.map(async (comment) => {
        const replies = await this.commentRepository.find({
          where: { parent_comment_id: comment.id },
          relations: ['user'],
          order: { created_at: 'ASC' },
        });

        // Load profiles for replies too
        const replyUserIds = replies.map(r => r.user_id).filter(id => !userProfilesMap.has(id));
        if (replyUserIds.length > 0) {
          const replyProfiles = await this.profileRepository.find({
            where: { user_id: In(replyUserIds) },
            select: ['user_id', 'full_name', 'profile_picture'],
          });
          replyProfiles.forEach(p => userProfilesMap.set(p.user_id, p));
        }

        const commentWithReplies: any = {
          ...comment,
          replies,
          replies_count: replies.length,
        };

        // Attach profile to comment user
        if (commentWithReplies.user && userProfilesMap.has(commentWithReplies.user.id)) {
          const p = userProfilesMap.get(commentWithReplies.user.id);
          commentWithReplies.user.profile_picture = p.profile_picture || null;
          commentWithReplies.user.full_name = p.full_name || null;
        }

        // Attach profiles to reply users
        commentWithReplies.replies.forEach((r: any) => {
          if (r.user && userProfilesMap.has(r.user.id)) {
            const p = userProfilesMap.get(r.user.id);
            r.user.profile_picture = p.profile_picture || null;
            r.user.full_name = p.full_name || null;
          }
        });

        return this.commentService.mapPostCommentToResponseDto(commentWithReplies);
      }),
    );

    return {
      data: mappedData,
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  async getPostAnalytics(postId: number, timeRange?: string) {
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Calculate engagement rate
    const totalInteractions = post.like_count + post.comment_count;
    const engagementRate = post.view_count > 0 ? (totalInteractions / post.view_count) * 100 : 0;

    // Calculate trending score (based on recent activity)
    const recentComments = await this.commentRepository.count({
      where: {
        post_id: postId,
        created_at: MoreThan(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
      },
    });
    const trendingScore = (post.like_count * 0.4 + recentComments * 0.6) / (post.view_count || 1) * 100;

    return {
      engagement_rate: engagementRate,
      trending_score: trendingScore,
      total_interactions: totalInteractions,
      recent_comments: recentComments,
    };
  }

  async getCommunityPosts(communityId: number, listQueryDto: ListQueryDto) {
    const { page = 1, limit = 10, search, sort_by = 'created_at', sort_order = 'DESC' } = listQueryDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .leftJoinAndSelect('post.topic', 'topic')
      .where('post.community_ids LIKE :communityId', {
        communityId: `%${communityId}%`,
      });

    if (search) {
      queryBuilder.andWhere(
        '(post.post_title LIKE :search OR post.post_content LIKE :search)',
        { search: `%${search}%` },
      );
    }

    const allowedSortFields = ['id', 'post_title', 'like_count', 'comment_count', 'view_count', 'created_at', 'updated_at'];
    const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';

    queryBuilder.orderBy(`post.${sortField}`, sort_order).skip(skip).take(limit);

    const [posts, total] = await queryBuilder.getManyAndCount();

    return {
      data: posts,
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  async getCommunityActivity(communityId: number, listQueryDto: ListQueryDto) {
    const { page = 1, limit = 20 } = listQueryDto;
    const skip = (page - 1) * limit;

    // Get recent posts
    const recentPosts = await this.postRepository.find({
      where: {
        community_ids: Like(`%${communityId}%`),
      },
      take: limit,
      order: { created_at: 'DESC' },
      relations: ['user'],
    });

    // Get recent comments on community posts
    const recentComments = await this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.post', 'post')
      .leftJoinAndSelect('comment.user', 'user')
      .where('post.community_ids LIKE :communityId', { communityId: `%${communityId}%` })
      .orderBy('comment.created_at', 'DESC')
      .take(limit)
      .getMany();

    const activities = [
      ...recentPosts.map((p) => ({
        type: 'post',
        id: p.id,
        title: p.post_title,
        user: { id: p.user?.id, username: p.user?.username },
        created_at: p.created_at,
      })),
      ...recentComments.map((c) => ({
        type: 'comment',
        id: c.id,
        content: c.comment_content.substring(0, 50),
        user: { id: c.user?.id, username: c.user?.username },
        post_id: c.post_id,
        created_at: c.created_at,
      })),
    ]
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      .slice(skip, skip + limit);

    return {
      data: activities,
      meta: {
        total: activities.length,
        page,
        limit,
        total_pages: Math.ceil(activities.length / limit),
      },
    };
  }

  async getCommunityStats(communityId: number) {
    const postsCount = await this.postRepository
      .createQueryBuilder('post')
      .where('post.community_ids LIKE :communityId', { communityId: `%${communityId}%` })
      .getCount();
    const topicsCount = await this.communityTopicRepository.count({
      where: { community_id: communityId, is_active: true },
    });
    const membersCount = await this.communityUserRepository.count({
      where: { community_id: communityId, is_active: true },
    });

    return {
      posts_count: postsCount,
      topics_count: topicsCount,
      members_count: membersCount,
    };
  }

  async getTopicPosts(topicId: number, listQueryDto: ListQueryDto) {
    const { page = 1, limit = 10, search, sort_by = 'created_at', sort_order = 'DESC' } = listQueryDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .where('post.post_topic_id = :topicId', { topicId });

    if (search) {
      queryBuilder.andWhere(
        '(post.post_title LIKE :search OR post.post_content LIKE :search)',
        { search: `%${search}%` },
      );
    }

    const allowedSortFields = ['id', 'post_title', 'like_count', 'comment_count', 'view_count', 'created_at', 'updated_at'];
    const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';

    queryBuilder.orderBy(`post.${sortField}`, sort_order).skip(skip).take(limit);

    const [posts, total] = await queryBuilder.getManyAndCount();

    return {
      data: posts,
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  async getTopicCommunities(topicId: number, listQueryDto: ListQueryDto) {
    const { page = 1, limit = 10, search, sort_by = 'created_at', sort_order = 'DESC' } = listQueryDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.communityTopicRepository
      .createQueryBuilder('ct')
      .leftJoinAndSelect('ct.community', 'community')
      .where('ct.topic_id = :topicId', { topicId })
      .andWhere('ct.is_active = :isActive', { isActive: true });

    if (search) {
      queryBuilder.andWhere(
        '(community.community_name LIKE :search OR community.community_slug LIKE :search)',
        { search: `%${search}%` },
      );
    }

    const allowedSortFields = ['id', 'created_at', 'updated_at'];
    const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';

    queryBuilder.orderBy(`ct.${sortField}`, sort_order).skip(skip).take(limit);

    const [associations, total] = await queryBuilder.getManyAndCount();

    return {
      data: associations.map((a) => a.community),
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  async getTopicStats(topicId: number) {
    const postsCount = await this.postRepository.count({
      where: { post_topic_id: topicId, post_status: PostStatus.PUBLISHED },
    });
    const communitiesCount = await this.communityTopicRepository.count({
      where: { topic_id: topicId, is_active: true },
    });

    return {
      posts_count: postsCount,
      communities_count: communitiesCount,
      usage_count: postsCount + communitiesCount,
    };
  }

  async getPollAnalytics(pollId: number) {
    const poll = await this.pollRepository.findOne({
      where: { id: pollId },
      relations: ['options'],
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    const totalVotes = poll.vote_count;
    const engagementRate = poll.view_count > 0 ? (totalVotes / poll.view_count) * 100 : 0;

    return {
      total_votes: totalVotes,
      engagement_rate: engagementRate,
      options: poll.options.map((opt) => ({
        id: opt.id,
        option_text: opt.option_text,
        vote_count: opt.vote_count,
        percentage: totalVotes > 0 ? (opt.vote_count / totalVotes) * 100 : 0,
      })),
    };
  }

  async getPollVotes(pollId: number, listQueryDto: ListQueryDto) {
    const { page = 1, limit = 50 } = listQueryDto;
    const skip = (page - 1) * limit;

    // Note: This requires poll_votes table which should exist
    const votes = await this.dataSource.query(
      `
      SELECT 
        pv.id,
        pv.user_id,
        pv.vote_option_id,
        pv.created_at,
        u.username,
        u.email,
        po.option_text
      FROM poll_votes pv
      LEFT JOIN users u ON pv.user_id = u.id
      LEFT JOIN poll_options po ON pv.vote_option_id = po.id
      WHERE pv.poll_id = ?
      ORDER BY pv.created_at DESC
      LIMIT ? OFFSET ?
    `,
      [pollId, limit, skip],
    );

    const total = await this.dataSource.query(
      'SELECT COUNT(*) as count FROM poll_votes WHERE poll_id = ?',
      [pollId],
    );

    return {
      data: votes,
      meta: {
        total: parseInt(total[0]?.count || '0'),
        page,
        limit,
        total_pages: Math.ceil(parseInt(total[0]?.count || '0') / limit),
      },
    };
  }

  // ========== Bulk Operations ==========

  async bulkUpdateUsers(bulkUpdateDto: BulkUpdateDto, adminId: number) {
    const { ids, updates } = bulkUpdateDto;

    if (ids.length === 0) {
      throw new BadRequestException('At least one user ID is required');
    }

    // Prevent admin from updating themselves
    if (updates.is_active === false && ids.includes(adminId)) {
      throw new BadRequestException('Cannot deactivate your own account');
    }

    // Prevent updating admin roles
    const adminUsers = await this.userRepository.find({
      where: { id: In(ids), role: In([UserRole.ADMIN, UserRole.SUB_ADMIN]) },
      select: ['id'],
    });

    if (adminUsers.length > 0 && updates.role) {
      throw new BadRequestException('Cannot change role of admin accounts');
    }

    await this.userRepository.update({ id: In(ids) }, { ...updates, updated_by: adminId });

    return {
      message: `Successfully updated ${ids.length} user(s)`,
      updated_count: ids.length,
    };
  }

  async bulkUpdatePosts(bulkUpdateDto: BulkUpdateDto, adminId: number) {
    const { ids, updates } = bulkUpdateDto;

    if (ids.length === 0) {
      throw new BadRequestException('At least one post ID is required');
    }

    await this.postRepository.update({ id: In(ids) }, { ...updates, updated_by: adminId });

    return {
      message: `Successfully updated ${ids.length} post(s)`,
      updated_count: ids.length,
    };
  }

  async bulkApproveComments(bulkUpdateDto: BulkUpdateDto, adminId: number) {
    const { ids, updates } = bulkUpdateDto;

    if (ids.length === 0) {
      throw new BadRequestException('At least one comment ID is required');
    }

    await this.commentRepository.update({ id: In(ids) }, { ...updates, updated_by: adminId });

    return {
      message: `Successfully updated ${ids.length} comment(s)`,
      updated_count: ids.length,
    };
  }

  async bulkUpdateCommunities(bulkUpdateDto: BulkUpdateDto, adminId: number) {
    const { ids, updates } = bulkUpdateDto;

    if (ids.length === 0) {
      throw new BadRequestException('At least one community ID is required');
    }

    await this.communityRepository.update({ id: In(ids) }, { ...updates, updated_by: adminId });

    return {
      message: `Successfully updated ${ids.length} community(ies)`,
      updated_count: ids.length,
    };
  }

  async bulkUpdateTopics(bulkUpdateDto: BulkUpdateDto, adminId: number) {
    const { ids, updates } = bulkUpdateDto;

    if (ids.length === 0) {
      throw new BadRequestException('At least one topic ID is required');
    }

    await this.topicEntityRepository.update({ id: In(ids) }, { ...updates, updated_by: adminId });

    return {
      message: `Successfully updated ${ids.length} topic(s)`,
      updated_count: ids.length,
    };
  }

  // ========== Export Functionality ==========

  async exportUsers(listQueryDto: ListUsersQueryDto) {
    const queryBuilder = this.getUsersQueryBuilder(listQueryDto);

    const sortBy = listQueryDto.sort_by || 'created_at';
    const usersRaw = await queryBuilder
      .orderBy(`user.${this.getUserSortField(sortBy)}`, listQueryDto.sort_order || 'DESC')
      .select([
        'user.id',
        'user.username',
        'user.email',
        'user.role',
        'user.auth_type',
        'user.is_active',
        'user.is_verified',
        'user.created_at',
        'user.updated_at',
        'profile.full_name',
        'profile.profile_picture',
        'profile.tagline',
        'profile.profile_bio',
        'profile.profile_location',
        'profile.profile_website',
      ])
      .getRawMany();

    return {
      data: usersRaw.map((row: any) => ({
        id: row.user_id,
        username: row.user_username,
        email: row.user_email,
        role: row.user_role,
        auth_type: row.user_auth_type,
        is_active: Boolean(row.user_is_active),
        is_verified: Boolean(row.user_is_verified),
        created_at: row.user_created_at,
        updated_at: row.user_updated_at,
        profile: {
          full_name: row.profile_full_name || null,
          profile_picture: row.profile_profile_picture || null,
          tagline: row.profile_tagline || null,
          bio: row.profile_profile_bio || null,
          location: row.profile_profile_location || null,
          website: row.profile_profile_website || null,
        },
      })),
    };
  }

  async exportPosts(listQueryDto: ListPostsQueryDto) {
    const {
      search,
      post_status,
      is_featured,
      user_id,
      topic_id,
      created_from,
      created_to,
      sort_by = 'created_at',
      sort_order = 'DESC',
    } = listQueryDto;

    const queryBuilder = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .leftJoinAndSelect('post.topic', 'topic');

    if (search) {
      queryBuilder.andWhere(
        '(post.post_title LIKE :search OR post.post_content LIKE :search)',
        { search: `%${search}%` },
      );
    }
    if (post_status && post_status !== 'all') {
      queryBuilder.andWhere('post.post_status = :post_status', { post_status });
    }
    if (is_featured !== undefined) {
      queryBuilder.andWhere('post.is_featured = :is_featured', {
        is_featured: is_featured === true ? 1 : 0
      });
    }
    if (user_id) {
      queryBuilder.andWhere('post.user_id = :user_id', { user_id });
    }
    if (topic_id) {
      queryBuilder.andWhere('post.post_topic_id = :topic_id', { topic_id });
    }
    if (created_from) {
      queryBuilder.andWhere('post.created_at >= :created_from', {
        created_from: new Date(created_from),
      });
    }
    if (created_to) {
      queryBuilder.andWhere('post.created_at <= :created_to', {
        created_to: new Date(created_to),
      });
    }

    const posts = await queryBuilder
      .orderBy(`post.${sort_by}`, sort_order)
      .getMany();

    const sanitizedPosts = posts.map(post => ({
      id: post.id,
      title: post.post_title,
      slug: post.post_slug,
      content: post.post_content ? post.post_content.substring(0, 100) + '...' : '',
      author: post.user ? (post.user.username || 'Unknown') : 'Unknown',
      topic: post.topic ? (post.topic.topic_name || 'Uncategorized') : 'Uncategorized',
      status: post.post_status,
      views: post.view_count || 0,
      likes: post.like_count || 0,
      comments: post.comment_count || 0,
      is_featured: post.is_featured ? 'Yes' : 'No',
      created_at: post.created_at,
    }));

    return { data: sanitizedPosts };
  }

  async exportComments(listQueryDto: ListCommentsQueryDto) {
    const {
      search,
      is_approved,
      post_id,
      user_id,
      created_from,
      created_to,
      sort_by = 'created_at',
      sort_order = 'DESC',
    } = listQueryDto;

    const queryBuilder = this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .leftJoinAndSelect('comment.post', 'post');

    if (search) {
      queryBuilder.andWhere('comment.comment_content LIKE :search', {
        search: `%${search}%`,
      });
    }
    if (is_approved !== undefined) {
      const approvedValue = is_approved === ApprovedStatus.APPROVED ? true : (is_approved === ApprovedStatus.NOT_APPROVED ? false : undefined);
      if (approvedValue !== undefined) {
        queryBuilder.andWhere('comment.is_approved = :is_approved', { is_approved: approvedValue });
      }
    }
    if (post_id) {
      queryBuilder.andWhere('comment.post_id = :post_id', { post_id });
    }
    if (user_id) {
      queryBuilder.andWhere('comment.user_id = :user_id', { user_id });
    }
    if (created_from) {
      queryBuilder.andWhere('comment.created_at >= :created_from', {
        created_from: new Date(created_from),
      });
    }
    if (created_to) {
      queryBuilder.andWhere('comment.created_at <= :created_to', {
        created_to: new Date(created_to),
      });
    }

    const comments = await queryBuilder
      .orderBy(`comment.${sort_by}`, sort_order)
      .getMany();

    const sanitizedComments = comments.map(comment => ({
      id: comment.id,
      content: comment.comment_content,
      author: comment.user ? (comment.user.username || 'Unknown') : 'Unknown',
      post_title: comment.post ? (comment.post.post_title || 'Unknown Post') : 'Unknown Post',
      status: comment.is_approved ? 'Approved' : 'Pending',
      created_at: comment.created_at,
    }));

    return { data: sanitizedComments };
  }

  async exportCommunities(listQueryDto: ListCommunitiesQueryDto) {
    const {
      search,
      is_active,
      sort_by = 'created_at',
      sort_order = 'DESC',
    } = listQueryDto;

    const queryBuilder = this.communityRepository.createQueryBuilder('community');

    if (search) {
      queryBuilder.andWhere(
        '(community.community_name LIKE :search OR community.community_description LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (is_active !== undefined) {
      queryBuilder.andWhere('community.is_active = :is_active', { is_active });
    }

    const communities = await queryBuilder
      .orderBy(`community.${sort_by}`, sort_order)
      .getMany();

    const sanitizedCommunities = communities.map(community => ({
      id: community.id,
      name: community.community_name,
      slug: community.community_slug,
      description: community.community_description,
      is_active: community.is_active ? 'Active' : 'Inactive',
      created_at: community.created_at,
    }));

    return { data: sanitizedCommunities };
  }

  async exportTopics(listQueryDto: ListTopicsQueryDto) {
    const {
      search,
      is_active,
      parent_id,
      sort_by = 'created_at',
      sort_order = 'DESC',
    } = listQueryDto;

    const queryBuilder = this.topicEntityRepository.createQueryBuilder('topic');

    if (search) {
      queryBuilder.andWhere(
        '(topic.topic_name LIKE :search OR topic.topic_description LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (is_active !== undefined) {
      queryBuilder.andWhere('topic.is_active = :is_active', { is_active });
    }

    if (parent_id !== undefined) {
      queryBuilder.andWhere('topic.parent_id = :parent_id', { parent_id });
    }

    const topics = await queryBuilder
      .orderBy(`topic.${sort_by}`, sort_order)
      .getMany();

    const sanitizedTopics = topics.map(topic => ({
      id: topic.id,
      name: topic.topic_name,
      slug: topic.topic_slug,
      description: topic.topic_description,
      is_active: topic.is_active ? 'Active' : 'Inactive',
      created_at: topic.created_at,
    }));

    return { data: sanitizedTopics };
  }

  async exportPolls(listQueryDto: ListPollsQueryDto) {
    const {
      search,
      poll_status,
      user_id,
      created_from,
      created_to,
      sort_by = 'created_at',
      sort_order = 'DESC',
    } = listQueryDto;

    const queryBuilder = this.pollRepository
      .createQueryBuilder('poll')
      .leftJoinAndSelect('poll.user', 'user');

    if (search) {
      queryBuilder.andWhere(
        '(poll.poll_title LIKE :search OR poll.poll_description LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (poll_status && poll_status !== 'all') {
      queryBuilder.andWhere('poll.poll_status = :poll_status', { poll_status });
    }

    if (user_id) {
      queryBuilder.andWhere('poll.user_id = :user_id', { user_id });
    }

    if (created_from) {
      queryBuilder.andWhere('poll.created_at >= :created_from', {
        created_from: new Date(created_from),
      });
    }

    if (created_to) {
      queryBuilder.andWhere('poll.created_at <= :created_to', {
        created_to: new Date(created_to),
      });
    }

    const polls = await queryBuilder
      .orderBy(`poll.${sort_by}`, sort_order)
      .getMany();

    const sanitizedPolls = polls.map(poll => ({
      id: poll.id,
      question: poll.poll_title,
      created_by: poll.user ? (poll.user.username || 'Unknown') : 'Unknown',
      status: poll.poll_status,
      vote_count: poll.vote_count || 0,
      expires_at: poll.poll_expires_at,
      is_featured: poll.is_featured ? 'Yes' : 'No',
      created_at: poll.created_at,
    }));

    return { data: sanitizedPolls };
  }

  async exportSubscriptions(listQueryDto: ListSubscriptionsQueryDto) {
    const {
      search,
      subscription_type,
      is_active,
      sort_by = 'created_at',
      sort_order = 'DESC',
    } = listQueryDto;

    const queryBuilder = this.subscriptionRepository.createQueryBuilder('subscription');

    if (subscription_type) {
      queryBuilder.andWhere('subscription.subscription_type = :subscription_type', {
        subscription_type,
      });
    }

    if (is_active !== undefined) {
      const activeValue = is_active === ActiveStatus.ACTIVE;
      queryBuilder.andWhere('subscription.is_active = :is_active', { is_active: activeValue });
    }

    if (search) {
      queryBuilder.andWhere(
        '(subscription.subscription_name LIKE :search OR subscription.subscription_description LIKE :search)',
        { search: `%${search}%` },
      );
    }

    queryBuilder.orderBy(`subscription.${sort_by}`, sort_order);

    const subscriptions = await queryBuilder.getMany();

    const sanitizedSubscriptions = subscriptions.map(sub => ({
      id: sub.id,
      name: sub.subscription_name,
      type: sub.subscription_type,
      price: sub.subscription_price,
      duration: `${sub.subscription_duration} ${sub.subscription_duration_type}`,
      is_active: sub.is_active ? 'Active' : 'Inactive',
      created_at: sub.created_at,
    }));

    return { data: sanitizedSubscriptions };
  }

  async exportPayments(listQueryDto: ListPaymentsQueryDto) {
    const {
      search,
      payment_status,
      payment_method,
      user_id,
      users_subscriptions_id,
      sort_by = 'created_at',
      sort_order = 'DESC',
    } = listQueryDto;

    const queryBuilder = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.user', 'user')
      .leftJoinAndSelect('payment.user_subscription', 'user_subscription')
      .leftJoinAndSelect('user_subscription.subscription', 'subscription');

    if (user_id) {
      queryBuilder.andWhere('payment.user_id = :user_id', { user_id });
    }

    if (users_subscriptions_id) {
      queryBuilder.andWhere('payment.users_subscriptions_id = :users_subscriptions_id', {
        users_subscriptions_id,
      });
    }

    if (payment_status) {
      queryBuilder.andWhere('payment.payment_status = :payment_status', { payment_status });
    }

    if (payment_method) {
      queryBuilder.andWhere('payment.payment_method = :payment_method', { payment_method });
    }

    if (search) {
      queryBuilder.andWhere(
        '(payment.payment_reference LIKE :search OR payment.payment_note LIKE :search)',
        { search: `%${search}%` },
      );
    }

    queryBuilder.orderBy(`payment.${sort_by}`, sort_order);

    const payments = await queryBuilder.getMany();

    const sanitizedPayments = payments.map(payment => ({
      id: payment.id,
      transaction_id: payment.payment_transaction_id,
      amount: payment.payment_amount,
      currency: payment.payment_currency,
      user_name: payment.user ? (payment.user.username || payment.user.email) : 'Unknown',
      subscription_plan: payment.user_subscription?.subscription?.subscription_name || 'Unknown',
      status: payment.payment_status,
      method: payment.payment_method,
      gateway: payment.payment_gateway,
      created_at: payment.created_at,
    }));

    return { data: sanitizedPayments };
  }

  // ========== Enhanced Detail Endpoints ==========

  async getPostByIdEnhanced(postId: number) {
    // Skip view count increment for admin views
    const post = await this.postService.getPostById(postId, undefined, true);

    // Parse tags
    const postTags = post.post_tags ? post.post_tags.split(',').filter(Boolean) : [];

    // Parse community IDs
    const communityIds = post.community_ids ? post.community_ids.split(',').filter(Boolean).map(Number) : [];
    const communities = await Promise.all(
      communityIds.map(async (id) => {
        const community = await this.communityRepository.findOne({
          where: { id },
          select: ['id', 'community_name', 'community_slug'],
        });
        return community;
      }),
    );

    // Calculate engagement metrics
    const totalInteractions = post.like_count + post.comment_count;
    const engagementRate = post.view_count > 0 ? (totalInteractions / post.view_count) * 100 : 0;

    // Calculate trending score
    const recentComments = await this.commentRepository.count({
      where: {
        post_id: postId,
        created_at: MoreThan(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
      },
    });
    const trendingScore = (post.like_count * 0.4 + recentComments * 0.6) / (post.view_count || 1) * 100;

    return {
      ...post,
      post_tags: postTags,
      communities: communities.filter(Boolean),
      engagement_rate: engagementRate,
      trending_score: trendingScore,
    };
  }

  async getTopicByIdEnhanced(topicId: number) {
    const topic = await this.generalService.getTopicById(topicId);

    const postsCount = await this.postRepository.count({
      where: { post_topic_id: topicId, post_status: PostStatus.PUBLISHED },
    });
    const communitiesCount = await this.communityTopicRepository.count({
      where: { topic_id: topicId, is_active: true },
    });

    return {
      ...topic,
      posts_count: postsCount,
      communities_count: communitiesCount,
      usage_count: postsCount + communitiesCount,
    };
  }



  async getCommentByIdEnhanced(commentId: number) {
    const comment = await this.commentService.getCommentById(commentId);

    const replies = await this.commentRepository.find({
      where: { parent_comment_id: commentId },
      relations: ['user', 'post'],
      order: { created_at: 'ASC' },
    });

    return {
      ...comment,
      replies,
      replies_count: replies.length,
    };
  }



  async getCommunityByIdEnhanced(communityId: number) {
    const community = await this.communityService.getCommunityById(communityId);

    const postsCount = await this.postRepository
      .createQueryBuilder('post')
      .where('(FIND_IN_SET(:communityId, post.community_ids) > 0 OR post.community_ids = :communityIdStr)', {
        communityId,
        communityIdStr: communityId.toString()
      })
      .getCount();

    // Calculate posts per day based on last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const last30DaysPosts = await this.postRepository
      .createQueryBuilder('post')
      .where('(FIND_IN_SET(:communityId, post.community_ids) > 0 OR post.community_ids = :communityIdStr)', {
        communityId,
        communityIdStr: communityId.toString()
      })
      .andWhere('post.created_at >= :thirtyDaysAgo', { thirtyDaysAgo })
      .getCount();

    const postsPerDay = parseFloat((last30DaysPosts / 30).toFixed(2));

    const topicsCount = await this.communityTopicRepository.count({
      where: { community_id: communityId, is_active: true },
    });
    const membersCount = await this.communityUserRepository.count({
      where: { community_id: communityId, is_active: true },
    });

    return {
      ...community,
      posts_count: postsCount,
      topics_count: topicsCount,
      members_count: membersCount,
      posts_per_day: postsPerDay,
    };
  }

  async getPollByIdEnhanced(pollId: number) {
    // Skip view count increment for admin views
    const poll = await this.pollService.getPollById(pollId, undefined, true);

    // Check and mark expired poll as ended
    const pollEntity = await this.pollRepository.findOne({
      where: { id: pollId },
    });

    if (pollEntity) {
      const now = new Date();
      if (
        pollEntity.poll_expires_at &&
        new Date(pollEntity.poll_expires_at) <= now &&
        pollEntity.poll_status !== PollStatus.ENDED
      ) {
        pollEntity.poll_status = PollStatus.ENDED;
        await this.pollRepository.save(pollEntity);
        // Update the response object
        poll.poll_status = PollStatus.ENDED;
      }
    }

    const totalVotes = poll.vote_count;
    const engagementRate = poll.view_count > 0 ? (totalVotes / poll.view_count) * 100 : 0;

    return {
      ...poll,
      total_votes: totalVotes,
      engagement_rate: engagementRate,
    };
  }

  async search(searchQueryDto: SearchQueryDto) {
    const { q, limit = 5 } = searchQueryDto;
    const term = q?.trim();

    if (!term) {
      return {
        users: [],
        posts: [],
        communities: [],
        topics: [],
        meta: {
          users: { count: 0 },
          posts: { count: 0 },
          communities: { count: 0 },
          topics: { count: 0 },
        },
      };
    }

    const effectiveLimit = Math.min(Math.max(limit || 5, 1), 20);
    // Use LOWER for case-insensitive search (MySQL LIKE is case-insensitive by default, but this ensures it)
    const searchLike = `%${term}%`;

    // Enhanced search queries with more fields
    // Note: MySQL LIKE is case-insensitive by default, but using LOWER ensures it works across all configurations
    const userWhere =
      '(LOWER(user.username) LIKE LOWER(:search) OR LOWER(user.email) LIKE LOWER(:search) OR LOWER(COALESCE(profile.full_name, "")) LIKE LOWER(:search))';
    const postWhere =
      '(LOWER(post.post_title) LIKE LOWER(:search) OR LOWER(post.post_content) LIKE LOWER(:search) OR LOWER(post.post_slug) LIKE LOWER(:search) OR LOWER(COALESCE(post.post_tags, "")) LIKE LOWER(:search))';
    const communityWhere =
      '(LOWER(community.community_name) LIKE LOWER(:search) OR LOWER(community.community_slug) LIKE LOWER(:search) OR LOWER(COALESCE(community.community_description, "")) LIKE LOWER(:search))';
    const topicWhere =
      '(LOWER(topic.topic_name) LIKE LOWER(:search) OR LOWER(topic.topic_slug) LIKE LOWER(:search) OR LOWER(COALESCE(topic.topic_description, "")) LIKE LOWER(:search))';

    const userQuery = this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user_profile', 'profile', 'profile.user_id = user.id')
      .select([
        'user.id AS id',
        'COALESCE(profile.full_name, user.username) AS name',
        "CONCAT('@', user.username) AS handle",
        'profile.profile_picture AS avatar',
        'user.role AS role',
      ])
      .where(userWhere, { search: searchLike })
      .orderBy('user.username', 'ASC')
      .limit(effectiveLimit);

    const postQuery = this.postRepository
      .createQueryBuilder('post')
      .leftJoin(User, 'user', 'user.id = post.user_id')
      .leftJoin('user_profile', 'profile', 'profile.user_id = user.id')
      .select([
        'post.id AS id',
        'post.post_title AS title',
        'post.post_slug AS slug',
        'post.post_status AS status',
        'post.view_count AS view_count',
        'post.like_count AS like_count',
        'post.comment_count AS comment_count',
        'post.created_at AS created_at',
        'post.post_image AS post_image',
        'post.post_video AS post_video',
        'post.post_audio AS post_audio',
        'user.id AS user_id',
        'COALESCE(profile.full_name, user.username) AS user_name',
        "CONCAT('@', user.username) AS user_handle",
      ])
      .where(postWhere, { search: searchLike })
      .andWhere('post.post_status IN (:...statuses)', {
        statuses: [PostStatus.PUBLISHED, PostStatus.DRAFT],
      })
      .orderBy('post.created_at', 'DESC')
      .limit(effectiveLimit);

    const communityQuery = this.communityRepository
      .createQueryBuilder('community')
      .leftJoin(
        CommunityUser,
        'cu',
        'cu.community_id = community.id AND cu.is_active = :isActive',
        { isActive: true },
      )
      .select([
        'community.id AS id',
        'community.community_name AS name',
        'community.community_slug AS slug',
        'community.community_image AS community_image',
        'COUNT(cu.id) AS member_count',
      ])
      .where(communityWhere, { search: searchLike })
      .groupBy('community.id')
      .orderBy('member_count', 'DESC')
      .limit(effectiveLimit);

    const topicQuery = this.topicEntityRepository
      .createQueryBuilder('topic')
      .leftJoin(
        UserPost,
        'post',
        'post.post_topic_id = topic.id AND post.post_status = :postStatus',
        { postStatus: PostStatus.PUBLISHED },
      )
      .select([
        'topic.id AS id',
        'topic.topic_name AS name',
        'topic.topic_slug AS slug',
        'COUNT(post.id) AS posts_count',
      ])
      .where(topicWhere, { search: searchLike })
      .groupBy('topic.id')
      .orderBy('posts_count', 'DESC')
      .limit(effectiveLimit);

    const [users, posts, communities, topics, userCount, postCount, communityCount, topicCount] =
      await Promise.all([
        userQuery.getRawMany(),
        postQuery.getRawMany(),
        communityQuery.getRawMany(),
        topicQuery.getRawMany(),
        this.userRepository
          .createQueryBuilder('user')
          .leftJoin('user_profile', 'profile', 'profile.user_id = user.id')
          .where(userWhere, { search: searchLike })
          .getCount(),
        this.postRepository
          .createQueryBuilder('post')
          .where(postWhere, { search: searchLike })
          .andWhere('post.post_status IN (:...statuses)', {
            statuses: [PostStatus.PUBLISHED, PostStatus.DRAFT],
          })
          .getCount(),
        this.communityRepository
          .createQueryBuilder('community')
          .where(communityWhere, { search: searchLike })
          .getCount(),
        this.topicEntityRepository
          .createQueryBuilder('topic')
          .where(topicWhere, { search: searchLike })
          .getCount(),
      ]);

    // Debug: Log raw query results to verify data structure
    this.logger.debug(`Search results - Posts sample: ${JSON.stringify(posts.slice(0, 1))}`);
    this.logger.debug(`Search results - Communities sample: ${JSON.stringify(communities.slice(0, 1))}`);

    return {
      users: users.map((u) => ({
        id: Number(u.id),
        name: u.name,
        handle: u.handle,
        avatar: u.avatar,
        role: u.role,
      })),
      posts: posts.map((p) => ({
        id: Number(p.id),
        title: p.title,
        slug: p.slug,
        status: p.status,
        view_count: Number(p.view_count) || 0,
        like_count: Number(p.like_count) || 0,
        comment_count: Number(p.comment_count) || 0,
        created_at: p.created_at,
        post_image: p.post_image || null,
        post_video: p.post_video || null,
        post_audio: p.post_audio || null,
        user: {
          id: Number(p.user_id),
          name: p.user_name,
          handle: p.user_handle,
        },
      })),
      communities: communities.map((c) => ({
        id: Number(c.id),
        name: c.name,
        member_count: Number(c.member_count) || 0,
        slug: c.slug,
        community_image: c.community_image || null,
      })),
      topics: topics.map((t) => ({
        id: Number(t.id),
        name: t.name,
        posts_count: Number(t.posts_count) || 0,
        slug: t.slug,
      })),
      meta: {
        users: { count: userCount },
        posts: { count: postCount },
        communities: { count: communityCount },
        topics: { count: topicCount },
      },
    };
  }

  // Get Subscription and Payment Notifications
  async getSubscriptionPaymentNotifications(
    queryDto: ListSubscriptionPaymentNotificationsDto,
  ): Promise<{
    data: Notification[];
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
      is_read,
      user_id,
      search,
      sort_by = 'created_at',
      sort_order = 'DESC',
    } = queryDto;

    // Use NotificationService to execute the query (it has the properly configured repository)
    const { data: notifications, total } = await this.notificationService.getSubscriptionPaymentNotifications({
      page,
      limit,
      is_read: is_read === ReadStatus.READ,
      user_id,
      search,
      sort_by,
      sort_order,
    });

    return {
      data: notifications,
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  // Get User Growth Data (Historical breakdown)
  async getUserGrowth(queryDto?: UserGrowthQueryDto): Promise<{
    data: Array<{ date: string; count: number; cumulative: number }>;
    total: number;
  }> {
    try {
      const { time_range, start_date, end_date } = queryDto || {};
      const effectiveTimeRange = time_range || 'all';

      // Validate: Cannot use time_range and custom dates together
      if (time_range && (start_date || end_date)) {
        throw new BadRequestException('Cannot use time_range together with start_date/end_date. Use either time_range OR custom dates.');
      }

      // Validate custom date range
      if ((start_date && !end_date) || (!start_date && end_date)) {
        throw new BadRequestException('Both start_date and end_date are required together');
      }

      // Calculate date ranges
      let periodStart: Date;
      let periodEnd: Date;
      const now = new Date();

      if (start_date && end_date) {
        periodStart = this.normalizeStartDate(new Date(start_date));
        periodEnd = this.normalizeEndDate(new Date(end_date));
      } else {
        switch (effectiveTimeRange) {
          case 'week':
            periodStart = this.normalizeStartDate(new Date(now));
            periodStart.setDate(periodStart.getDate() - 6);
            periodEnd = this.normalizeEndDate(now);
            break;
          case 'month':
            periodStart = this.normalizeStartDate(new Date(now));
            periodStart.setDate(periodStart.getDate() - 29);
            periodEnd = this.normalizeEndDate(now);
            break;
          case 'year':
            periodStart = this.normalizeStartDate(new Date(now));
            periodStart.setDate(periodStart.getDate() - 364);
            periodEnd = this.normalizeEndDate(now);
            break;
          default: // 'all'
            // For all time, get from first user registration to now
            // Use a safe query that handles empty database
            const firstUserResult = await this.userRepository
              .createQueryBuilder('user')
              .select('user.created_at', 'created_at')
              .orderBy('user.created_at', 'ASC')
              .limit(1)
              .getRawOne();

            if (firstUserResult && firstUserResult.created_at) {
              const firstUserDate = new Date(firstUserResult.created_at);
              periodStart = this.normalizeStartDate(firstUserDate);
              this.logger.debug(`User growth 'all' range: First user date: ${firstUserDate.toISOString()}, Period start: ${periodStart.toISOString()}`);
            } else {
              // If no users exist, use last 12 months as default
              const defaultStart = new Date(now);
              defaultStart.setMonth(defaultStart.getMonth() - 12);
              periodStart = this.normalizeStartDate(defaultStart);
              this.logger.debug(`User growth 'all' range: No users found, using default start: ${periodStart.toISOString()}`);
            }
            periodEnd = this.normalizeEndDate(new Date(now));
            this.logger.debug(`User growth 'all' range: Period end: ${periodEnd.toISOString()}`);
            break;
        }
      }

      // Determine grouping based on time range
      let dateFormat: 'daily' | 'weekly' | 'monthly';
      const diffTime = periodEnd.getTime() - periodStart.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 90) {
        dateFormat = 'daily';
      } else if (diffDays <= 365) {
        dateFormat = 'weekly';
      } else {
        dateFormat = 'monthly';
      }

      // Query user growth data using raw SQL for date formatting
      let groupByClause: string;
      let dateSelectClause: string;
      if (dateFormat === 'daily') {
        groupByClause = "DATE(users.created_at)";
        dateSelectClause = "DATE(users.created_at)";
      } else if (dateFormat === 'weekly') {
        groupByClause = "YEARWEEK(users.created_at, 1)";
        dateSelectClause = "YEARWEEK(users.created_at, 1)";
      } else {
        groupByClause = "DATE_FORMAT(users.created_at, '%Y-%m')";
        dateSelectClause = "DATE_FORMAT(users.created_at, '%Y-%m')";
      }

      // Query user growth data - get all users in the date range first
      // Also get total count for debugging
      const totalUsersCount = await this.userRepository.count();
      this.logger.debug(`User growth: Total users in database: ${totalUsersCount}`);
      this.logger.debug(`User growth: Querying users between ${periodStart.toISOString()} and ${periodEnd.toISOString()}`);

      // Query users in the date range
      let usersInRange = await this.userRepository
        .createQueryBuilder('user')
        .select(['user.id', 'user.created_at'])
        .where('user.created_at >= :start', { start: periodStart })
        .andWhere('user.created_at <= :end', { end: periodEnd })
        .getMany();

      this.logger.debug(`User growth query: Found ${usersInRange.length} users in date range (out of ${totalUsersCount} total)`);

      // If no users found in range but total > 0, there might be a date range issue
      // Let's get all users and filter them in memory to debug
      if (usersInRange.length === 0 && totalUsersCount > 0) {
        const allUsers = await this.userRepository
          .createQueryBuilder('user')
          .select(['user.id', 'user.created_at'])
          .orderBy('user.created_at', 'ASC')
          .getMany();

        this.logger.warn(`User growth: No users in date range. Total users: ${allUsers.length}`);
        if (allUsers.length > 0) {
          const firstUser = allUsers[0];
          const lastUser = allUsers[allUsers.length - 1];
          this.logger.warn(`User growth: First user date: ${firstUser.created_at?.toISOString()}, Last user date: ${lastUser.created_at?.toISOString()}`);
          this.logger.warn(`User growth: Query range: ${periodStart.toISOString()} to ${periodEnd.toISOString()}`);

          // If users exist outside the range, adjust the range to include them
          const firstUserDate = firstUser.created_at instanceof Date ? firstUser.created_at : new Date(firstUser.created_at);
          const lastUserDate = lastUser.created_at instanceof Date ? lastUser.created_at : new Date(lastUser.created_at);

          if (firstUserDate < periodStart) {
            this.logger.warn(`User growth: Adjusting periodStart to include first user`);
            periodStart = this.normalizeStartDate(firstUserDate);
          }
          if (lastUserDate > periodEnd) {
            this.logger.warn(`User growth: Adjusting periodEnd to include last user`);
            periodEnd = this.normalizeEndDate(lastUserDate);
          }

          // Re-query with adjusted dates
          usersInRange = await this.userRepository
            .createQueryBuilder('user')
            .select(['user.id', 'user.created_at'])
            .where('user.created_at >= :start', { start: periodStart })
            .andWhere('user.created_at <= :end', { end: periodEnd })
            .getMany();

          this.logger.debug(`User growth: After adjustment, found ${usersInRange.length} users`);
        }
      }

      // Group users by date
      const growthMap = new Map<string, number>();
      usersInRange.forEach(user => {
        let dateKey: string;
        // Ensure we're working with a proper Date object
        const userDate = user.created_at instanceof Date ? user.created_at : new Date(user.created_at);

        if (dateFormat === 'daily') {
          // Use UTC date to avoid timezone issues
          const year = userDate.getUTCFullYear();
          const month = String(userDate.getUTCMonth() + 1).padStart(2, '0');
          const day = String(userDate.getUTCDate()).padStart(2, '0');
          dateKey = `${year}-${month}-${day}`;
        } else if (dateFormat === 'weekly') {
          // Calculate week number
          const year = userDate.getFullYear();
          const week = this.getWeekNumber(userDate);
          dateKey = `${year}-W${week}`;
        } else {
          // Monthly
          const year = userDate.getUTCFullYear();
          const month = String(userDate.getUTCMonth() + 1).padStart(2, '0');
          dateKey = `${year}-${month}`;
        }

        growthMap.set(dateKey, (growthMap.get(dateKey) || 0) + 1);
      });

      this.logger.debug(`User growth grouped into ${growthMap.size} date groups`);

      // Convert map to array
      const growthData = Array.from(growthMap.entries())
        .map(([date, count]) => ({
          date,
          count: count,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Get total users before period start for cumulative calculation
      const totalBeforePeriod = await this.userRepository.count({
        where: {
          created_at: LessThan(periodStart),
        },
      });

      // Process data and calculate cumulative counts
      let cumulative = totalBeforePeriod;
      const processedData = growthData.map((item) => {
        const count = typeof item.count === 'number' ? item.count : parseInt(item.count || '0', 10);
        cumulative += count;
        return {
          date: item.date, // Already formatted correctly
          count: count,
          cumulative: cumulative,
        };
      });

      // Fill in missing dates with zero counts
      // Create a map of processed data for easier lookup
      const processedDataMap = new Map<string, { date: string; count: number; cumulative: number }>();
      processedData.forEach(item => {
        processedDataMap.set(item.date, item);
      });

      this.logger.debug(`User growth: Processed ${processedData.length} data points with dates: ${processedData.map(d => d.date).join(', ')}`);

      const filledData: Array<{ date: string; count: number; cumulative: number }> = [];
      // Use UTC dates for iteration to avoid timezone issues
      const currentDate = new Date(Date.UTC(
        periodStart.getUTCFullYear(),
        periodStart.getUTCMonth(),
        periodStart.getUTCDate()
      ));
      const endDate = new Date(Date.UTC(
        periodEnd.getUTCFullYear(),
        periodEnd.getUTCMonth(),
        periodEnd.getUTCDate()
      ));

      // Calculate max iterations based on actual date range
      const maxIterations = Math.ceil(diffDays) + 10; // Add buffer
      let iterations = 0;
      let lastCumulative = totalBeforePeriod;

      while (currentDate <= endDate && iterations < maxIterations) {
        iterations++;
        const dateStr = this.formatDateForGrouping(new Date(currentDate), dateFormat);
        const existingData = processedDataMap.get(dateStr);

        if (existingData) {
          filledData.push(existingData);
          lastCumulative = existingData.cumulative;
        } else {
          // Fill with zero count, but maintain cumulative
          filledData.push({
            date: dateStr,
            count: 0,
            cumulative: lastCumulative,
          });
        }

        // Move to next period using UTC
        if (dateFormat === 'daily') {
          currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        } else if (dateFormat === 'weekly') {
          currentDate.setUTCDate(currentDate.getUTCDate() + 7);
        } else {
          currentDate.setUTCMonth(currentDate.getUTCMonth() + 1);
        }
      }

      this.logger.debug(`User growth: Filled ${filledData.length} data points`);

      // Use the final cumulative value from processed data if available, otherwise from filled data
      const finalTotal = processedData.length > 0
        ? processedData[processedData.length - 1].cumulative
        : (filledData.length > 0 ? filledData[filledData.length - 1].cumulative : totalBeforePeriod);

      return {
        data: filledData,
        total: finalTotal,
      };
    } catch (error) {
      console.error('Error in getUserGrowth:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to fetch user growth data: ${error.message || 'Unknown error'}`);
    }
  }

  private formatDateForGrouping(date: Date, format: 'daily' | 'weekly' | 'monthly'): string {
    // Use UTC to avoid timezone issues
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');

    switch (format) {
      case 'daily':
        return `${year}-${month}-${day}`;
      case 'weekly':
        const week = this.getWeekNumber(date);
        return `${year}-W${week}`;
      case 'monthly':
        return `${year}-${month}`;
      default:
        return `${year}-${month}-${day}`;
    }
  }

  private getWeekNumber(date: Date): string {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return String(Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)).padStart(2, '0');
  }

  private getUsersQueryBuilder(
    listQueryDto: ListUsersQueryDto,
    options: { onlyDeleted?: boolean } = {},
  ) {
    const {
      search,
      role,
      is_active,
      is_verified,
      created_from,
      created_to,
      user_id,
    } = listQueryDto;

    const queryBuilder = this.userRepository.createQueryBuilder('user')
      .leftJoin('user_profile', 'profile', 'profile.user_id = user.id');

    // Default: exclude soft-deleted users.
    // onlyDeleted: true → return only soft-deleted users (for admin deleted-users page)
    if (options.onlyDeleted) {
      queryBuilder.andWhere('user.is_deleted = :deletedFlag', { deletedFlag: true });
    } else {
      queryBuilder.andWhere('user.is_deleted = :deletedFlag', { deletedFlag: false });
    }

    if (search) {
      queryBuilder.andWhere(
        '(user.username LIKE :search OR user.email LIKE :search OR profile.full_name LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (role && role !== 'all') {
      queryBuilder.andWhere('user.role = :role', { role });
    }

    if (is_active !== undefined) {
      const activeValue = is_active === ActiveStatus.ACTIVE;
      queryBuilder.andWhere('user.is_active = :is_active', { is_active: activeValue });
    }

    if (is_verified !== undefined) {
      const verifiedValue = is_verified === VerifiedStatus.VERIFIED;
      queryBuilder.andWhere('user.is_verified = :is_verified', { is_verified: verifiedValue });
    }

    if (user_id) {
      queryBuilder.andWhere('user.id = :user_id', { user_id });
    }

    if (created_from) {
      queryBuilder.andWhere('user.created_at >= :created_from', {
        created_from: new Date(created_from),
      });
    }

    if (created_to) {
      queryBuilder.andWhere('user.created_at <= :created_to', {
        created_to: new Date(created_to),
      });
    }

    return queryBuilder;
  }

  private getUserSortField(sort_by: string): string {
    const allowedSortFields = [
      'id',
      'username',
      'email',
      'role',
      'is_active',
      'is_verified',
      'created_at',
      'updated_at',
    ];

    if (allowedSortFields.includes(sort_by)) {
      return sort_by;
    }

    return 'created_at';
  }
}

