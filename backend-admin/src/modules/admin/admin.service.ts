import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  Inject,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import * as bcrypt from 'bcrypt';
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
import { PrismaService } from '../../prisma/prisma.service';
import { DeviceType, SubscriptionStatus, PaymentStatus } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import {
  DashboardStatsDto,
  TrendingTopicDto,
  TrendsDto,
} from './dto/dashboard-stats.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { ListQueryDto } from './dto/list-query.dto';
import { SearchQueryDto } from './dto/search-query.dto';
import {
  ListUsersQueryDto,
  ActiveStatus,
  VerifiedStatus,
} from './dto/list-users-query.dto';
import { ListPostsQueryDto } from './dto/list-posts-query.dto';
import {
  ListCommentsQueryDto,
  ApprovedStatus,
  RepliesStatus,
} from './dto/list-comments-query.dto';
import {
  ListTopicsQueryDto,
  ChildrenStatus,
} from './dto/list-topics-query.dto';
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
import {
  ListSubscriptionPaymentNotificationsDto,
  ReadStatus,
} from './dto/list-subscription-payment-notifications.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private prisma: PrismaService,
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
  ) {}

  // Helper methods for token generation
  private async generateTokens(user: {
    id: number;
    username: string;
    role: string;
  }) {
    const payload = { sub: user.id, username: user.username, role: user.role };

    const accessTokenExpiresIn = '30d';
    const accessTokenExpiresInSeconds = 30 * 24 * 60 * 60;
    const refreshTokenExpiresIn = '90d';

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: accessTokenExpiresIn,
    });
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: refreshTokenExpiresIn,
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { access_token: accessToken, refresh_token: refreshToken },
    });

    await this.invalidateUserCache(user.id);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: accessTokenExpiresInSeconds,
    };
  }

  private async invalidateUserCache(userId: number): Promise<void> {
    const cacheKey = `user:${userId}`;
    await this.cacheManager.del(cacheKey);
  }

  private async registerDevice(
    userId: number,
    deviceData: {
      device_id: string;
      device_type: DeviceType;
      device_token?: string;
    },
  ) {
    const device = await this.prisma.userDevice.findFirst({
      where: { user_id: userId, device_id: deviceData.device_id },
    });

    if (device) {
      return this.prisma.userDevice.update({
        where: { id: device.id },
        data: {
          device_token: deviceData.device_token || device.device_token,
          device_type: deviceData.device_type,
          is_active: true,
          last_active_at: new Date(),
        },
      });
    }

    return this.prisma.userDevice.create({
      data: {
        user_id: userId,
        device_id: deviceData.device_id,
        device_type: deviceData.device_type,
        device_token: deviceData.device_token,
        is_active: true,
        last_active_at: new Date(),
      },
    });
  }

  // Admin Login
  async login(adminLoginDto: AdminLoginDto): Promise<AuthResponseDto> {
    if (!adminLoginDto.identifier || !adminLoginDto.identifier.trim()) {
      throw new BadRequestException(
        'Identifier (email or username) is required',
      );
    }

    if (!adminLoginDto.password || !adminLoginDto.password.trim()) {
      throw new BadRequestException('Password is required');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: adminLoginDto.identifier.trim() },
          { username: adminLoginDto.identifier.trim() },
        ],
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.password_hash) {
      throw new UnauthorizedException('Password is not set for this account');
    }

    const isPasswordValid = await bcrypt.compare(
      adminLoginDto.password,
      user.password_hash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.role !== 'admin' && user.role !== 'sub_admin') {
      throw new UnauthorizedException(
        'Access denied. Admin or sub-admin role required.',
      );
    }

    if (!user.is_active) {
      throw new UnauthorizedException(
        'Account is inactive. Please contact administrator.',
      );
    }

    if (!user.is_verified) {
      throw new UnauthorizedException('Please verify your account first');
    }

    if (adminLoginDto.device_id) {
      await this.registerDevice(user.id, {
        device_id: adminLoginDto.device_id,
        device_type:
          (adminLoginDto.device_type as DeviceType) || DeviceType.web,
        device_token: adminLoginDto.device_token,
      });
    }

    const tokens = await this.generateTokens(user);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role as any,
        auth_type: user.auth_type as any,
        is_active: user.is_active,
        is_verified: user.is_verified,
      },
      ...tokens,
    };
  }

  // Admin Logout
  async logout(userId: number): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { access_token: null, refresh_token: null },
    });

    await this.invalidateUserCache(userId);

    return { message: 'Logged out successfully' };
  }

  // Admin Forgot Password
  async forgotPassword(
    forgotPasswordDto: AdminForgotPasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findFirst({
      where: { email: forgotPasswordDto.email },
    });

    if (!user) {
      return {
        message: 'If the email exists, a password reset code has been sent',
      };
    }

    if (user.role !== 'admin' && user.role !== 'sub_admin') {
      return {
        message: 'If the email exists, a password reset code has been sent',
      };
    }

    const resetCode = this.generateResetCode();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await this.prisma.userPasswordReset.create({
      data: {
        user_id: user.id,
        email: forgotPasswordDto.email,
        reset_code: resetCode,
        expires_at: expiresAt,
        is_used: false,
      },
    });

    try {
      const appUrl = this.configService.get<string>(
        'app.url',
        'https://demo.jantrah.com/jawaab',
      );
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
      if (this.configService.get<string>('NODE_ENV') === 'development') {
        console.log(
          `Password reset code for admin ${user.email}: ${resetCode}`,
        );
      }
    }

    return {
      message: 'If the email exists, a password reset code has been sent',
    };
  }

  // Admin Reset Password
  async resetPassword(
    resetPasswordDto: AdminResetPasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findFirst({
      where: { email: resetPasswordDto.email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== 'admin' && user.role !== 'sub_admin') {
      throw new UnauthorizedException(
        'Access denied. Admin or sub-admin role required.',
      );
    }

    const passwordReset = await this.prisma.userPasswordReset.findFirst({
      where: {
        user_id: user.id,
        reset_code: resetPasswordDto.reset_code,
        is_used: false,
        expires_at: { gt: new Date() },
      },
    });

    if (!passwordReset) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    await this.prisma.userPasswordReset.update({
      where: { id: passwordReset.id },
      data: { is_used: true },
    });

    const passwordHash = await bcrypt.hash(resetPasswordDto.new_password, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password_hash: passwordHash },
    });

    await this.invalidateUserCache(user.id);

    return { message: 'Password reset successfully' };
  }

  // Admin Change Password
  async changePassword(
    userId: number,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== 'admin' && user.role !== 'sub_admin') {
      throw new UnauthorizedException(
        'Access denied. Admin or sub-admin role required.',
      );
    }

    if (!user.password_hash) {
      throw new BadRequestException(
        'Password not set. Please use reset password instead.',
      );
    }

    const isOldPasswordValid = await bcrypt.compare(
      changePasswordDto.old_password,
      user.password_hash,
    );

    if (!isOldPasswordValid) {
      throw new UnauthorizedException('Invalid old password');
    }

    const isSamePassword = await bcrypt.compare(
      changePasswordDto.new_password,
      user.password_hash,
    );

    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from old password',
      );
    }

    const passwordHash = await bcrypt.hash(changePasswordDto.new_password, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password_hash: passwordHash,
        access_token: null,
        refresh_token: null,
      },
    });

    await this.invalidateUserCache(userId);

    return { message: 'Password changed successfully. Please login again.' };
  }

  private generateResetCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private normalizeStartDate(date: Date): Date {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }

  private normalizeEndDate(date: Date): Date {
    const normalized = new Date(date);
    normalized.setHours(23, 59, 59, 999);
    return normalized;
  }

  // Dashboard Stats
  async getDashboardStats(
    queryDto?: DashboardStatsQueryDto,
  ): Promise<DashboardStatsDto> {
    try {
      const { time_range, start_date, end_date } = queryDto || {};
      const effectiveTimeRange = time_range || 'all';

      if (time_range && (start_date || end_date)) {
        throw new BadRequestException(
          'Cannot use time_range together with start_date/end_date. Use either time_range OR custom dates.',
        );
      }

      if ((start_date && !end_date) || (!start_date && end_date)) {
        throw new BadRequestException(
          'Both start_date and end_date are required together',
        );
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

      let periodStart: Date;
      let periodEnd: Date;
      let previousPeriodStart: Date;
      let previousPeriodEnd: Date;
      let isAllTime = false;
      const now = new Date();

      if (start_date && end_date) {
        periodStart = this.normalizeStartDate(new Date(start_date));
        periodEnd = this.normalizeEndDate(new Date(end_date));
        const periodDuration = periodEnd.getTime() - periodStart.getTime();
        previousPeriodEnd = new Date(periodStart.getTime() - 1);
        previousPeriodStart = new Date(
          previousPeriodEnd.getTime() - periodDuration,
        );
        previousPeriodStart = this.normalizeStartDate(previousPeriodStart);
        previousPeriodEnd = this.normalizeEndDate(previousPeriodEnd);
      } else {
        switch (effectiveTimeRange) {
          case 'week':
            periodStart = this.normalizeStartDate(new Date(now));
            periodStart.setDate(periodStart.getDate() - 6);
            periodEnd = this.normalizeEndDate(now);
            previousPeriodStart = new Date(periodStart);
            previousPeriodStart.setDate(previousPeriodStart.getDate() - 7);
            previousPeriodStart = this.normalizeStartDate(previousPeriodStart);
            previousPeriodEnd = new Date(periodStart.getTime() - 1);
            previousPeriodEnd = this.normalizeEndDate(previousPeriodEnd);
            break;
          case 'month':
            periodStart = this.normalizeStartDate(new Date(now));
            periodStart.setDate(periodStart.getDate() - 29);
            periodEnd = this.normalizeEndDate(now);
            previousPeriodStart = new Date(periodStart);
            previousPeriodStart.setDate(previousPeriodStart.getDate() - 30);
            previousPeriodStart = this.normalizeStartDate(previousPeriodStart);
            previousPeriodEnd = new Date(periodStart.getTime() - 1);
            previousPeriodEnd = this.normalizeEndDate(previousPeriodEnd);
            break;
          case 'year':
            periodStart = this.normalizeStartDate(new Date(now));
            periodStart.setDate(periodStart.getDate() - 364);
            periodEnd = this.normalizeEndDate(now);
            previousPeriodStart = new Date(periodStart);
            previousPeriodStart.setDate(previousPeriodStart.getDate() - 365);
            previousPeriodStart = this.normalizeStartDate(previousPeriodStart);
            previousPeriodEnd = new Date(periodStart.getTime() - 1);
            previousPeriodEnd = this.normalizeEndDate(previousPeriodEnd);
            break;
          default: // 'all'
            isAllTime = true;
            periodStart = new Date(0);
            periodEnd = this.normalizeEndDate(now);
            previousPeriodStart = new Date(0);
            previousPeriodEnd = new Date(0);
        }
      }

      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      const currentStats = await this.getPeriodStats(
        periodStart,
        periodEnd,
        isAllTime,
      );
      const previousStats = isAllTime
        ? {
            total_users: 0,
            active_users: 0,
            verified_users: 0,
            pro_users: 0,
            total_posts: 0,
            published_posts: 0,
            draft_posts: 0,
            total_comments: 0,
            total_topics: 0,
            active_topics: 0,
            total_communities: 0,
            active_communities: 0,
            total_polls: 0,
            published_polls: 0,
            recent_users: 0,
            recent_posts: 0,
          }
        : await this.getPeriodStats(
            previousPeriodStart,
            previousPeriodEnd,
            false,
          );

      const trends = this.calculateTrends(currentStats, previousStats);

      const dailyActiveUsers = await this.getActiveUsersCount(
        oneDayAgo,
        new Date(),
      );
      const weeklyActiveUsers = await this.getActiveUsersCount(
        oneWeekAgo,
        new Date(),
      );
      const monthlyActiveUsers = await this.getActiveUsersCount(
        oneMonthAgo,
        new Date(),
      );

      // Engagement rate
      const totalViewsResult = await this.prisma.$queryRawUnsafe<any[]>(
        `SELECT COALESCE(SUM(view_count), 0) AS total FROM user_posts WHERE created_at >= $1 AND created_at <= $2`,
        periodStart,
        periodEnd,
      );
      const totalLikesResult = await this.prisma.$queryRawUnsafe<any[]>(
        `SELECT COALESCE(SUM(like_count), 0) AS total FROM user_posts WHERE created_at >= $1 AND created_at <= $2`,
        periodStart,
        periodEnd,
      );
      const totalComments = await this.prisma.postComment.count({
        where: { created_at: { gte: periodStart, lte: periodEnd } },
      });
      const totalInteractions =
        parseInt(totalLikesResult[0]?.total || '0', 10) + totalComments;
      const totalViewsNum = parseInt(totalViewsResult[0]?.total || '0', 10);
      const engagementRate =
        totalViewsNum > 0 ? (totalInteractions / totalViewsNum) * 100 : 0;

      // Top posts -- fetch then sort in memory
      const allPosts = await this.prisma.userPost.findMany({
        where: { created_at: { gte: periodStart, lte: periodEnd } },
        include: { user: true },
      });

      const topPosts = allPosts
        .map((post) => ({
          ...post,
          engagement_score: (post.like_count || 0) + (post.comment_count || 0),
        }))
        .sort((a, b) => b.engagement_score - a.engagement_score)
        .slice(0, 10);

      // Top users by activity
      const topUsersRaw = await this.prisma.$queryRawUnsafe<any[]>(
        `SELECT
           u.id as user_id,
           u.username as user_username,
           u.email as user_email,
           COUNT(DISTINCT post.id) as post_count,
           COUNT(DISTINCT comment.id) as comment_count
         FROM users u
         LEFT JOIN user_posts post
           ON post.user_id = u.id AND post.created_at BETWEEN $1 AND $2
         LEFT JOIN post_comments comment
           ON comment.user_id = u.id AND comment.created_at BETWEEN $3 AND $4
         GROUP BY u.id, u.username, u.email
         HAVING COUNT(DISTINCT post.id) > 0 OR COUNT(DISTINCT comment.id) > 0`,
        periodStart,
        periodEnd,
        periodStart,
        periodEnd,
      );

      const topUsers = topUsersRaw
        .map((u) => ({
          ...u,
          activity_score:
            parseInt(u.post_count || '0', 10) +
            parseInt(u.comment_count || '0', 10),
        }))
        .sort((a, b) => b.activity_score - a.activity_score)
        .slice(0, 10);

      let recentActivity: any[] = [];
      try {
        recentActivity = await this.getRecentActivity(10);
      } catch (error) {
        console.error('Error fetching recent activity:', error);
      }

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
          user: {
            id: (p as any).user?.id,
            username: (p as any).user?.username,
          },
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
      throw new BadRequestException(
        `Failed to fetch dashboard stats: ${error.message || 'Unknown error'}`,
      );
    }
  }

  private async getPeriodStats(
    start: Date,
    end: Date,
    isAllTime: boolean = false,
  ) {
    if (isAllTime) {
      return {
        total_users: await this.prisma.user.count(),
        active_users: await this.prisma.user.count({
          where: { is_active: true },
        }),
        verified_users: await this.prisma.user.count({
          where: { is_verified: true },
        }),
        pro_users: await this.prisma.user.count({
          where: { role: 'pro_user' },
        }),
        total_posts: await this.prisma.userPost.count(),
        published_posts: await this.prisma.userPost.count({
          where: { post_status: 'published' },
        }),
        draft_posts: await this.prisma.userPost.count({
          where: { post_status: 'draft' },
        }),
        total_comments: await this.prisma.postComment.count(),
        total_topics: await this.prisma.topic.count(),
        active_topics: await this.prisma.topic.count({
          where: { is_active: true },
        }),
        total_communities: await this.prisma.community.count(),
        active_communities: await this.prisma.community.count({
          where: { is_active: true },
        }),
        total_polls: await this.prisma.userPoll.count(),
        published_polls: await this.prisma.userPoll.count({
          where: { poll_status: 'published' },
        }),
        recent_users: await this.prisma.user.count({
          where: {
            created_at: { gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
        }),
        recent_posts: await this.prisma.userPost.count({
          where: {
            created_at: { gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
        }),
      };
    }

    return {
      total_users: await this.prisma.user.count({
        where: { created_at: { gte: start, lte: end } },
      }),
      active_users: await this.prisma.user.count({
        where: { is_active: true, created_at: { gte: start, lte: end } },
      }),
      verified_users: await this.prisma.user.count({
        where: { is_verified: true, created_at: { gte: start, lte: end } },
      }),
      pro_users: await this.prisma.user.count({
        where: { role: 'pro_user', created_at: { gte: start, lte: end } },
      }),
      total_posts: await this.prisma.userPost.count({
        where: { created_at: { gte: start, lte: end } },
      }),
      published_posts: await this.prisma.userPost.count({
        where: {
          post_status: 'published',
          created_at: { gte: start, lte: end },
        },
      }),
      draft_posts: await this.prisma.userPost.count({
        where: { post_status: 'draft', created_at: { gte: start, lte: end } },
      }),
      total_comments: await this.prisma.postComment.count({
        where: { created_at: { gte: start, lte: end } },
      }),
      total_topics: await this.prisma.topic.count({
        where: { created_at: { gte: start, lte: end } },
      }),
      active_topics: await this.prisma.topic.count({
        where: { is_active: true, created_at: { gte: start, lte: end } },
      }),
      total_communities: await this.prisma.community.count({
        where: { created_at: { gte: start, lte: end } },
      }),
      active_communities: await this.prisma.community.count({
        where: { is_active: true, created_at: { gte: start, lte: end } },
      }),
      total_polls: await this.prisma.userPoll.count({
        where: { created_at: { gte: start, lte: end } },
      }),
      published_polls: await this.prisma.userPoll.count({
        where: {
          poll_status: 'published',
          created_at: { gte: start, lte: end },
        },
      }),
      recent_users: await this.prisma.user.count({
        where: {
          created_at: { gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      recent_posts: await this.prisma.userPost.count({
        where: {
          created_at: { gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
    };
  }

  private calculateTrends(current: any, previous: any) {
    const calculateChange = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    return {
      total_users_change: calculateChange(
        current.total_users,
        previous.total_users,
      ),
      active_users_change: calculateChange(
        current.active_users,
        previous.active_users,
      ),
      verified_users_change: calculateChange(
        current.verified_users,
        previous.verified_users,
      ),
      pro_users_change: calculateChange(current.pro_users, previous.pro_users),
      total_posts_change: calculateChange(
        current.total_posts,
        previous.total_posts,
      ),
      published_posts_change: calculateChange(
        current.published_posts,
        previous.published_posts,
      ),
      draft_posts_change: calculateChange(
        current.draft_posts,
        previous.draft_posts,
      ),
      total_comments_change: calculateChange(
        current.total_comments,
        previous.total_comments,
      ),
      total_topics_change: calculateChange(
        current.total_topics,
        previous.total_topics,
      ),
      active_topics_change: calculateChange(
        current.active_topics,
        previous.active_topics,
      ),
      total_communities_change: calculateChange(
        current.total_communities,
        previous.total_communities,
      ),
      active_communities_change: calculateChange(
        current.active_communities,
        previous.active_communities,
      ),
      total_polls_change: calculateChange(
        current.total_polls,
        previous.total_polls,
      ),
      published_polls_change: calculateChange(
        current.published_polls,
        previous.published_polls,
      ),
    };
  }

  private async getActiveUsersCount(start: Date, end: Date): Promise<number> {
    const result = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT COUNT(DISTINCT u.id) AS "count"
       FROM users u
       LEFT JOIN user_posts post
         ON post.user_id = u.id AND post.created_at BETWEEN $1 AND $2
       LEFT JOIN post_comments comment
         ON comment.user_id = u.id AND comment.created_at BETWEEN $3 AND $4
       LEFT JOIN user_polls poll
         ON poll.user_id = u.id AND poll.created_at BETWEEN $5 AND $6
       WHERE post.id IS NOT NULL OR comment.id IS NOT NULL OR poll.id IS NOT NULL`,
      start,
      end,
      start,
      end,
      start,
      end,
    );
    return parseInt(result[0]?.count || '0');
  }

  private async getRecentActivity(limit: number = 10): Promise<any[]> {
    const activities: any[] = [];

    const recentPosts = await this.prisma.userPost.findMany({
      take: limit,
      orderBy: { created_at: 'desc' },
      include: { user: true },
    });
    activities.push(
      ...recentPosts.map((p) => ({
        type: 'post',
        id: p.id,
        title: p.post_title,
        user: { id: (p as any).user?.id, username: (p as any).user?.username },
        created_at: p.created_at,
      })),
    );

    const recentComments = await this.prisma.postComment.findMany({
      take: limit,
      orderBy: { created_at: 'desc' },
      include: { user: true, post: true },
    });
    activities.push(
      ...recentComments.map((c) => ({
        type: 'comment',
        id: c.id,
        content: c.comment_content.substring(0, 50),
        user: { id: (c as any).user?.id, username: (c as any).user?.username },
        post_id: c.post_id,
        created_at: c.created_at,
      })),
    );

    return activities
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      .slice(0, limit);
  }

  private async getTrendingTopics(
    limit: number = 10,
  ): Promise<TrendingTopicDto[]> {
    try {
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
          SELECT topic_id, COUNT(*) as community_count
          FROM community_topics WHERE is_active = true
          GROUP BY topic_id
        ) ct ON t.id = ct.topic_id
        LEFT JOIN (
          SELECT post_topic_id as topic_id, COUNT(*) as post_count
          FROM user_posts WHERE post_status = 'published'
          GROUP BY post_topic_id
        ) pt ON t.id = pt.topic_id
        WHERE t.is_active = true
        ORDER BY usage_count DESC, community_count DESC, post_count DESC
        LIMIT $1
      `;

      const results = await this.prisma.$queryRawUnsafe<any[]>(query, limit);

      return results.map((row: any) => ({
        topic_id: row.topic_id,
        topic_name: row.topic_name,
        topic_slug: row.topic_slug,
        usage_count: parseInt(row.usage_count) || 0,
        community_count: parseInt(row.community_count) || 0,
        post_count: parseInt(row.post_count) || 0,
      }));
    } catch (error) {
      console.warn(
        'Trending topics query failed (tables may not exist yet):',
        error.message,
      );
      return [];
    }
  }

  // User Management
  async createUser(createUserDto: CreateUserDto, adminId: number) {
    if (!createUserDto.email && !createUserDto.phone_number) {
      throw new BadRequestException(
        'Either email or phone_number must be provided',
      );
    }

    let authType: string = createUserDto.auth_type ?? '';
    if (!authType) {
      if (createUserDto.email && !createUserDto.phone_number) {
        authType = 'email';
      } else if (createUserDto.phone_number && !createUserDto.email) {
        authType = 'phone';
      } else {
        authType = 'email';
      }
    }

    const username =
      authType === 'phone' && createUserDto.phone_number
        ? createUserDto.phone_number
        : createUserDto.username;

    const whereConditions: any[] = [{ username }];
    if (createUserDto.email) {
      whereConditions.push({ email: createUserDto.email });
    }

    const existingUser = await this.prisma.user.findFirst({
      where: { OR: whereConditions },
    });

    if (existingUser) {
      throw new ConflictException(
        'User with this email or username already exists',
      );
    }

    let passwordHash: string | null = null;
    if (
      createUserDto.password &&
      (authType === 'email' || authType === 'phone')
    ) {
      passwordHash = await bcrypt.hash(createUserDto.password, 10);
    }

    const role = createUserDto.role || 'user';
    const defaultIsActive =
      role === 'admin' || role === 'sub_admin'
        ? true
        : role === 'pro_user'
          ? true
          : false;
    const defaultIsVerified =
      role === 'admin' || role === 'sub_admin' ? true : false;

    const savedUser = await this.prisma.user.create({
      data: {
        username,
        email: createUserDto.email || '',
        password_hash: passwordHash,
        auth_type: authType as any,
        role,
        is_active:
          createUserDto.is_active !== undefined
            ? createUserDto.is_active
            : defaultIsActive,
        is_verified: defaultIsVerified,
        created_by: adminId,
      },
    });

    if (createUserDto.device_id) {
      await this.registerDevice(savedUser.id, {
        device_id: createUserDto.device_id,
        device_type:
          (createUserDto.device_type as DeviceType) || DeviceType.web,
        device_token: createUserDto.device_token,
      });
    }

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

  async getUsers(
    listQueryDto: ListUsersQueryDto,
    options: { onlyDeleted?: boolean } = {},
  ) {
    const {
      page = 1,
      limit = 10,
      sort_by = 'created_at',
      sort_order = 'DESC',
    } = listQueryDto;

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    this.logger.debug(
      `getUsers: page=${pageNum}, limit=${limitNum}, skip=${skip}, sort=${sort_by}, order=${sort_order}, onlyDeleted=${!!options.onlyDeleted}`,
    );

    const where = this.buildUsersWhere(listQueryDto, options);
    const total = await this.prisma.user.count({ where });

    if (total === 0) {
      return {
        data: [],
        meta: { total, page: pageNum, limit: limitNum, total_pages: 0 },
      };
    }

    const sortField = this.getUserSortField(sort_by || 'created_at');
    const orderBy: any = { [sortField]: sort_order.toLowerCase() };

    const users = await this.prisma.user.findMany({
      where,
      orderBy,
      skip,
      take: limitNum,
      include: { profile: true },
    });

    const usersWithProfile = users.map((user: any) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      auth_type: user.auth_type,
      is_active: user.is_active,
      is_verified: user.is_verified,
      created_at: user.created_at,
      updated_at: user.updated_at,
      profile: user.profile
        ? {
            full_name: user.profile.full_name || null,
            profile_picture: user.profile.profile_picture || null,
          }
        : null,
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
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const profile = await this.prisma.userProfile.findFirst({
      where: { user_id: userId },
    });

    const followerCount = await this.prisma.userFollower.count({
      where: { user_id: userId, is_active: true },
    });
    const followingCount = await this.prisma.userFollower.count({
      where: { follower_id: userId, is_active: true },
    });
    const postsCount = await this.prisma.userPost.count({
      where: { user_id: userId },
    });
    const commentsCount = await this.prisma.postComment.count({
      where: { user_id: userId },
    });
    const communitiesCount = await this.prisma.communityUser.count({
      where: { user_id: userId, is_active: true },
    });

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      auth_type: user.auth_type,
      is_active: user.is_active,
      is_verified: user.is_verified,
      created_at: user.created_at,
      updated_at: user.updated_at,
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
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (userId === adminId && updateUserStatusDto.is_active === false) {
      throw new BadRequestException('Cannot deactivate your own account');
    }

    if (user.role === 'admin' && updateUserStatusDto.role) {
      throw new BadRequestException('Cannot change role of admin accounts');
    }

    const data: any = { updated_by: adminId };
    if (updateUserStatusDto.is_active !== undefined)
      data.is_active = updateUserStatusDto.is_active;
    if (updateUserStatusDto.is_verified !== undefined)
      data.is_verified = updateUserStatusDto.is_verified;
    if (updateUserStatusDto.role !== undefined)
      data.role = updateUserStatusDto.role;

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    return {
      message: 'User status updated successfully',
      user: {
        id: updated.id,
        username: updated.username,
        email: updated.email,
        role: updated.role,
        is_active: updated.is_active,
        is_verified: updated.is_verified,
      },
    };
  }

  async updateUser(
    userId: number,
    updateUserDto: UpdateUserDto,
    adminId: number,
    files?: Express.Multer.File[],
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (
      userId === adminId &&
      updateUserDto.is_active === ActiveStatus.INACTIVE
    ) {
      throw new BadRequestException('Cannot deactivate your own account');
    }

    if (
      user.role === 'admin' &&
      updateUserDto.role &&
      updateUserDto.role !== 'admin'
    ) {
      throw new BadRequestException('Cannot change role of admin accounts');
    }

    const userUpdateData: any = { updated_by: adminId };

    if (updateUserDto.username && updateUserDto.username !== user.username) {
      const existingUser = await this.prisma.user.findFirst({
        where: { username: updateUserDto.username },
      });
      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException('Username already taken');
      }
      userUpdateData.username = updateUserDto.username;
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.prisma.user.findFirst({
        where: { email: updateUserDto.email },
      });
      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException('Email already taken');
      }
      userUpdateData.email = updateUserDto.email;
    }

    if (updateUserDto.password) {
      userUpdateData.password_hash = await bcrypt.hash(
        updateUserDto.password,
        10,
      );
      userUpdateData.access_token = null;
      userUpdateData.refresh_token = null;
    }

    if (updateUserDto.auth_type !== undefined)
      userUpdateData.auth_type = updateUserDto.auth_type;

    if (updateUserDto.role !== undefined) {
      if (user.role === 'admin' && updateUserDto.role !== 'admin') {
        throw new BadRequestException('Cannot change role of admin accounts');
      }
      userUpdateData.role = updateUserDto.role;
    }

    if (updateUserDto.is_active !== undefined) {
      userUpdateData.is_active =
        updateUserDto.is_active === ActiveStatus.ACTIVE;
    }

    if (updateUserDto.is_verified !== undefined) {
      userUpdateData.is_verified =
        updateUserDto.is_verified === VerifiedStatus.VERIFIED;
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: userUpdateData,
    });

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

    const hasProfileFields =
      profileFields.some((field) => updateUserDto[field] !== undefined) ||
      (files && files.length > 0);

    if (hasProfileFields) {
      const profile = await this.prisma.userProfile.findFirst({
        where: { user_id: userId },
      });

      const hasFileUploads = files && files.length > 0;
      const profileUpdateData: any = { updated_by: adminId };

      if (files && files.length > 0) {
        const profilePictureFile = files.length >= 1 ? files[0] : null;
        const profileBackgroundFile = files.length >= 2 ? files[1] : null;

        if (profilePictureFile) {
          try {
            if (
              !profilePictureFile.originalname ||
              !profilePictureFile.mimetype
            ) {
              throw new BadRequestException(
                'Invalid file: missing originalname or mimetype',
              );
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
            try {
              profileUpdateData.profile_picture =
                await this.mediaClientService.getFileUrl(
                  mediaResponse.id,
                  false,
                );
              this.logger.log(
                `Profile picture URL retrieved successfully: ${profileUpdateData.profile_picture} for media ID: ${mediaResponse.id}`,
              );
            } catch (urlError) {
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
              profileUpdateData.profile_picture = fallbackUrl;
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

        if (profileBackgroundFile) {
          try {
            if (
              !profileBackgroundFile.originalname ||
              !profileBackgroundFile.mimetype
            ) {
              throw new BadRequestException(
                'Invalid file: missing originalname or mimetype',
              );
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
            try {
              profileUpdateData.profile_background =
                await this.mediaClientService.getFileUrl(
                  mediaResponse.id,
                  false,
                );
              this.logger.log(
                `Profile background URL retrieved successfully: ${profileUpdateData.profile_background} for media ID: ${mediaResponse.id}`,
              );
            } catch (urlError) {
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
              profileUpdateData.profile_background = fallbackUrl;
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

      if (updateUserDto.full_name !== undefined)
        profileUpdateData.full_name = updateUserDto.full_name || null;
      if (updateUserDto.profile_picture !== undefined && !hasFileUploads)
        profileUpdateData.profile_picture =
          updateUserDto.profile_picture || null;
      if (updateUserDto.profile_background !== undefined && !hasFileUploads)
        profileUpdateData.profile_background =
          updateUserDto.profile_background || null;
      if (updateUserDto.tagline !== undefined)
        profileUpdateData.tagline = updateUserDto.tagline || null;
      if (updateUserDto.profile_bio !== undefined)
        profileUpdateData.profile_bio = updateUserDto.profile_bio || null;
      if (updateUserDto.profile_gender !== undefined)
        profileUpdateData.profile_gender = updateUserDto.profile_gender || null;
      if (updateUserDto.profile_birthday !== undefined) {
        profileUpdateData.profile_birthday = updateUserDto.profile_birthday
          ? new Date(updateUserDto.profile_birthday)
          : null;
      }
      if (updateUserDto.profile_website !== undefined)
        profileUpdateData.profile_website =
          updateUserDto.profile_website || null;
      if (updateUserDto.profile_location !== undefined)
        profileUpdateData.profile_location =
          updateUserDto.profile_location || null;

      if (profile) {
        await this.prisma.userProfile.update({
          where: { id: profile.id },
          data: profileUpdateData,
        });
      } else {
        await this.prisma.userProfile.create({
          data: { user_id: userId, created_by: adminId, ...profileUpdateData },
        });
      }
    }

    await this.invalidateUserCache(userId);

    return {
      message: 'User updated successfully',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        auth_type: updatedUser.auth_type,
        is_active: updatedUser.is_active,
        is_verified: updatedUser.is_verified,
        updated_at: updatedUser.updated_at,
      },
    };
  }

  async deleteUser(userId: number, adminId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (userId === adminId) {
      throw new BadRequestException('Cannot delete your own account');
    }

    if (user.role === 'admin') {
      throw new BadRequestException('Cannot delete admin accounts');
    }

    if (user.is_deleted) {
      return { message: 'User is already deleted.' };
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        is_deleted: true,
        is_active: false,
        deleted_at: new Date(),
        access_token: null,
        refresh_token: null,
        updated_by: adminId,
      },
    });

    this.logger.log(`User ${userId} soft-deleted by admin ${adminId}`);

    return {
      message: 'User deleted successfully. They cannot log in anymore.',
    };
  }

  async getDeletedUsers(listQueryDto: ListUsersQueryDto) {
    return this.getUsers(listQueryDto, { onlyDeleted: true });
  }

  async restoreUser(userId: number, adminId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (!user.is_deleted) throw new BadRequestException('User is not deleted');

    const clash = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: user.email, is_deleted: false },
          { username: user.username, is_deleted: false },
        ],
      },
    });
    if (clash) {
      throw new ConflictException(
        'Cannot restore: another active user has taken this email or username.',
      );
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        is_deleted: false,
        deleted_at: null,
        is_active: true,
        updated_by: adminId,
      },
    });

    this.logger.log(`User ${userId} restored by admin ${adminId}`);

    return { message: 'User restored successfully.' };
  }

  async hardDeleteUser(userId: number, adminId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (userId === adminId)
      throw new BadRequestException('Cannot hard-delete your own account');
    if (user.role === 'admin')
      throw new BadRequestException('Cannot hard-delete admin accounts');

    const [postCount, pollCount, postComments, pollComments] =
      await Promise.all([
        this.prisma.userPost.count({ where: { user_id: userId } }),
        this.prisma.userPoll.count({ where: { user_id: userId } }),
        this.prisma.postComment.count({ where: { user_id: userId } }),
        this.prisma.pollComment.count({ where: { user_id: userId } }),
      ]);
    const totalContent = postCount + pollCount + postComments + pollComments;

    if (totalContent > 0) {
      throw new ConflictException(
        `Cannot permanently delete: user has ${totalContent} item(s) (posts, polls, or comments). Keep soft-deleted or remove the content first.`,
      );
    }

    await this.prisma.userProfile.deleteMany({ where: { user_id: userId } });
    await this.prisma.userFollower.deleteMany({
      where: { OR: [{ user_id: userId }, { follower_id: userId }] },
    });
    await this.prisma.userTopic.deleteMany({ where: { user_id: userId } });
    await this.prisma.communityUser.deleteMany({ where: { user_id: userId } });
    await this.prisma.user.delete({ where: { id: userId } });

    this.logger.log(`User ${userId} HARD-deleted by admin ${adminId}`);

    return { message: 'User permanently deleted.' };
  }

  // Post Management
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

    const where: any = {};
    const andConditions: any[] = [];

    if (search) {
      andConditions.push({
        OR: [
          { post_title: { contains: search } },
          { post_content: { contains: search } },
          { post_slug: { contains: search } },
        ],
      });
    }

    if (post_status && post_status !== 'all') where.post_status = post_status;
    if (is_featured !== undefined) where.is_featured = is_featured === true;

    if (has_media !== undefined) {
      if (has_media) {
        andConditions.push({
          OR: [
            { post_image: { not: null } },
            { post_video: { not: null } },
            { post_audio: { not: null } },
          ],
        });
      } else {
        where.post_image = null;
        where.post_video = null;
        where.post_audio = null;
      }
    }

    if (media_type) {
      if (media_type === 'image') where.post_image = { not: null };
      else if (media_type === 'video') where.post_video = { not: null };
      else if (media_type === 'audio') where.post_audio = { not: null };
      else if (media_type === 'none') {
        where.post_image = null;
        where.post_video = null;
        where.post_audio = null;
      }
    }

    if (user_id) where.user_id = user_id;
    if (topic_id) where.post_topic_id = topic_id;
    if (created_from)
      where.created_at = { ...where.created_at, gte: new Date(created_from) };
    if (created_to)
      where.created_at = { ...where.created_at, lte: new Date(created_to) };
    if (andConditions.length > 0) where.AND = andConditions;

    const allowedSortFields = [
      'id',
      'post_title',
      'like_count',
      'comment_count',
      'view_count',
      'created_at',
      'updated_at',
    ];
    const sortField = allowedSortFields.includes(sort_by)
      ? sort_by
      : 'created_at';
    const orderBy: any = { [sortField]: sort_order.toLowerCase() };
    const skip = (page - 1) * limit;

    const total = await this.prisma.userPost.count({ where });

    const posts = await this.prisma.userPost.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: { user: true, topic: true },
    });

    const userIds = [
      ...new Set(posts.map((post) => post.user_id).filter(Boolean)),
    ];

    const profiles =
      userIds.length > 0
        ? await this.prisma.userProfile.findMany({
            where: { user_id: { in: userIds } },
          })
        : [];

    const profileMap = new Map(profiles.map((p) => [p.user_id, p]));

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
      meta: { total, page, limit, total_pages: Math.ceil(total / limit) },
    };
  }

  async getPostById(postId: number) {
    return this.postService.getPostById(postId, undefined, true);
  }

  async createPost(
    createPostDto: CreatePostDto,
    adminId: number,
    files?: Express.Multer.File[],
  ) {
    return this.postService.createPost(createPostDto, adminId, files);
  }

  async updatePost(
    postId: number,
    updatePostDto: UpdatePostDto,
    adminId: number,
    files?: Express.Multer.File[],
  ) {
    this.logger.debug(
      `UpdatePost - is_featured value: ${JSON.stringify(updatePostDto.is_featured)}, type: ${typeof updatePostDto.is_featured}`,
    );

    const post = await this.prisma.userPost.findUnique({
      where: { id: postId },
    });

    if (!post) throw new NotFoundException('Post not found');

    if (updatePostDto.post_topic_id) {
      const topic = await this.prisma.topic.findFirst({
        where: { id: updatePostDto.post_topic_id, is_active: true },
      });
      if (!topic) throw new NotFoundException('Topic not found or inactive');
    }

    if (updatePostDto.post_slug && updatePostDto.post_slug !== post.post_slug) {
      const existingPost = await this.prisma.userPost.findFirst({
        where: { post_slug: updatePostDto.post_slug },
      });
      if (existingPost)
        throw new ConflictException('Post with this slug already exists');
    }

    const updateData: any = { updated_by: adminId };

    if (files && files.length > 0) {
      for (const file of files) {
        try {
          const mediaResponse = await this.mediaClientService.uploadFile(file, {
            folder: 'posts',
            userId: adminId,
            optimize: true,
            is_public: false,
          });
          if (file.mimetype.startsWith('image/')) {
            updateData.post_image = this.mediaClientService.buildFileUrl(
              mediaResponse.file_path,
            );
          } else if (file.mimetype.startsWith('video/')) {
            this.logger.warn(
              `Video file upload attempted during post update (postId: ${postId}). Video updates are disabled.`,
            );
          } else if (file.mimetype.startsWith('audio/')) {
            updateData.post_audio = this.mediaClientService.buildFileUrl(
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

    if (
      updatePostDto.post_image &&
      !files?.some((f) => f.mimetype.startsWith('image/'))
    ) {
      updateData.post_image = updatePostDto.post_image;
    }
    if (
      updatePostDto.post_audio &&
      !files?.some((f) => f.mimetype.startsWith('audio/'))
    ) {
      updateData.post_audio = updatePostDto.post_audio;
    }

    if (updatePostDto.community_ids !== undefined) {
      updateData.community_ids =
        updatePostDto.community_ids.length > 0
          ? updatePostDto.community_ids.join(',')
          : null;
    }

    if (updatePostDto.post_tags !== undefined) {
      updateData.post_tags =
        updatePostDto.post_tags.length > 0
          ? updatePostDto.post_tags.join(',')
          : null;
    }

    if (updatePostDto.post_slug !== undefined)
      updateData.post_slug = updatePostDto.post_slug;
    if (updatePostDto.post_title !== undefined)
      updateData.post_title = updatePostDto.post_title;
    if (updatePostDto.post_content !== undefined)
      updateData.post_content = updatePostDto.post_content;
    if (updatePostDto.post_link !== undefined)
      updateData.post_link = updatePostDto.post_link;
    if (updatePostDto.post_status !== undefined)
      updateData.post_status = updatePostDto.post_status;
    if (updatePostDto.post_topic_id !== undefined)
      updateData.post_topic_id = updatePostDto.post_topic_id;
    if (updatePostDto.is_featured !== undefined)
      updateData.is_featured = updatePostDto.is_featured === 'featured';

    await this.prisma.userPost.update({
      where: { id: postId },
      data: updateData,
    });

    return this.postService.getPostById(postId, undefined, true);
  }

  async updatePostStatus(
    postId: number,
    updatePostStatusDto: UpdatePostStatusDto,
    adminId: number,
  ) {
    const post = await this.prisma.userPost.findUnique({
      where: { id: postId },
    });

    if (!post) throw new NotFoundException('Post not found');

    const updateData: any = { updated_by: adminId };
    if (updatePostStatusDto.post_status !== undefined)
      updateData.post_status = updatePostStatusDto.post_status;
    if (updatePostStatusDto.is_featured !== undefined)
      updateData.is_featured = !!updatePostStatusDto.is_featured;

    await this.prisma.userPost.update({
      where: { id: postId },
      data: updateData,
    });

    const updatedPost = await this.postService.getPostById(
      postId,
      undefined,
      true,
    );

    return { message: 'Post status updated successfully', post: updatedPost };
  }

  async deletePost(postId: number, adminId: number) {
    const post = await this.prisma.userPost.findUnique({
      where: { id: postId },
    });

    if (!post) throw new NotFoundException('Post not found');

    const comments = await this.prisma.postComment.findMany({
      where: { post_id: postId },
    });

    if (comments.length > 0) {
      const commentIds = comments.map((c) => c.id);
      await this.prisma.commentLike.deleteMany({
        where: { comment_id: { in: commentIds } },
      });
    }

    await this.prisma.postComment.deleteMany({ where: { post_id: postId } });
    await this.prisma.postLike.deleteMany({ where: { post_id: postId } });
    await this.prisma.userPost.deleteMany({ where: { id: postId } });

    return {
      message: 'Post and all related data permanently deleted successfully',
    };
  }

  // Comment Management
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

    const where: any = {};

    if (search) where.comment_content = { contains: search };
    if (is_approved !== undefined)
      where.is_approved = is_approved === ApprovedStatus.APPROVED;
    if (post_id) where.post_id = post_id;
    if (user_id) where.user_id = user_id;
    if (created_from)
      where.created_at = { ...where.created_at, gte: new Date(created_from) };
    if (created_to)
      where.created_at = { ...where.created_at, lte: new Date(created_to) };

    if (has_replies === RepliesStatus.WITH_REPLIES) {
      const rows = await this.prisma.$queryRawUnsafe<{ id: number }[]>(
        `SELECT DISTINCT parent_comment_id as id FROM post_comments WHERE parent_comment_id IS NOT NULL`,
      );
      const ids = rows.map((r) => r.id);
      if (ids.length > 0) where.id = { in: ids };
      else return { data: [], meta: { total: 0, page, limit, total_pages: 0 } };
    } else if (has_replies === RepliesStatus.WITHOUT_REPLIES) {
      const rows = await this.prisma.$queryRawUnsafe<{ id: number }[]>(
        `SELECT DISTINCT parent_comment_id as id FROM post_comments WHERE parent_comment_id IS NOT NULL`,
      );
      const withRepliesIds = rows.map((r) => r.id);
      if (withRepliesIds.length > 0) where.id = { notIn: withRepliesIds };
    }

    const allowedSortFields = [
      'id',
      'like_count',
      'replies_count',
      'created_at',
      'updated_at',
    ];
    const sortField = allowedSortFields.includes(sort_by)
      ? sort_by
      : 'created_at';
    const orderBy: any = { [sortField]: sort_order.toLowerCase() };
    const skip = (page - 1) * limit;

    const total = await this.prisma.postComment.count({ where });

    const comments = await this.prisma.postComment.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: { user: true, post: true },
    });

    const userIds = new Set<number>();
    comments.forEach((comment: any) => {
      if (comment.user_id) userIds.add(comment.user_id);
    });

    const userProfilesMap = new Map<number, any>();
    if (userIds.size > 0) {
      const profiles = await this.prisma.userProfile.findMany({
        where: { user_id: { in: Array.from(userIds) } },
      });
      profiles.forEach((p) => {
        userProfilesMap.set(p.user_id, p);
      });
    }

    const mappedData = await Promise.all(
      comments.map(async (comment: any) => {
        const repliesCount = await this.prisma.postComment.count({
          where: { parent_comment_id: comment.id },
        });
        const commentWithExtras: any = {
          ...comment,
          replies_count: repliesCount,
        };
        if (comment.user && userProfilesMap.has(comment.user.id)) {
          const profile = userProfilesMap.get(comment.user.id);
          commentWithExtras.user.profile_picture =
            profile?.profile_picture || null;
          commentWithExtras.user.full_name = profile?.full_name || null;
        }
        return this.commentService.mapPostCommentToResponseDto(
          commentWithExtras,
        );
      }),
    );

    return {
      data: mappedData,
      meta: { total, page, limit, total_pages: Math.ceil(total / limit) },
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
    const comment = await this.prisma.postComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) throw new NotFoundException('Comment not found');

    const updateData: any = { updated_by: adminId };
    if (updateCommentDto.comment_content !== undefined)
      updateData.comment_content = updateCommentDto.comment_content;
    if (updateCommentDto.is_approved !== undefined)
      updateData.is_approved = updateCommentDto.is_approved;

    await this.prisma.postComment.update({
      where: { id: commentId },
      data: updateData,
    });

    return this.commentService.getCommentById(commentId);
  }

  async deleteComment(commentId: number, adminId: number) {
    const comment = await this.prisma.postComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) throw new NotFoundException('Comment not found');

    const repliesCount = await this.prisma.postComment.count({
      where: { parent_comment_id: commentId },
    });

    if (repliesCount > 0) {
      await this.prisma.postComment.update({
        where: { id: commentId },
        data: { is_approved: false, updated_by: adminId },
      });
      return { message: 'Comment deleted successfully (soft delete)' };
    }

    await this.prisma.postComment.delete({ where: { id: commentId } });

    await this.prisma.userPost.update({
      where: { id: comment.post_id },
      data: { comment_count: { decrement: 1 } },
    });

    return { message: 'Comment deleted successfully' };
  }

  async getCommentReplies(
    commentId: number,
    listQueryDto: ListCommentsQueryDto,
  ) {
    const { is_approved, ...rest } = listQueryDto;
    const commentListQueryDto: any = {
      ...rest,
      is_approved:
        is_approved === ApprovedStatus.APPROVED
          ? true
          : is_approved === ApprovedStatus.NOT_APPROVED
            ? false
            : undefined,
    };
    return this.commentService.getCommentReplies(
      commentId,
      commentListQueryDto,
    );
  }

  // Topic Management
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

    const where: any = {};

    if (search) {
      where.OR = [
        { topic_name: { contains: search } },
        { topic_slug: { contains: search } },
        { topic_description: { contains: search } },
      ];
    }

    if (is_active) where.is_active = is_active === ActiveStatus.ACTIVE;
    if (parent_id !== undefined) where.parent_id = parent_id;

    if (type) {
      if (type === 'categories') where.parent_id = 0;
      else if (type === 'subtopics') where.parent_id = { gt: 0 };
    }

    if (created_from)
      where.created_at = { ...where.created_at, gte: new Date(created_from) };
    if (created_to)
      where.created_at = { ...where.created_at, lte: new Date(created_to) };

    if (has_children === ChildrenStatus.WITH_CHILDREN) {
      const rows = await this.prisma.$queryRawUnsafe<{ parent_id: number }[]>(
        `SELECT DISTINCT parent_id FROM topics WHERE parent_id > 0`,
      );
      const ids = rows.map((r) => r.parent_id);
      if (ids.length > 0) where.id = { in: ids };
      else return { data: [], meta: { total: 0, page, limit, total_pages: 0 } };
    } else if (has_children === ChildrenStatus.WITHOUT_CHILDREN) {
      const rows = await this.prisma.$queryRawUnsafe<{ parent_id: number }[]>(
        `SELECT DISTINCT parent_id FROM topics WHERE parent_id > 0`,
      );
      const withChildrenIds = rows.map((r) => r.parent_id);
      if (withChildrenIds.length > 0) where.id = { notIn: withChildrenIds };
    }

    const allowedSortFields = [
      'id',
      'topic_name',
      'topic_slug',
      'created_at',
      'updated_at',
    ];
    const sortField = allowedSortFields.includes(sort_by)
      ? sort_by
      : 'created_at';
    const orderBy: any = { [sortField]: sort_order.toLowerCase() };
    const skip = (page - 1) * limit;

    const total = await this.prisma.topic.count({ where });

    const topics: any[] = await this.prisma.topic.findMany({
      where,
      orderBy,
      skip,
      take: limit,
    });

    const isFetchingParents = parent_id === undefined || parent_id === 0;

    if (isFetchingParents && topics.length > 0) {
      const parentTopicIds = topics
        .filter((t) => t.parent_id === 0)
        .map((t) => t.id);

      if (parentTopicIds.length > 0) {
        const childWhere: any = { parent_id: { in: parentTopicIds } };
        if (is_active) childWhere.is_active = is_active === ActiveStatus.ACTIVE;
        else childWhere.is_active = true;
        if (search) {
          childWhere.OR = [
            { topic_name: { contains: search } },
            { topic_slug: { contains: search } },
            { topic_description: { contains: search } },
          ];
        }

        const childTopics = await this.prisma.topic.findMany({
          where: childWhere,
          orderBy: [{ parent_id: 'asc' }, { created_at: 'asc' }],
        });

        const childrenByParent = new Map<number, any[]>();
        childTopics.forEach((child) => {
          if (!childrenByParent.has(child.parent_id))
            childrenByParent.set(child.parent_id, []);
          childrenByParent.get(child.parent_id)!.push(child);
        });

        topics.forEach((topic) => {
          if (topic.parent_id === 0)
            topic.children = childrenByParent.get(topic.id) || [];
        });
      }
    }

    // For child topics, fetch parent info separately
    const childTopicEntries = topics.filter((t) => t.parent_id > 0);
    const uniqueParentIds = [
      ...new Set(childTopicEntries.map((t) => t.parent_id)),
    ] as number[];
    const parentInfoMap = new Map<number, any>();
    if (uniqueParentIds.length > 0) {
      const parentInfos = await this.prisma.topic.findMany({
        where: { id: { in: uniqueParentIds } },
        select: { id: true, topic_name: true, topic_slug: true },
      });
      parentInfos.forEach((p) => parentInfoMap.set(p.id, p));
    }

    const topicsWithUsage = await Promise.all(
      topics.map(async (topic) => {
        const postsCount = await this.prisma.userPost.count({
          where: { post_topic_id: topic.id, post_status: 'published' },
        });
        const communitiesCount = await this.prisma.communityTopic.count({
          where: { topic_id: topic.id, is_active: true },
        });
        const parentInfo =
          topic.parent_id > 0 ? parentInfoMap.get(topic.parent_id) : null;
        return {
          ...topic,
          posts_count: postsCount,
          communities_count: communitiesCount,
          usage_count: postsCount + communitiesCount,
          ...(parentInfo && { parent_name: parentInfo.topic_name }),
          ...(topic.children &&
            topic.children.length > 0 && {
              children: topic.children.map((child: any) => ({
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
      meta: { total, page, limit, total_pages: Math.ceil(total / limit) },
    };
  }

  async getTopicsForSelectList(): Promise<TopicSelectListDto[]> {
    return this.generalService.getTopicsForSelectList();
  }

  async getParentTopics(listQueryDto: ListQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sort_by = 'created_at',
      sort_order = 'DESC',
    } = listQueryDto;

    const where: any = { parent_id: 0 };

    if (search) {
      where.OR = [
        { topic_name: { contains: search } },
        { topic_slug: { contains: search } },
        { topic_description: { contains: search } },
      ];
    }

    const allowedSortFields = [
      'id',
      'topic_name',
      'topic_slug',
      'created_at',
      'updated_at',
    ];
    const sortField = allowedSortFields.includes(sort_by)
      ? sort_by
      : 'created_at';
    const orderBy: any = { [sortField]: sort_order.toLowerCase() };
    const skip = (page - 1) * limit;

    const total = await this.prisma.topic.count({ where });

    const topics: any[] = await this.prisma.topic.findMany({
      where,
      orderBy,
      skip,
      take: limit,
    });

    // getParentTopics only fetches parent_id=0 rows, so no parent lookup needed
    const topicsWithUsage = await Promise.all(
      topics.map(async (topic) => {
        const postsCount = await this.prisma.userPost.count({
          where: { post_topic_id: topic.id, post_status: 'published' },
        });
        const communitiesCount = await this.prisma.communityTopic.count({
          where: { topic_id: topic.id, is_active: true },
        });
        const childrenCount = await this.prisma.topic.count({
          where: { parent_id: topic.id, is_active: true },
        });
        return {
          ...topic,
          posts_count: postsCount,
          communities_count: communitiesCount,
          children_count: childrenCount,
          usage_count: postsCount + communitiesCount,
        };
      }),
    );

    return {
      data: topicsWithUsage,
      meta: { total, page, limit, total_pages: Math.ceil(total / limit) },
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
      return await this.generalService.createTopic(
        createTopicDto,
        adminId,
        file,
      );
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      console.error('Error in admin createTopic:', error);
      throw new BadRequestException(
        `Failed to create topic: ${error.message || 'Unknown error'}`,
      );
    }
  }

  async updateTopic(
    topicId: number,
    updateTopicDto: UpdateTopicDto,
    adminId: number,
    file?: Express.Multer.File,
  ) {
    return this.generalService.updateTopic(
      topicId,
      updateTopicDto,
      adminId,
      file,
    );
  }

  async updateTopicStatus(
    topicId: number,
    updateTopicStatusDto: UpdateTopicStatusDto,
    adminId: number,
  ) {
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
    });

    if (!topic) throw new NotFoundException('Topic not found');

    await this.generalService.updateTopic(
      topicId,
      { is_active: updateTopicStatusDto.is_active },
      adminId,
    );

    const updatedTopic = await this.generalService.getTopicById(topicId);

    return {
      message: 'Topic status updated successfully',
      topic: updatedTopic,
    };
  }

  async deleteTopic(
    topicId: number,
    adminId: number,
  ): Promise<{ message: string }> {
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
    });

    if (!topic) throw new NotFoundException('Topic not found');

    const childrenCount = await this.prisma.topic.count({
      where: { parent_id: topicId },
    });
    if (childrenCount > 0) {
      throw new BadRequestException(
        `Cannot delete topic: This topic has ${childrenCount} child topic(s). Please delete or reassign child topics first.`,
      );
    }

    const postsCount = await this.prisma.userPost.count({
      where: { post_topic_id: topicId },
    });
    if (postsCount > 0) {
      throw new BadRequestException(
        `Cannot delete topic: This topic is used in ${postsCount} post(s). The topic is currently in use and cannot be deleted.`,
      );
    }

    const communityTopicsCount = await this.prisma.communityTopic.count({
      where: { topic_id: topicId },
    });
    if (communityTopicsCount > 0) {
      throw new BadRequestException(
        `Cannot delete topic: This topic is associated with ${communityTopicsCount} community/communities. The topic is currently in use and cannot be deleted.`,
      );
    }

    const userTopicsCount = await this.prisma.userTopic.count({
      where: { topic_id: topicId },
    });
    if (userTopicsCount > 0) {
      throw new BadRequestException(
        `Cannot delete topic: This topic is subscribed by ${userTopicsCount} user(s). The topic is currently in use and cannot be deleted.`,
      );
    }

    await this.prisma.topic.delete({ where: { id: topicId } });

    this.logger.log(
      `Topic ${topicId} permanently deleted from database by admin ${adminId}`,
    );

    return { message: 'Topic permanently deleted from database' };
  }

  // Community Management
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

    const where: any = {};

    if (search) {
      where.OR = [
        { community_name: { contains: search } },
        { community_slug: { contains: search } },
        { community_description: { contains: search } },
      ];
    }

    if (is_active !== undefined)
      where.is_active = is_active === ActiveStatus.ACTIVE;
    if (category_id) where.category_id = category_id;
    if (created_from)
      where.created_at = { ...where.created_at, gte: new Date(created_from) };
    if (created_to)
      where.created_at = { ...where.created_at, lte: new Date(created_to) };

    if (min_members !== undefined || max_members !== undefined) {
      let paramIndex = 1;
      const havingParts: string[] = [];
      const havingParams: any[] = [];
      if (min_members !== undefined) {
        havingParts.push(`member_count >= $${paramIndex++}`);
        havingParams.push(Number(min_members));
      }
      if (max_members !== undefined) {
        havingParts.push(`member_count <= $${paramIndex++}`);
        havingParams.push(Number(max_members));
      }
      const havingClause = havingParts.join(' AND ');

      const rows = await this.prisma.$queryRawUnsafe<
        { community_id: number }[]
      >(
        `SELECT community_id, COUNT(*) as member_count
         FROM community_users WHERE is_active = true
         GROUP BY community_id HAVING ${havingClause}`,
        ...havingParams,
      );
      const communityIdFilter = rows.map((r) => r.community_id);
      if (communityIdFilter.length > 0) where.id = { in: communityIdFilter };
      else return { data: [], meta: { total: 0, page, limit, total_pages: 0 } };
    }

    const allowedSortFields = [
      'id',
      'community_name',
      'community_slug',
      'members_count',
      'created_at',
      'updated_at',
    ];
    const sortField = allowedSortFields.includes(sort_by)
      ? sort_by
      : 'created_at';
    const skip = (page - 1) * limit;

    const total = await this.prisma.community.count({ where });

    if (sortField === 'members_count') {
      const whereIds = where.id?.in;
      const idFilter =
        whereIds && whereIds.length > 0
          ? `AND c.id IN (${whereIds.join(',')})`
          : '';
      const isActiveFilter =
        where.is_active !== undefined
          ? `AND c.is_active = ${where.is_active ? 'true' : 'false'}`
          : '';
      const sortRows = await this.prisma.$queryRawUnsafe<
        { community_id: number }[]
      >(
        `SELECT c.id as community_id
         FROM communities c
         LEFT JOIN (
           SELECT community_id, COUNT(*) as cnt
           FROM community_users WHERE is_active = true
           GROUP BY community_id
         ) mc ON mc.community_id = c.id
         WHERE 1=1 ${idFilter} ${isActiveFilter}
         ORDER BY COALESCE(mc.cnt, 0) ${sort_order}
         LIMIT ${Number(limit)} OFFSET ${skip}`,
      );
      const sortedIds = sortRows.map((r) => r.community_id);
      if (sortedIds.length === 0) {
        return {
          data: [],
          meta: { total, page, limit, total_pages: Math.ceil(total / limit) },
        };
      }
      const communities = await this.prisma.community.findMany({
        where: { id: { in: sortedIds } },
      });
      const communityMap = new Map(communities.map((c) => [c.id, c]));
      const orderedCommunities = sortedIds
        .map((id) => communityMap.get(id))
        .filter(Boolean);
      const communitiesWithCounts = await this.enrichCommunities(
        orderedCommunities as any[],
      );
      return {
        data: communitiesWithCounts,
        meta: { total, page, limit, total_pages: Math.ceil(total / limit) },
      };
    }

    const orderBy: any = { [sortField]: sort_order.toLowerCase() };
    const communities = await this.prisma.community.findMany({
      where,
      orderBy,
      skip,
      take: limit,
    });
    const communitiesWithCounts = await this.enrichCommunities(communities);

    return {
      data: communitiesWithCounts,
      meta: { total, page, limit, total_pages: Math.ceil(total / limit) },
    };
  }

  private async enrichCommunities(communities: any[]) {
    const communityIds = communities.map((c) => c.id);

    const communityTopics =
      communityIds.length > 0
        ? await this.prisma.communityTopic.findMany({
            where: { community_id: { in: communityIds }, is_active: true },
            include: { topic: true },
          })
        : [];

    const topicsByCommunity = new Map<number, any[]>();
    communityTopics.forEach((ct: any) => {
      if (!topicsByCommunity.has(ct.community_id))
        topicsByCommunity.set(ct.community_id, []);
      if (ct.topic) {
        topicsByCommunity.get(ct.community_id)!.push({
          id: ct.topic.id,
          topic_name: ct.topic.topic_name,
          topic_slug: ct.topic.topic_slug,
        });
      }
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return Promise.all(
      communities.map(async (community) => {
        const memberCount = await this.prisma.communityUser.count({
          where: { community_id: community.id, is_active: true },
        });
        const topicCount = await this.prisma.communityTopic.count({
          where: { community_id: community.id, is_active: true },
        });

        const last30DaysPostsResult = await this.prisma.$queryRawUnsafe<any[]>(
          `SELECT COUNT(*) as cnt FROM user_posts
           WHERE $1::text = ANY(string_to_array(community_ids, ','))
           AND created_at >= $2`,
          community.id.toString(),
          thirtyDaysAgo,
        );
        const posts_per_day = parseFloat(
          ((Number(last30DaysPostsResult[0]?.cnt) || 0) / 30).toFixed(2),
        );

        return {
          ...community,
          member_count: memberCount,
          topic_count: topicCount,
          posts_per_day,
          topics: topicsByCommunity.get(community.id) || [],
        };
      }),
    );
  }

  async getCommunityById(communityId: number) {
    return this.communityService.getCommunityById(communityId);
  }

  async createCommunity(
    createCommunityDto: CreateCommunityDto,
    adminId: number,
    file?: Express.Multer.File,
  ) {
    return this.communityService.createCommunity(
      createCommunityDto,
      adminId,
      file,
    );
  }

  async updateCommunity(
    communityId: number,
    updateCommunityDto: UpdateCommunityDto,
    adminId: number,
    file?: Express.Multer.File,
  ) {
    const community = await this.prisma.community.findUnique({
      where: { id: communityId },
    });

    if (!community) throw new NotFoundException('Community not found');

    if (
      updateCommunityDto.community_slug &&
      updateCommunityDto.community_slug !== community.community_slug
    ) {
      const existingCommunity = await this.prisma.community.findFirst({
        where: { community_slug: updateCommunityDto.community_slug },
      });
      if (existingCommunity)
        throw new ConflictException('Community with this slug already exists');
    }

    const transformIsActive = (value: any): boolean | undefined => {
      if (value === undefined || value === null || value === '')
        return undefined;
      if (typeof value === 'boolean') return value;
      const stringValue = String(value).toLowerCase().trim();
      if (
        stringValue === 'active' ||
        stringValue === 'true' ||
        stringValue === '1'
      )
        return true;
      if (
        stringValue === 'inactive' ||
        stringValue === 'false' ||
        stringValue === '0'
      )
        return false;
      if (value === 1 || value === '1') return true;
      if (value === 0 || value === '0') return false;
      return undefined;
    };

    const { topic_ids, ...communityUpdateData } = updateCommunityDto;
    const updateData: any = { updated_by: adminId };

    if (communityUpdateData.community_slug !== undefined)
      updateData.community_slug = communityUpdateData.community_slug;
    if (communityUpdateData.community_name !== undefined)
      updateData.community_name = communityUpdateData.community_name;
    if (communityUpdateData.community_description !== undefined)
      updateData.community_description =
        communityUpdateData.community_description;
    if (communityUpdateData.community_image !== undefined)
      updateData.community_image = communityUpdateData.community_image;

    let activeValue: any = undefined;
    if ('is_active' in updateCommunityDto)
      activeValue = updateCommunityDto.is_active;
    else if ('active' in updateCommunityDto)
      activeValue = (updateCommunityDto as any).active;

    if (
      activeValue !== undefined &&
      activeValue !== null &&
      activeValue !== ''
    ) {
      const transformedIsActive = transformIsActive(activeValue);
      if (transformedIsActive !== undefined) {
        updateData.is_active = transformedIsActive;
      } else if (typeof activeValue === 'boolean') {
        updateData.is_active = activeValue;
      } else {
        this.logger.warn(
          `Unable to transform is_active value: ${activeValue} (type: ${typeof activeValue})`,
        );
        const stringValue = String(activeValue).toLowerCase().trim();
        if (
          stringValue === 'active' ||
          stringValue === 'true' ||
          stringValue === '1'
        )
          updateData.is_active = true;
        else if (
          stringValue === 'inactive' ||
          stringValue === 'false' ||
          stringValue === '0'
        )
          updateData.is_active = false;
      }
    }

    if (file) {
      try {
        const mediaResponse = await this.mediaClientService.uploadFile(file, {
          folder: 'communities',
          userId: adminId,
          optimize: true,
          is_public: true,
        });
        updateData.community_image = this.mediaClientService.buildFileUrl(
          mediaResponse.file_path,
        );
      } catch (error) {
        throw new BadRequestException('Failed to upload community image');
      }
    }

    await this.prisma.community.update({
      where: { id: communityId },
      data: updateData,
    });

    if (updateCommunityDto.topic_ids !== undefined) {
      const existingTopics = await this.prisma.communityTopic.findMany({
        where: { community_id: communityId },
      });
      const topicIdsToKeep = updateCommunityDto.topic_ids || [];
      const existingTopicIds = existingTopics.map((ct) => ct.topic_id);
      const topicIdsToAdd = topicIdsToKeep.filter(
        (id) => !existingTopicIds.includes(id),
      );
      const topicIdsToRemove = existingTopicIds.filter(
        (id) => !topicIdsToKeep.includes(id),
      );

      if (topicIdsToAdd.length > 0) {
        const topicsToAdd = await this.prisma.topic.findMany({
          where: { id: { in: topicIdsToAdd }, is_active: true },
        });
        if (topicsToAdd.length !== topicIdsToAdd.length) {
          throw new BadRequestException(
            'One or more topics not found or inactive',
          );
        }
        await this.prisma.communityTopic.createMany({
          data: topicIdsToAdd.map((topicId) => ({
            community_id: communityId,
            topic_id: topicId,
            is_active: true,
            created_by: adminId,
          })),
        });
      }

      if (topicIdsToRemove.length > 0) {
        await this.prisma.communityTopic.updateMany({
          where: {
            community_id: communityId,
            topic_id: { in: topicIdsToRemove },
          },
          data: { is_active: false, updated_by: adminId },
        });
      }
    }

    return this.communityService.getCommunityById(communityId);
  }

  private buildUsersWhere(
    listQueryDto: ListUsersQueryDto,
    options: { onlyDeleted?: boolean } = {},
  ): Prisma.UserWhereInput {
    const {
      search,
      role,
      is_active,
      is_verified,
      created_from,
      created_to,
      user_id,
    } = listQueryDto;

    const where: Prisma.UserWhereInput = {};

    if (options.onlyDeleted) {
      where.is_deleted = true;
    } else {
      where.is_deleted = false;
    }

    if (search) {
      where.OR = [
        { username: { contains: search } },
        { email: { contains: search } },
        { profile: { full_name: { contains: search } } },
      ];
    }

    if (role && role !== 'all') where.role = role;
    if (is_active !== undefined)
      where.is_active = is_active === ActiveStatus.ACTIVE;
    if (is_verified !== undefined)
      where.is_verified = is_verified === VerifiedStatus.VERIFIED;
    if (user_id) where.id = user_id;
    if (created_from || created_to) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (created_from) dateFilter.gte = new Date(created_from);
      if (created_to) dateFilter.lte = new Date(created_to);
      where.created_at = dateFilter;
    }

    return where;
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
    return allowedSortFields.includes(sort_by) ? sort_by : 'created_at';
  }

  // ========== Bulk Operations ==========

  async bulkUpdateUsers(bulkUpdateDto: BulkUpdateDto, adminId: number) {
    const { ids, updates } = bulkUpdateDto;

    if (ids.length === 0) {
      throw new BadRequestException('At least one user ID is required');
    }

    if (updates.is_active === false && ids.includes(adminId)) {
      throw new BadRequestException('Cannot deactivate your own account');
    }

    const adminUsers = await this.prisma.user.findMany({
      where: { id: { in: ids }, role: { in: ['admin', 'sub_admin'] } },
      select: { id: true },
    });

    if (adminUsers.length > 0 && updates.role) {
      throw new BadRequestException('Cannot change role of admin accounts');
    }

    await this.prisma.user.updateMany({
      where: { id: { in: ids } },
      data: { ...updates, updated_by: adminId },
    });

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

    await this.prisma.userPost.updateMany({
      where: { id: { in: ids } },
      data: { ...updates, updated_by: adminId },
    });

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

    await this.prisma.postComment.updateMany({
      where: { id: { in: ids } },
      data: { ...updates, updated_by: adminId },
    });

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

    await this.prisma.community.updateMany({
      where: { id: { in: ids } },
      data: { ...updates, updated_by: adminId },
    });

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

    await this.prisma.topic.updateMany({
      where: { id: { in: ids } },
      data: { ...updates, updated_by: adminId },
    });

    return {
      message: `Successfully updated ${ids.length} topic(s)`,
      updated_count: ids.length,
    };
  }

  // ========== Export Functionality ==========

  async exportUsers(listQueryDto: ListUsersQueryDto) {
    const { sort_by = 'created_at', sort_order = 'DESC' } = listQueryDto;

    const where = this.buildUsersWhere(listQueryDto);
    const sortField = this.getUserSortField(sort_by);

    const users = await this.prisma.user.findMany({
      where,
      include: { profile: true },
      orderBy: {
        [sortField]: (sort_order ?? 'DESC').toLowerCase() as 'asc' | 'desc',
      },
    });

    return {
      data: users.map((user) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        auth_type: user.auth_type,
        is_active: user.is_active,
        is_verified: user.is_verified,
        created_at: user.created_at,
        updated_at: user.updated_at,
        profile: user.profile
          ? {
              full_name: user.profile.full_name || null,
              profile_picture: user.profile.profile_picture || null,
              tagline: user.profile.tagline || null,
              bio: user.profile.profile_bio || null,
              location: user.profile.profile_location || null,
              website: user.profile.profile_website || null,
            }
          : null,
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

    const where: any = {};

    if (search) {
      where.OR = [
        { post_title: { contains: search } },
        { post_content: { contains: search } },
      ];
    }
    if (post_status && post_status !== 'all') where.post_status = post_status;
    if (is_featured !== undefined) where.is_featured = is_featured === true;
    if (user_id) where.user_id = user_id;
    if (topic_id) where.post_topic_id = topic_id;
    if (created_from || created_to) {
      where.created_at = {};
      if (created_from) where.created_at.gte = new Date(created_from);
      if (created_to) where.created_at.lte = new Date(created_to);
    }

    const posts = await this.prisma.userPost.findMany({
      where,
      include: { user: true, topic: true },
      orderBy: {
        [sort_by]: (sort_order ?? 'DESC').toLowerCase() as 'asc' | 'desc',
      },
    });

    return {
      data: posts.map((post) => ({
        id: post.id,
        title: post.post_title,
        slug: post.post_slug,
        content: post.post_content
          ? post.post_content.substring(0, 100) + '...'
          : '',
        author: post.user ? post.user.username || 'Unknown' : 'Unknown',
        topic: post.topic
          ? post.topic.topic_name || 'Uncategorized'
          : 'Uncategorized',
        status: post.post_status,
        views: post.view_count || 0,
        likes: post.like_count || 0,
        comments: post.comment_count || 0,
        is_featured: post.is_featured ? 'Yes' : 'No',
        created_at: post.created_at,
      })),
    };
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

    const where: any = {};

    if (search) where.comment_content = { contains: search };
    if (is_approved !== undefined) {
      const approvedValue =
        is_approved === ApprovedStatus.APPROVED
          ? true
          : is_approved === ApprovedStatus.NOT_APPROVED
            ? false
            : undefined;
      if (approvedValue !== undefined) where.is_approved = approvedValue;
    }
    if (post_id) where.post_id = post_id;
    if (user_id) where.user_id = user_id;
    if (created_from || created_to) {
      where.created_at = {};
      if (created_from) where.created_at.gte = new Date(created_from);
      if (created_to) where.created_at.lte = new Date(created_to);
    }

    const comments = await this.prisma.postComment.findMany({
      where,
      include: { user: true, post: true },
      orderBy: {
        [sort_by]: (sort_order ?? 'DESC').toLowerCase() as 'asc' | 'desc',
      },
    });

    return {
      data: comments.map((comment) => ({
        id: comment.id,
        content: comment.comment_content,
        author: comment.user ? comment.user.username || 'Unknown' : 'Unknown',
        post_title: comment.post
          ? comment.post.post_title || 'Unknown Post'
          : 'Unknown Post',
        status: comment.is_approved ? 'Approved' : 'Pending',
        created_at: comment.created_at,
      })),
    };
  }

  async exportCommunities(listQueryDto: ListCommunitiesQueryDto) {
    const {
      search,
      is_active,
      sort_by = 'created_at',
      sort_order = 'DESC',
    } = listQueryDto;

    const where: any = {};

    if (search) {
      where.OR = [
        { community_name: { contains: search } },
        { community_description: { contains: search } },
      ];
    }
    if (is_active !== undefined) where.is_active = is_active;

    const communities = await this.prisma.community.findMany({
      where,
      orderBy: {
        [sort_by]: (sort_order ?? 'DESC').toLowerCase() as 'asc' | 'desc',
      },
    });

    return {
      data: communities.map((community) => ({
        id: community.id,
        name: community.community_name,
        slug: community.community_slug,
        description: community.community_description,
        is_active: community.is_active ? 'Active' : 'Inactive',
        created_at: community.created_at,
      })),
    };
  }

  async exportTopics(listQueryDto: ListTopicsQueryDto) {
    const {
      search,
      is_active,
      parent_id,
      sort_by = 'created_at',
      sort_order = 'DESC',
    } = listQueryDto;

    const where: any = {};

    if (search) {
      where.OR = [
        { topic_name: { contains: search } },
        { topic_description: { contains: search } },
      ];
    }
    if (is_active !== undefined) where.is_active = is_active;
    if (parent_id !== undefined) where.parent_id = parent_id;

    const topics = await this.prisma.topic.findMany({
      where,
      orderBy: {
        [sort_by]: (sort_order ?? 'DESC').toLowerCase() as 'asc' | 'desc',
      },
    });

    return {
      data: topics.map((topic) => ({
        id: topic.id,
        name: topic.topic_name,
        slug: topic.topic_slug,
        description: topic.topic_description,
        is_active: topic.is_active ? 'Active' : 'Inactive',
        created_at: topic.created_at,
      })),
    };
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

    const where: any = {};

    if (search) {
      where.OR = [
        { poll_title: { contains: search } },
        { poll_description: { contains: search } },
      ];
    }
    if (poll_status && poll_status !== 'all') where.poll_status = poll_status;
    if (user_id) where.user_id = user_id;
    if (created_from || created_to) {
      where.created_at = {};
      if (created_from) where.created_at.gte = new Date(created_from);
      if (created_to) where.created_at.lte = new Date(created_to);
    }

    const polls = await this.prisma.userPoll.findMany({
      where,
      include: { user: true },
      orderBy: {
        [sort_by]: (sort_order ?? 'DESC').toLowerCase() as 'asc' | 'desc',
      },
    });

    return {
      data: polls.map((poll) => ({
        id: poll.id,
        question: poll.poll_title,
        created_by: poll.user ? poll.user.username || 'Unknown' : 'Unknown',
        status: poll.poll_status,
        vote_count: poll.vote_count || 0,
        expires_at: poll.poll_expires_at,
        is_featured: poll.is_featured ? 'Yes' : 'No',
        created_at: poll.created_at,
      })),
    };
  }

  async exportSubscriptions(listQueryDto: ListSubscriptionsQueryDto) {
    const {
      search,
      subscription_type,
      is_active,
      sort_by = 'created_at',
      sort_order = 'DESC',
    } = listQueryDto;

    const where: any = {};

    if (subscription_type) where.subscription_type = subscription_type;
    if (is_active !== undefined)
      where.is_active = is_active === ActiveStatus.ACTIVE;
    if (search) {
      where.OR = [
        { subscription_name: { contains: search } },
        { subscription_description: { contains: search } },
      ];
    }

    const subscriptions = await this.prisma.subscription.findMany({
      where,
      orderBy: {
        [sort_by]: (sort_order ?? 'DESC').toLowerCase() as 'asc' | 'desc',
      },
    });

    return {
      data: subscriptions.map((sub) => ({
        id: sub.id,
        name: sub.subscription_name,
        type: sub.subscription_type,
        price: sub.subscription_price,
        duration: `${sub.subscription_duration} ${sub.subscription_duration_type}`,
        is_active: sub.is_active ? 'Active' : 'Inactive',
        created_at: sub.created_at,
      })),
    };
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

    const where: any = {};

    if (user_id) where.user_id = user_id;
    if (users_subscriptions_id)
      where.users_subscriptions_id = users_subscriptions_id;
    if (payment_status) where.payment_status = payment_status;
    if (payment_method) where.payment_method = payment_method;
    if (search) {
      where.OR = [
        { payment_reference: { contains: search } },
        { payment_note: { contains: search } },
      ];
    }

    const payments = await this.prisma.payment.findMany({
      where,
      include: {
        user: true,
        user_subscription: { include: { subscription: true } },
      },
      orderBy: {
        [sort_by]: (sort_order ?? 'DESC').toLowerCase() as 'asc' | 'desc',
      },
    });

    return {
      data: payments.map((payment) => ({
        id: payment.id,
        transaction_id: payment.payment_transaction_id,
        amount: payment.payment_amount,
        currency: payment.payment_currency,
        user_name: payment.user
          ? payment.user.username || payment.user.email
          : 'Unknown',
        subscription_plan:
          (payment.user_subscription as any)?.subscription?.subscription_name ||
          'Unknown',
        status: payment.payment_status,
        method: payment.payment_method,
        gateway: payment.payment_gateway,
        created_at: payment.created_at,
      })),
    };
  }

  // ========== Enhanced Detail Endpoints ==========

  async getPostByIdEnhanced(postId: number) {
    const post = await this.postService.getPostById(postId, undefined, true);

    const postTags = post.post_tags
      ? post.post_tags.split(',').filter(Boolean)
      : [];

    const communityIds = post.community_ids
      ? post.community_ids.split(',').filter(Boolean).map(Number)
      : [];
    const communities = await Promise.all(
      communityIds.map((id) =>
        this.prisma.community.findUnique({
          where: { id },
          select: { id: true, community_name: true, community_slug: true },
        }),
      ),
    );

    const totalInteractions = post.like_count + post.comment_count;
    const engagementRate =
      post.view_count > 0 ? (totalInteractions / post.view_count) * 100 : 0;

    const recentComments = await this.prisma.postComment.count({
      where: {
        post_id: postId,
        created_at: { gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    });
    const trendingScore =
      ((post.like_count * 0.4 + recentComments * 0.6) /
        (post.view_count || 1)) *
      100;

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

    const postsCount = await this.prisma.userPost.count({
      where: { post_topic_id: topicId, post_status: 'published' },
    });
    const communitiesCount = await this.prisma.communityTopic.count({
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

    const replies = await this.prisma.postComment.findMany({
      where: { parent_comment_id: commentId },
      include: { user: true, post: true },
      orderBy: { created_at: 'asc' },
    });

    return {
      ...comment,
      replies,
      replies_count: replies.length,
    };
  }

  async getCommunityByIdEnhanced(communityId: number) {
    const community = await this.communityService.getCommunityById(communityId);

    const postsCountResult = await this.prisma.$queryRawUnsafe<
      { cnt: bigint | number }[]
    >(
      `SELECT COUNT(*) as cnt FROM user_posts WHERE $1::text = ANY(string_to_array(community_ids, ','))`,
      String(communityId),
    );
    const postsCount = Number(postsCountResult[0]?.cnt ?? 0);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const last30DaysResult = await this.prisma.$queryRawUnsafe<
      { cnt: bigint | number }[]
    >(
      `SELECT COUNT(*) as cnt FROM user_posts WHERE $1::text = ANY(string_to_array(community_ids, ',')) AND created_at >= $2`,
      String(communityId),
      thirtyDaysAgo,
    );
    const last30DaysPosts = Number(last30DaysResult[0]?.cnt ?? 0);
    const postsPerDay = parseFloat((last30DaysPosts / 30).toFixed(2));

    const topicsCount = await this.prisma.communityTopic.count({
      where: { community_id: communityId, is_active: true },
    });
    const membersCount = await this.prisma.communityUser.count({
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
    const poll = await this.pollService.getPollById(pollId, undefined, true);

    const pollEntity = await this.prisma.userPoll.findUnique({
      where: { id: pollId },
    });

    if (pollEntity) {
      const now = new Date();
      if (
        pollEntity.poll_expires_at &&
        new Date(pollEntity.poll_expires_at) <= now &&
        pollEntity.poll_status !== 'ended'
      ) {
        await this.prisma.userPoll.update({
          where: { id: pollId },
          data: { poll_status: 'ended' },
        });
        poll.poll_status = 'ended' as any;
      }
    }

    const totalVotes = poll.vote_count;
    const engagementRate =
      poll.view_count > 0 ? (totalVotes / poll.view_count) * 100 : 0;

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

    const [users, userCount] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: term } },
            { email: { contains: term } },
            { profile: { full_name: { contains: term } } },
          ],
        },
        include: { profile: true },
        orderBy: { username: 'asc' },
        take: effectiveLimit,
      }),
      this.prisma.user.count({
        where: {
          OR: [
            { username: { contains: term } },
            { email: { contains: term } },
            { profile: { full_name: { contains: term } } },
          ],
        },
      }),
    ]);

    const [posts, postCount] = await Promise.all([
      this.prisma.userPost.findMany({
        where: {
          post_status: { in: ['published', 'draft'] },
          OR: [
            { post_title: { contains: term } },
            { post_content: { contains: term } },
            { post_slug: { contains: term } },
            { post_tags: { contains: term } },
          ],
        },
        include: { user: { include: { profile: true } } },
        orderBy: { created_at: 'desc' },
        take: effectiveLimit,
      }),
      this.prisma.userPost.count({
        where: {
          post_status: { in: ['published', 'draft'] },
          OR: [
            { post_title: { contains: term } },
            { post_content: { contains: term } },
            { post_slug: { contains: term } },
            { post_tags: { contains: term } },
          ],
        },
      }),
    ]);

    const [communities, communityCount] = await Promise.all([
      this.prisma.community.findMany({
        where: {
          OR: [
            { community_name: { contains: term } },
            { community_slug: { contains: term } },
            { community_description: { contains: term } },
          ],
        },
        include: { members: { where: { is_active: true } } },
        take: effectiveLimit,
      }),
      this.prisma.community.count({
        where: {
          OR: [
            { community_name: { contains: term } },
            { community_slug: { contains: term } },
            { community_description: { contains: term } },
          ],
        },
      }),
    ]);

    const [topics, topicCount] = await Promise.all([
      this.prisma.topic.findMany({
        where: {
          OR: [
            { topic_name: { contains: term } },
            { topic_slug: { contains: term } },
            { topic_description: { contains: term } },
          ],
        },
        include: { userPosts: { where: { post_status: 'published' } } },
        take: effectiveLimit,
      }),
      this.prisma.topic.count({
        where: {
          OR: [
            { topic_name: { contains: term } },
            { topic_slug: { contains: term } },
            { topic_description: { contains: term } },
          ],
        },
      }),
    ]);

    this.logger.debug(
      `Search results - Posts sample: ${JSON.stringify(posts.slice(0, 1))}`,
    );
    this.logger.debug(
      `Search results - Communities sample: ${JSON.stringify(communities.slice(0, 1))}`,
    );

    return {
      users: users.map((u) => ({
        id: u.id,
        name: u.profile?.full_name || u.username,
        handle: `@${u.username}`,
        avatar: u.profile?.profile_picture || null,
        role: u.role,
      })),
      posts: posts.map((p) => ({
        id: p.id,
        title: p.post_title,
        slug: p.post_slug,
        status: p.post_status,
        view_count: p.view_count || 0,
        like_count: p.like_count || 0,
        comment_count: p.comment_count || 0,
        created_at: p.created_at,
        post_image: p.post_image || null,
        post_video: p.post_video || null,
        post_audio: p.post_audio || null,
        user: p.user
          ? {
              id: p.user.id,
              name: (p.user as any).profile?.full_name || p.user.username,
              handle: `@${p.user.username}`,
            }
          : null,
      })),
      communities: communities.map((c) => ({
        id: c.id,
        name: c.community_name,
        slug: c.community_slug,
        community_image: c.community_image || null,
        member_count: (c as any).members?.length || 0,
      })),
      topics: topics.map((t) => ({
        id: t.id,
        name: t.topic_name,
        slug: t.topic_slug,
        posts_count: (t as any).userPosts?.length || 0,
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
    data: any[];
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

    // Delegate to NotificationService which owns the notification prisma access
    const { data: notifications, total } =
      await this.notificationService.getSubscriptionPaymentNotifications({
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

      if (time_range && (start_date || end_date)) {
        throw new BadRequestException(
          'Cannot use time_range together with start_date/end_date. Use either time_range OR custom dates.',
        );
      }

      if ((start_date && !end_date) || (!start_date && end_date)) {
        throw new BadRequestException(
          'Both start_date and end_date are required together',
        );
      }

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
          default: {
            const firstUser = await this.prisma.user.findFirst({
              orderBy: { created_at: 'asc' },
              select: { created_at: true },
            });

            if (firstUser?.created_at) {
              periodStart = this.normalizeStartDate(
                new Date(firstUser.created_at),
              );
              this.logger.debug(
                `User growth 'all' range: First user date: ${firstUser.created_at.toISOString()}, Period start: ${periodStart.toISOString()}`,
              );
            } else {
              const defaultStart = new Date(now);
              defaultStart.setMonth(defaultStart.getMonth() - 12);
              periodStart = this.normalizeStartDate(defaultStart);
              this.logger.debug(
                `User growth 'all' range: No users found, using default start: ${periodStart.toISOString()}`,
              );
            }
            periodEnd = this.normalizeEndDate(new Date(now));
            this.logger.debug(
              `User growth 'all' range: Period end: ${periodEnd.toISOString()}`,
            );
            break;
          }
        }
      }

      const diffTime = periodEnd.getTime() - periodStart.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let dateFormat: 'daily' | 'weekly' | 'monthly';
      if (diffDays <= 90) {
        dateFormat = 'daily';
      } else if (diffDays <= 365) {
        dateFormat = 'weekly';
      } else {
        dateFormat = 'monthly';
      }

      const totalUsersCount = await this.prisma.user.count();
      this.logger.debug(
        `User growth: Total users in database: ${totalUsersCount}`,
      );
      this.logger.debug(
        `User growth: Querying users between ${periodStart.toISOString()} and ${periodEnd.toISOString()}`,
      );

      let usersInRange = await this.prisma.user.findMany({
        where: { created_at: { gte: periodStart, lte: periodEnd } },
        select: { id: true, created_at: true },
      });

      this.logger.debug(
        `User growth query: Found ${usersInRange.length} users in date range (out of ${totalUsersCount} total)`,
      );

      if (usersInRange.length === 0 && totalUsersCount > 0) {
        const allUsers = await this.prisma.user.findMany({
          select: { id: true, created_at: true },
          orderBy: { created_at: 'asc' },
        });

        this.logger.warn(
          `User growth: No users in date range. Total users: ${allUsers.length}`,
        );
        if (allUsers.length > 0) {
          const firstUserRec = allUsers[0];
          const lastUserRec = allUsers[allUsers.length - 1];
          this.logger.warn(
            `User growth: First user date: ${firstUserRec.created_at?.toISOString()}, Last user date: ${lastUserRec.created_at?.toISOString()}`,
          );
          this.logger.warn(
            `User growth: Query range: ${periodStart.toISOString()} to ${periodEnd.toISOString()}`,
          );

          const firstUserDate =
            firstUserRec.created_at instanceof Date
              ? firstUserRec.created_at
              : new Date(firstUserRec.created_at);
          const lastUserDate =
            lastUserRec.created_at instanceof Date
              ? lastUserRec.created_at
              : new Date(lastUserRec.created_at);

          if (firstUserDate < periodStart) {
            this.logger.warn(
              `User growth: Adjusting periodStart to include first user`,
            );
            periodStart = this.normalizeStartDate(firstUserDate);
          }
          if (lastUserDate > periodEnd) {
            this.logger.warn(
              `User growth: Adjusting periodEnd to include last user`,
            );
            periodEnd = this.normalizeEndDate(lastUserDate);
          }

          usersInRange = await this.prisma.user.findMany({
            where: { created_at: { gte: periodStart, lte: periodEnd } },
            select: { id: true, created_at: true },
          });

          this.logger.debug(
            `User growth: After adjustment, found ${usersInRange.length} users`,
          );
        }
      }

      const growthMap = new Map<string, number>();
      usersInRange.forEach((user) => {
        const userDate =
          user.created_at instanceof Date
            ? user.created_at
            : new Date(user.created_at);
        let dateKey: string;

        if (dateFormat === 'daily') {
          const year = userDate.getUTCFullYear();
          const month = String(userDate.getUTCMonth() + 1).padStart(2, '0');
          const day = String(userDate.getUTCDate()).padStart(2, '0');
          dateKey = `${year}-${month}-${day}`;
        } else if (dateFormat === 'weekly') {
          const year = userDate.getFullYear();
          const week = this.getWeekNumber(userDate);
          dateKey = `${year}-W${week}`;
        } else {
          const year = userDate.getUTCFullYear();
          const month = String(userDate.getUTCMonth() + 1).padStart(2, '0');
          dateKey = `${year}-${month}`;
        }

        growthMap.set(dateKey, (growthMap.get(dateKey) || 0) + 1);
      });

      this.logger.debug(
        `User growth grouped into ${growthMap.size} date groups`,
      );

      const growthData = Array.from(growthMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      const totalBeforePeriod = await this.prisma.user.count({
        where: { created_at: { lt: periodStart } },
      });

      let cumulative = totalBeforePeriod;
      const processedData = growthData.map((item) => {
        const count =
          typeof item.count === 'number'
            ? item.count
            : parseInt(item.count || '0', 10);
        cumulative += count;
        return { date: item.date, count, cumulative };
      });

      const processedDataMap = new Map<
        string,
        { date: string; count: number; cumulative: number }
      >();
      processedData.forEach((item) => {
        processedDataMap.set(item.date, item);
      });

      this.logger.debug(
        `User growth: Processed ${processedData.length} data points with dates: ${processedData.map((d) => d.date).join(', ')}`,
      );

      const filledData: Array<{
        date: string;
        count: number;
        cumulative: number;
      }> = [];
      const currentDate = new Date(
        Date.UTC(
          periodStart.getUTCFullYear(),
          periodStart.getUTCMonth(),
          periodStart.getUTCDate(),
        ),
      );
      const endDate = new Date(
        Date.UTC(
          periodEnd.getUTCFullYear(),
          periodEnd.getUTCMonth(),
          periodEnd.getUTCDate(),
        ),
      );

      const maxIterations = Math.ceil(diffDays) + 10;
      let iterations = 0;
      let lastCumulative = totalBeforePeriod;

      while (currentDate <= endDate && iterations < maxIterations) {
        iterations++;
        const dateStr = this.formatDateForGrouping(
          new Date(currentDate),
          dateFormat,
        );
        const existingData = processedDataMap.get(dateStr);

        if (existingData) {
          filledData.push(existingData);
          lastCumulative = existingData.cumulative;
        } else {
          filledData.push({
            date: dateStr,
            count: 0,
            cumulative: lastCumulative,
          });
        }

        if (dateFormat === 'daily') {
          currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        } else if (dateFormat === 'weekly') {
          currentDate.setUTCDate(currentDate.getUTCDate() + 7);
        } else {
          currentDate.setUTCMonth(currentDate.getUTCMonth() + 1);
        }
      }

      this.logger.debug(`User growth: Filled ${filledData.length} data points`);

      const finalTotal =
        processedData.length > 0
          ? processedData[processedData.length - 1].cumulative
          : filledData.length > 0
            ? filledData[filledData.length - 1].cumulative
            : totalBeforePeriod;

      return { data: filledData, total: finalTotal };
    } catch (error) {
      console.error('Error in getUserGrowth:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      const msg = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to fetch user growth data: ${msg}`);
    }
  }

  private formatDateForGrouping(
    date: Date,
    format: 'daily' | 'weekly' | 'monthly',
  ): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');

    switch (format) {
      case 'daily':
        return `${year}-${month}-${day}`;
      case 'weekly': {
        const week = this.getWeekNumber(date);
        return `${year}-W${week}`;
      }
      case 'monthly':
        return `${year}-${month}`;
      default:
        return `${year}-${month}-${day}`;
    }
  }

  private getWeekNumber(date: Date): string {
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return String(
      Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7),
    ).padStart(2, '0');
  }

  async updateCommunityStatus(
    communityId: number,
    updateCommunityStatusDto: UpdateCommunityStatusDto,
    adminId: number,
  ) {
    // Get the community first to check if it exists
    const community = await this.prisma.community.findUnique({
      where: { id: communityId },
    });

    if (!community) {
      throw new NotFoundException('Community not found');
    }

    // Admin can update any community status directly
    await this.prisma.community.update({
      where: { id: communityId },
      data: {
        is_active: updateCommunityStatusDto.is_active,
        updated_by: adminId,
      },
    });

    // Get updated community
    const updatedCommunity =
      await this.communityService.getCommunityById(communityId);

    return {
      message: 'Community status updated successfully',
      community: updatedCommunity,
    };
  }

  async deleteCommunity(communityId: number, adminId: number) {
    // Get the community first to check if it exists
    const community = await this.prisma.community.findUnique({
      where: { id: communityId },
    });

    if (!community) {
      throw new NotFoundException('Community not found');
    }

    // Admin can delete any community, bypassing community admin check
    // Count active members
    const memberCount = await this.prisma.communityUser.count({
      where: { community_id: communityId, is_active: true },
    });

    // Delete all related community-topic associations
    await this.prisma.communityTopic.deleteMany({
      where: { community_id: communityId },
    });

    // If community has only one member, delete the record from database
    if (memberCount === 1) {
      await this.prisma.community.delete({ where: { id: community.id } });
      return {
        message:
          'Community deleted successfully (hard delete - only one member)',
      };
    }

    // If community has more than one member, soft delete (inactivate)
    await this.prisma.community.update({
      where: { id: community.id },
      data: { is_active: false, updated_by: adminId },
    });

    return {
      message:
        'Community deleted successfully (soft delete - multiple members)',
    };
  }

  async getCommunityMembers(communityId: number, listQueryDto: ListQueryDto) {
    // Admin can view members of any community
    const membersData = await this.communityService.getCommunityMembers(
      communityId,
      {
        page: listQueryDto.page || 1,
        limit: listQueryDto.limit || 10,
        role: undefined, // Admin can see all roles
        sort_by: listQueryDto.sort_by || 'created_at',
        sort_order: listQueryDto.sort_order || 'DESC',
      },
    );

    // Enrich with post count and profile info specifically for admin view
    const enrichedData = await Promise.all(
      membersData.data.map(async (member) => {
        // Count posts by this user in this specific community
        // Using FIND_IN_SET because community_ids is a comma-separated string
        const postsCountRows: any[] = await this.prisma.$queryRawUnsafe(
          `SELECT COUNT(*) AS cnt FROM user_posts WHERE user_id = $1 AND $2::text = ANY(string_to_array(community_ids, ','))`,
          member.user_id,
          String(communityId),
        );
        const postsCount = Number(postsCountRows[0]?.cnt ?? 0);

        // Fetch user profile for more details (avatar/full name)
        const profile = await this.prisma.userProfile.findFirst({
          where: { user_id: member.user_id },
          select: { full_name: true, profile_picture: true },
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
    const targetMember = await this.prisma.communityUser.findFirst({
      where: {
        community_id: communityId,
        user_id: memberId,
        is_active: true,
      },
      include: { user: true },
    });

    if (!targetMember) {
      throw new NotFoundException('Member not found');
    }

    // Prevent removing the last admin
    if (targetMember.role === 'admin' && updateMemberRoleDto.role !== 'admin') {
      const adminCount = await this.prisma.communityUser.count({
        where: {
          community_id: communityId,
          role: 'admin',
          is_active: true,
        },
      });

      if (adminCount === 1) {
        throw new BadRequestException(
          'Cannot change role: this is the only admin. Please assign another admin first.',
        );
      }
    }

    await this.prisma.communityUser.update({
      where: { id: targetMember.id },
      data: { role: updateMemberRoleDto.role as any, updated_by: adminId },
    });

    // Return properly formatted member response
    return {
      id: targetMember.id,
      community_id: targetMember.community_id,
      user_id: targetMember.user_id,
      role: updateMemberRoleDto.role,
      is_active: targetMember.is_active,
      created_at: targetMember.created_at,
      updated_at: targetMember.updated_at,
      user: targetMember.user
        ? {
            id: targetMember.user.id,
            username: targetMember.user.username,
            email: targetMember.user.email,
          }
        : null,
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
    const community = await this.prisma.community.findUnique({
      where: { id: communityId },
      select: { id: true },
    });

    if (!community) {
      throw new NotFoundException('Community not found');
    }

    // Check if topic exists
    const topic = await this.prisma.topic.findUnique({
      where: { id: addTopicDto.topic_id, is_active: true },
      select: { id: true },
    });

    if (!topic) {
      throw new NotFoundException('Topic not found or inactive');
    }

    // Check if topic is already associated
    const existingAssociation = await this.prisma.communityTopic.findFirst({
      where: {
        community_id: communityId,
        topic_id: addTopicDto.topic_id,
      },
      include: { topic: true },
    });

    if (existingAssociation) {
      if (existingAssociation.is_active) {
        throw new ConflictException(
          'Topic is already associated with this community',
        );
      } else {
        // Reactivate association
        const updated = await this.prisma.communityTopic.update({
          where: { id: existingAssociation.id },
          data: { is_active: true, updated_by: adminId },
          include: { topic: true },
        });

        return {
          id: updated.id,
          community_id: updated.community_id,
          topic_id: updated.topic_id,
          is_active: updated.is_active,
          topic: updated.topic
            ? {
                id: updated.topic.id,
                topic_name: updated.topic.topic_name,
                topic_slug: updated.topic.topic_slug,
              }
            : null,
        };
      }
    }

    // Create new association
    const savedAssociation = await this.prisma.communityTopic.create({
      data: {
        community_id: communityId,
        topic_id: addTopicDto.topic_id,
        is_active: true,
        created_by: adminId,
      },
      include: { topic: true },
    });

    return {
      id: savedAssociation.id,
      community_id: savedAssociation.community_id,
      topic_id: savedAssociation.topic_id,
      is_active: savedAssociation.is_active,
      topic: savedAssociation.topic
        ? {
            id: savedAssociation.topic.id,
            topic_name: savedAssociation.topic.topic_name,
            topic_slug: savedAssociation.topic.topic_slug,
          }
        : null,
    };
  }

  async removeTopicFromCommunity(
    communityId: number,
    topicId: number,
    adminId: number,
  ) {
    // Admin can remove topics from any community, bypassing community admin/moderator check
    const association = await this.prisma.communityTopic.findFirst({
      where: {
        community_id: communityId,
        topic_id: topicId,
        is_active: true,
      },
    });

    if (!association) {
      throw new NotFoundException(
        'Topic is not associated with this community',
      );
    }

    // Soft delete
    await this.prisma.communityTopic.update({
      where: { id: association.id },
      data: { is_active: false, updated_by: adminId },
    });

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

    const where: any = {};

    if (search) {
      where.OR = [
        { poll_title: { contains: search } },
        { poll_description: { contains: search } },
        { poll_slug: { contains: search } },
      ];
    }

    if (poll_status && poll_status !== 'all') {
      if (poll_status === 'active') {
        where.poll_status = 'published';
        where.poll_expires_at = { gt: new Date() };
      } else {
        where.poll_status = poll_status;
      }
    }

    if (is_featured !== undefined) where.is_featured = is_featured;

    if (is_expired !== undefined) {
      if (is_expired) {
        where.poll_expires_at = { ...where.poll_expires_at, lt: new Date() };
      } else {
        where.poll_expires_at = { ...where.poll_expires_at, gte: new Date() };
      }
    }

    if (user_id) where.user_id = user_id;
    if (expires_from)
      where.poll_expires_at = {
        ...where.poll_expires_at,
        gte: new Date(expires_from),
      };
    if (expires_to)
      where.poll_expires_at = {
        ...where.poll_expires_at,
        lte: new Date(expires_to),
      };
    if (created_from)
      where.created_at = { ...where.created_at, gte: new Date(created_from) };
    if (created_to)
      where.created_at = { ...where.created_at, lte: new Date(created_to) };

    const allowedSortFields = [
      'id',
      'poll_title',
      'vote_count',
      'view_count',
      'poll_expires_at',
      'created_at',
      'updated_at',
    ];
    const sortField = allowedSortFields.includes(sort_by)
      ? sort_by
      : 'created_at';
    const orderBy: any = { [sortField]: sort_order.toLowerCase() };
    const skip = (page - 1) * limit;

    const [polls, total] = await Promise.all([
      this.prisma.userPoll.findMany({
        where,
        orderBy,
        take: limit,
        skip,
        include: { user: true, options: true },
      }),
      this.prisma.userPoll.count({ where }),
    ]);

    const now = new Date();
    const expiredPollIds = polls
      .filter(
        (p) =>
          p.poll_expires_at &&
          new Date(p.poll_expires_at) <= now &&
          p.poll_status !== 'ended',
      )
      .map((p) => p.id);

    if (expiredPollIds.length > 0) {
      await this.prisma.userPoll.updateMany({
        where: { id: { in: expiredPollIds } },
        data: { poll_status: 'ended' },
      });
      polls.forEach((p) => {
        if (expiredPollIds.includes(p.id)) p.poll_status = 'ended';
      });
    }

    return {
      data: polls.map((poll) => ({
        ...poll,
        poll_expires_at: poll.poll_expires_at
          ? this.pollService['convertUtcToLocalString'](
              new Date(poll.poll_expires_at),
            )
          : null,
      })),
      meta: { total, page, limit, total_pages: Math.ceil(total / limit) },
    };
  }

  async getPollById(pollId: number) {
    // Skip view count increment for admin views
    return this.pollService.getPollById(pollId, undefined, true);
  }

  async createPoll(createPollDto: CreatePollDto, adminId: number) {
    // Admin can create polls using the PollService
    return this.pollService.createPoll(createPollDto, adminId);
  }

  async updatePoll(
    pollId: number,
    updatePollDto: UpdatePollDto,
    adminId: number,
  ) {
    // Get the poll first to check if it exists
    const poll = await this.prisma.userPoll.findUnique({
      where: { id: pollId },
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    // Admin can update any poll, so we need to bypass ownership check
    // We'll use the repository directly for admin updates

    // Check if slug is being updated and if it already exists
    if (updatePollDto.poll_slug && updatePollDto.poll_slug !== poll.poll_slug) {
      const existingPoll = await this.prisma.userPoll.findFirst({
        where: { poll_slug: updatePollDto.poll_slug },
        select: { id: true },
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
      if (
        dateString.includes('T') &&
        !dateString.includes('Z') &&
        !dateString.includes('+') &&
        !dateString.includes('-', 10)
      ) {
        // Format: YYYY-MM-DDTHH:mm (datetime-local format)
        // Parse as UTC to match MySQL TIMESTAMP storage (which stores in UTC)
        const [datePart, timePart] = dateString.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        const timeComponents = timePart.split(':');
        const hours = Number(timeComponents[0]) || 0;
        const minutes = Number(timeComponents[1]) || 0;
        const seconds = Number(timeComponents[2]) || 0;
        expiresAt = new Date(
          Date.UTC(year, month - 1, day, hours, minutes, seconds, 0),
        );
      } else {
        expiresAt = new Date(dateString);
      }

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

      if (expiresAt < tomorrow) {
        throw new BadRequestException(
          'Poll expiration date must be at least tomorrow. Polls cannot expire on the same day they are created.',
        );
      }
      poll.poll_expires_at = expiresAt;
    }

    // Convert community_ids array to comma-separated string if provided
    if (updatePollDto.community_ids !== undefined) {
      poll.community_ids =
        updatePollDto.community_ids.length > 0
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
    if (updatePollDto.options) {
      const existingOptions = await this.prisma.pollOption.findMany({
        where: { poll_id: pollId },
      });
      const keepOptionIds: number[] = [];

      for (const optionDto of updatePollDto.options) {
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
          await this.prisma.pollOption.create({
            data: {
              poll_id: pollId,
              option_text: optionDto.option_text,
              display_order: optionDto.display_order ?? 0,
              vote_count: 0,
              is_active: true,
              created_by: adminId,
            },
          });
        }
      }

      const optionIdsToDelete = existingOptions
        .filter((o) => !keepOptionIds.includes(o.id))
        .map((o) => o.id);
      if (optionIdsToDelete.length > 0) {
        await this.prisma.pollOption.deleteMany({
          where: { id: { in: optionIdsToDelete } },
        });
      }
    }

    // Build Prisma update data from the mutated poll object
    const pollUpdateData: any = { updated_by: adminId };
    if (updatePollDto.poll_expires_at)
      pollUpdateData.poll_expires_at = poll.poll_expires_at;
    if (updatePollDto.community_ids !== undefined)
      pollUpdateData.community_ids = poll.community_ids;
    if (updatePollDto.poll_slug !== undefined)
      pollUpdateData.poll_slug = poll.poll_slug;
    if (updatePollDto.poll_title !== undefined)
      pollUpdateData.poll_title = poll.poll_title;
    if (updatePollDto.poll_description !== undefined)
      pollUpdateData.poll_description = poll.poll_description;
    if (updatePollDto.poll_status !== undefined)
      pollUpdateData.poll_status = poll.poll_status;
    if (updatePollDto.is_featured !== undefined)
      pollUpdateData.is_featured = poll.is_featured;
    if (updatePollDto.poll_winner_option_id !== undefined)
      pollUpdateData.poll_winner_option_id = poll.poll_winner_option_id;

    await this.prisma.userPoll.update({
      where: { id: pollId },
      data: pollUpdateData,
    });

    // Get updated poll using service for proper formatting
    // Skip view count increment for admin views
    return this.pollService.getPollById(pollId, undefined, true);
  }

  async deletePoll(pollId: number, adminId: number) {
    // Get the poll first to check if it exists
    const poll = await this.prisma.userPoll.findUnique({
      where: { id: pollId },
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    // Admin can delete any poll - perform hard delete (remove from database)
    // Delete related records first to avoid foreign key constraints

    // Use transaction to ensure all deletions succeed or none
    await this.prisma.$transaction(async (tx) => {
      await tx.pollComment.deleteMany({ where: { poll_id: pollId } });
      await tx.pollVote.deleteMany({ where: { poll_id: pollId } });
      await tx.pollLike.deleteMany({ where: { poll_id: pollId } });
      await tx.pollOption.deleteMany({ where: { poll_id: pollId } });
      await tx.userPoll.delete({ where: { id: pollId } });
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
    return this.subscriptionService.createSubscription(
      createSubscriptionDto,
      adminId,
    );
  }

  async updateSubscription(
    id: number,
    updateSubscriptionDto: UpdateSubscriptionDto,
    adminId: number,
  ) {
    return this.subscriptionService.updateSubscription(
      id,
      updateSubscriptionDto,
      adminId,
    );
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
    return this.subscriptionService.updateUserSubscriptionStatus(
      id,
      status,
      adminId,
    );
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

  async updatePaymentStatus(
    id: number,
    status: PaymentStatus,
    adminId: number,
  ) {
    return this.subscriptionService.updatePaymentStatus(id, status, adminId);
  }

  // ========== Detail Modal Endpoints ==========

  async getUserPosts(userId: number, listQueryDto: ListQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sort_by = 'created_at',
      sort_order = 'DESC',
    } = listQueryDto;
    const skip = (page - 1) * limit;

    const postWhere: any = { user_id: userId };
    if (search)
      postWhere.OR = [
        { post_title: { contains: search } },
        { post_content: { contains: search } },
      ];

    const allowedSortFields = [
      'id',
      'post_title',
      'like_count',
      'comment_count',
      'view_count',
      'created_at',
      'updated_at',
    ];
    const sortField = allowedSortFields.includes(sort_by)
      ? sort_by
      : 'created_at';
    const postOrderBy: any = { [sortField]: sort_order.toLowerCase() };

    const [posts, total] = await Promise.all([
      this.prisma.userPost.findMany({
        where: postWhere,
        orderBy: postOrderBy,
        take: limit,
        skip,
        include: { topic: true },
      }),
      this.prisma.userPost.count({ where: postWhere }),
    ]);

    return {
      data: posts,
      meta: { total, page, limit, total_pages: Math.ceil(total / limit) },
    };
  }

  async getUserCommunities(userId: number, listQueryDto: ListQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sort_by = 'created_at',
      sort_order = 'DESC',
    } = listQueryDto;
    const skip = (page - 1) * limit;

    const cuWhere: any = { user_id: userId, is_active: true };
    if (search)
      cuWhere.community = {
        OR: [
          { community_name: { contains: search } },
          { community_slug: { contains: search } },
        ],
      };

    const allowedSortFields = ['id', 'created_at', 'updated_at'];
    const sortField = allowedSortFields.includes(sort_by)
      ? sort_by
      : 'created_at';
    const cuOrderBy: any = { [sortField]: sort_order.toLowerCase() };

    const [memberships, total] = await Promise.all([
      this.prisma.communityUser.findMany({
        where: cuWhere,
        orderBy: cuOrderBy,
        take: limit,
        skip,
        include: { community: true },
      }),
      this.prisma.communityUser.count({ where: cuWhere }),
    ]);

    return {
      data: memberships.map((m) => ({
        ...m.community,
        role: m.role,
        joined_at: m.created_at,
      })),
      meta: { total, page, limit, total_pages: Math.ceil(total / limit) },
    };
  }

  async getUserComments(userId: number, listQueryDto: ListQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sort_by = 'created_at',
      sort_order = 'DESC',
    } = listQueryDto;
    const skip = (page - 1) * limit;

    const commentWhere: any = { user_id: userId };
    if (search) commentWhere.comment_content = { contains: search };

    const allowedSortFields = ['id', 'like_count', 'created_at', 'updated_at'];
    const sortField = allowedSortFields.includes(sort_by)
      ? sort_by
      : 'created_at';
    const commentOrderBy: any = { [sortField]: sort_order.toLowerCase() };

    const [comments, total] = await Promise.all([
      this.prisma.postComment.findMany({
        where: commentWhere,
        orderBy: commentOrderBy,
        take: limit,
        skip,
        include: { post: true },
      }),
      this.prisma.postComment.count({ where: commentWhere }),
    ]);

    const mappedData = await Promise.all(
      comments.map(async (comment) => {
        const repliesCount = await this.prisma.postComment.count({
          where: { parent_comment_id: comment.id },
        });
        const commentWithExtras = { ...comment, replies_count: repliesCount };
        return this.commentService.mapPostCommentToResponseDto(
          commentWithExtras,
        );
      }),
    );

    return {
      data: mappedData,
      meta: { total, page, limit, total_pages: Math.ceil(total / limit) },
    };
  }

  async getUserStats(userId: number) {
    const postsCount = await this.prisma.userPost.count({
      where: { user_id: userId },
    });
    const commentsCount = await this.prisma.postComment.count({
      where: { user_id: userId },
    });
    const communitiesCount = await this.prisma.communityUser.count({
      where: { user_id: userId, is_active: true },
    });
    const pollsCount = await this.prisma.userPoll.count({
      where: { user_id: userId },
    });

    return {
      posts_count: postsCount,
      comments_count: commentsCount,
      communities_count: communitiesCount,
      polls_count: pollsCount,
    };
  }

  async getPostComments(postId: number, listQueryDto: ListQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sort_by = 'created_at',
      sort_order = 'DESC',
    } = listQueryDto;
    const skip = (page - 1) * limit;

    const pcWhere: any = { post_id: postId, parent_comment_id: null };
    if (search) pcWhere.comment_content = { contains: search };

    const allowedSortFields = ['id', 'like_count', 'created_at', 'updated_at'];
    const sortField = allowedSortFields.includes(sort_by)
      ? sort_by
      : 'created_at';
    const pcOrderBy: any = { [sortField]: sort_order.toLowerCase() };

    const [comments, total] = await Promise.all([
      this.prisma.postComment.findMany({
        where: pcWhere,
        orderBy: pcOrderBy,
        take: limit,
        skip,
        include: { user: true },
      }),
      this.prisma.postComment.count({ where: pcWhere }),
    ]);

    // Load user profiles in batch
    const userIds = new Set<number>();
    comments.forEach((c) => {
      if (c.user_id) userIds.add(c.user_id);
    });
    const userProfilesMap = new Map<number, any>();
    if (userIds.size > 0) {
      const profiles = await this.prisma.userProfile.findMany({
        where: { user_id: { in: Array.from(userIds) } },
        select: { user_id: true, full_name: true, profile_picture: true },
      });
      profiles.forEach((p) => userProfilesMap.set(p.user_id, p));
    }

    const mappedData = await Promise.all(
      comments.map(async (comment) => {
        const replies = await this.prisma.postComment.findMany({
          where: { parent_comment_id: comment.id },
          include: { user: true },
          orderBy: { created_at: 'asc' },
        });

        // Load profiles for replies too
        const replyUserIds = replies
          .map((r) => r.user_id)
          .filter((id) => !userProfilesMap.has(id));
        if (replyUserIds.length > 0) {
          const replyProfiles = await this.prisma.userProfile.findMany({
            where: { user_id: { in: replyUserIds } },
            select: { user_id: true, full_name: true, profile_picture: true },
          });
          replyProfiles.forEach((p) => userProfilesMap.set(p.user_id, p));
        }

        const commentWithReplies: any = {
          ...comment,
          replies,
          replies_count: replies.length,
        };

        if (
          commentWithReplies.user &&
          userProfilesMap.has(commentWithReplies.user.id)
        ) {
          const p = userProfilesMap.get(commentWithReplies.user.id);
          commentWithReplies.user.profile_picture = p.profile_picture || null;
          commentWithReplies.user.full_name = p.full_name || null;
        }

        commentWithReplies.replies.forEach((r: any) => {
          if (r.user && userProfilesMap.has(r.user.id)) {
            const p = userProfilesMap.get(r.user.id);
            r.user.profile_picture = p.profile_picture || null;
            r.user.full_name = p.full_name || null;
          }
        });

        return this.commentService.mapPostCommentToResponseDto(
          commentWithReplies,
        );
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

  async getPostAnalytics(postId: number, _timeRange?: string) {
    const post = await this.prisma.userPost.findUnique({
      where: { id: postId },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Calculate engagement rate
    const totalInteractions = post.like_count + post.comment_count;
    const engagementRate =
      post.view_count > 0 ? (totalInteractions / post.view_count) * 100 : 0;

    // Calculate trending score (based on recent activity)
    const recentComments = await this.prisma.postComment.count({
      where: {
        post_id: postId,
        created_at: { gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    });
    const trendingScore =
      ((post.like_count * 0.4 + recentComments * 0.6) /
        (post.view_count || 1)) *
      100;

    return {
      engagement_rate: engagementRate,
      trending_score: trendingScore,
      total_interactions: totalInteractions,
      recent_comments: recentComments,
    };
  }

  async getCommunityPosts(communityId: number, listQueryDto: ListQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sort_by = 'created_at',
      sort_order = 'DESC',
    } = listQueryDto;
    const skip = (page - 1) * limit;

    const baseParams: any[] = [`%${communityId}%`];
    let nextIdx = 2;
    const searchClause = search
      ? `AND (post_title LIKE $${nextIdx++} OR post_content LIKE $${nextIdx++})`
      : '';
    if (search) baseParams.push(`%${search}%`, `%${search}%`);

    const allowedSortFields = [
      'id',
      'post_title',
      'like_count',
      'comment_count',
      'view_count',
      'created_at',
      'updated_at',
    ];
    const sortField = allowedSortFields.includes(sort_by)
      ? sort_by
      : 'created_at';
    const sortDir = sort_order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const limitIdx = nextIdx++;
    const offsetIdx = nextIdx++;
    const [postsRaw, countRaw] = (await Promise.all([
      this.prisma.$queryRawUnsafe(
        `SELECT * FROM user_posts WHERE community_ids LIKE $1 ${searchClause} ORDER BY ${sortField} ${sortDir} LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
        ...baseParams,
        limit,
        skip,
      ),
      this.prisma.$queryRawUnsafe(
        `SELECT COUNT(*) AS cnt FROM user_posts WHERE community_ids LIKE $1 ${searchClause}`,
        ...baseParams,
      ),
    ])) as [any[], any[]];

    const total = Number(countRaw[0]?.cnt ?? 0);
    return {
      data: postsRaw,
      meta: { total, page, limit, total_pages: Math.ceil(total / limit) },
    };
  }

  async getCommunityActivity(communityId: number, listQueryDto: ListQueryDto) {
    const { page = 1, limit = 20 } = listQueryDto;
    const skip = (page - 1) * limit;

    // Get recent posts — community_ids is a comma-separated string, must use raw SQL
    const recentPostsRaw: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT p.id, p.post_title, p.created_at, u.id AS u_id, u.username AS u_username FROM user_posts p LEFT JOIN users u ON p.user_id = u.id WHERE p.community_ids LIKE $1 ORDER BY p.created_at DESC LIMIT $2`,
      `%${communityId}%`,
      limit,
    );

    // Get recent comments on community posts
    const recentCommentsRaw: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT c.id, c.comment_content, c.post_id, c.created_at, u.id AS u_id, u.username AS u_username FROM post_comments c LEFT JOIN user_posts p ON c.post_id = p.id LEFT JOIN users u ON c.user_id = u.id WHERE p.community_ids LIKE $1 ORDER BY c.created_at DESC LIMIT $2`,
      `%${communityId}%`,
      limit,
    );

    const activities = [
      ...recentPostsRaw.map((p) => ({
        type: 'post',
        id: Number(p.id),
        title: p.post_title,
        user: { id: Number(p.u_id), username: p.u_username },
        created_at: new Date(p.created_at),
      })),
      ...recentCommentsRaw.map((c) => ({
        type: 'comment',
        id: Number(c.id),
        content: String(c.comment_content).substring(0, 50),
        user: { id: Number(c.u_id), username: c.u_username },
        post_id: Number(c.post_id),
        created_at: new Date(c.created_at),
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
    const [postsCountRaw, topicsCount, membersCount] = await Promise.all([
      this.prisma.$queryRawUnsafe(
        `SELECT COUNT(*) AS cnt FROM user_posts WHERE community_ids LIKE $1`,
        `%${communityId}%`,
      ) as Promise<any[]>,
      this.prisma.communityTopic.count({
        where: { community_id: communityId, is_active: true },
      }),
      this.prisma.communityUser.count({
        where: { community_id: communityId, is_active: true },
      }),
    ]);
    const postsCount = Number(postsCountRaw[0]?.cnt ?? 0);

    return {
      posts_count: postsCount,
      topics_count: topicsCount,
      members_count: membersCount,
    };
  }

  async getTopicPosts(topicId: number, listQueryDto: ListQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sort_by = 'created_at',
      sort_order = 'DESC',
    } = listQueryDto;
    const skip = (page - 1) * limit;

    const tpWhere: any = { post_topic_id: topicId };
    if (search)
      tpWhere.OR = [
        { post_title: { contains: search } },
        { post_content: { contains: search } },
      ];

    const allowedSortFields = [
      'id',
      'post_title',
      'like_count',
      'comment_count',
      'view_count',
      'created_at',
      'updated_at',
    ];
    const sortField = allowedSortFields.includes(sort_by)
      ? sort_by
      : 'created_at';
    const tpOrderBy: any = { [sortField]: sort_order.toLowerCase() };

    const [posts, total] = await Promise.all([
      this.prisma.userPost.findMany({
        where: tpWhere,
        orderBy: tpOrderBy,
        take: limit,
        skip,
        include: { user: true },
      }),
      this.prisma.userPost.count({ where: tpWhere }),
    ]);

    return {
      data: posts,
      meta: { total, page, limit, total_pages: Math.ceil(total / limit) },
    };
  }

  async getTopicCommunities(topicId: number, listQueryDto: ListQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sort_by = 'created_at',
      sort_order = 'DESC',
    } = listQueryDto;
    const skip = (page - 1) * limit;

    const tcWhere: any = { topic_id: topicId, is_active: true };
    if (search)
      tcWhere.community = {
        OR: [
          { community_name: { contains: search } },
          { community_slug: { contains: search } },
        ],
      };

    const allowedSortFields = ['id', 'created_at', 'updated_at'];
    const sortField = allowedSortFields.includes(sort_by)
      ? sort_by
      : 'created_at';
    const tcOrderBy: any = { [sortField]: sort_order.toLowerCase() };

    const [associations, total] = await Promise.all([
      this.prisma.communityTopic.findMany({
        where: tcWhere,
        orderBy: tcOrderBy,
        take: limit,
        skip,
        include: { community: true },
      }),
      this.prisma.communityTopic.count({ where: tcWhere }),
    ]);

    return {
      data: associations.map((a) => a.community),
      meta: { total, page, limit, total_pages: Math.ceil(total / limit) },
    };
  }

  async getTopicStats(topicId: number) {
    const postsCount = await this.prisma.userPost.count({
      where: { post_topic_id: topicId, post_status: 'published' },
    });
    const communitiesCount = await this.prisma.communityTopic.count({
      where: { topic_id: topicId, is_active: true },
    });

    return {
      posts_count: postsCount,
      communities_count: communitiesCount,
      usage_count: postsCount + communitiesCount,
    };
  }

  async getPollAnalytics(pollId: number) {
    const poll = await this.prisma.userPoll.findUnique({
      where: { id: pollId },
      include: { options: true },
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    const totalVotes = poll.vote_count;
    const engagementRate =
      poll.view_count > 0 ? (totalVotes / poll.view_count) * 100 : 0;

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
    const [votes, totalRaw] = (await Promise.all([
      this.prisma.$queryRawUnsafe(
        `SELECT pv.id, pv.user_id, pv.vote_option_id, pv.created_at, u.username, u.email, po.option_text
         FROM poll_votes pv
         LEFT JOIN users u ON pv.user_id = u.id
         LEFT JOIN poll_options po ON pv.vote_option_id = po.id
         WHERE pv.poll_id = $1 ORDER BY pv.created_at DESC LIMIT $2 OFFSET $3`,
        pollId,
        limit,
        skip,
      ),
      this.prisma.$queryRawUnsafe(
        'SELECT COUNT(*) as count FROM poll_votes WHERE poll_id = $1',
        pollId,
      ),
    ])) as [any[], any[]];

    const totalCount = Number(totalRaw[0]?.count ?? 0);
    return {
      data: votes,
      meta: {
        total: totalCount,
        page,
        limit,
        total_pages: Math.ceil(totalCount / limit),
      },
    };
  }
}
