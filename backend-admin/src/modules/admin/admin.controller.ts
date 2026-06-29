import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { AdminService } from './admin.service';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { ListQueryDto } from './dto/list-query.dto';
import { SearchQueryDto } from './dto/search-query.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { ListPostsQueryDto } from './dto/list-posts-query.dto';
import { ListCommentsQueryDto } from './dto/list-comments-query.dto';
import { ListTopicsQueryDto } from './dto/list-topics-query.dto';
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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserRole } from '../auth/entities/user.entity';
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
import { PaymentStatus } from '../subscription/entities/payment.entity';
import { ListSubscriptionPaymentNotificationsDto } from './dto/list-subscription-payment-notifications.dto';
import { TopicSelectListDto } from '../general/dto/topic-select-list.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) { }

  // Admin Login (no guards - public endpoint for login)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() adminLoginDto: AdminLoginDto): Promise<AuthResponseDto> {
    return this.adminService.login(adminLoginDto);
  }

  // Admin Logout (requires authentication)
  @Post('logout')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async logout(@GetUser() admin: any): Promise<{ message: string }> {
    return this.adminService.logout(admin.userId);
  }

  // Admin Forgot Password (no guards - public endpoint)
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body() forgotPasswordDto: AdminForgotPasswordDto,
  ): Promise<{ message: string }> {
    return this.adminService.forgotPassword(forgotPasswordDto);
  }

  // Admin Reset Password (no guards - public endpoint)
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() resetPasswordDto: AdminResetPasswordDto,
  ): Promise<{ message: string }> {
    return this.adminService.resetPassword(resetPasswordDto);
  }

  // Admin Change Password (requires authentication)
  @Post('change-password')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @GetUser() admin: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    return this.adminService.changePassword(admin.userId, changePasswordDto);
  }

  // Protected routes - require authentication and admin/sub-admin role
  // Dashboard
  @Get('dashboard/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async getDashboardStats(@Query() queryDto: DashboardStatsQueryDto): Promise<DashboardStatsDto> {
    return this.adminService.getDashboardStats(queryDto);
  }

  @Get('dashboard/user-growth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async getUserGrowth(@Query() queryDto: UserGrowthQueryDto) {
    return this.adminService.getUserGrowth(queryDto);
  }

  // Global Search (users, posts, communities, topics)
  @Get('search')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async search(@Query() searchQueryDto: SearchQueryDto) {
    return this.adminService.search(searchQueryDto);
  }

  // ========== Export Functionality ==========

  @Get('users/export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async exportUsers(@Query() listQueryDto: ListUsersQueryDto) {
    return this.adminService.exportUsers(listQueryDto);
  }

  @Get('posts/export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async exportPosts(@Query() listQueryDto: ListPostsQueryDto) {
    return this.adminService.exportPosts(listQueryDto);
  }

  @Get('comments/export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async exportComments(@Query() listQueryDto: ListCommentsQueryDto) {
    return this.adminService.exportComments(listQueryDto);
  }

  @Get('communities/export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async exportCommunities(@Query() listQueryDto: ListCommunitiesQueryDto) {
    return this.adminService.exportCommunities(listQueryDto);
  }

  @Get('topics/export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async exportTopics(@Query() listQueryDto: ListTopicsQueryDto) {
    return this.adminService.exportTopics(listQueryDto);
  }

  @Get('polls/export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async exportPolls(@Query() listQueryDto: ListPollsQueryDto) {
    return this.adminService.exportPolls(listQueryDto);
  }

  @Get('subscriptions/export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async exportSubscriptions(@Query() listQueryDto: ListSubscriptionsQueryDto) {
    return this.adminService.exportSubscriptions(listQueryDto);
  }

  @Get('payments/export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async exportPayments(@Query() listQueryDto: ListPaymentsQueryDto) {
    return this.adminService.exportPayments(listQueryDto);
  }

  // User Management
  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async getUsers(@Query() listQueryDto: ListUsersQueryDto) {
    return this.adminService.getUsers(listQueryDto);
  }

  /**
   * List soft-deleted users (admin only).
   * These users are hidden from /admin/users and cannot log in.
   */
  @Get('users/deleted')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async getDeletedUsers(@Query() listQueryDto: ListUsersQueryDto) {
    return this.adminService.getDeletedUsers(listQueryDto);
  }

  /**
   * Restore a soft-deleted user. Fails if another active user has taken the same email/username.
   */
  @Put('users/:userId/restore')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async restoreUser(
    @Param('userId', ParseIntPipe) userId: number,
    @GetUser() admin: any,
  ) {
    return this.adminService.restoreUser(userId, admin.userId);
  }

  /**
   * Permanently delete a user (hard delete). Only allowed when user has no content.
   */
  @Delete('users/:userId/hard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async hardDeleteUser(
    @Param('userId', ParseIntPipe) userId: number,
    @GetUser() admin: any,
  ) {
    return this.adminService.hardDeleteUser(userId, admin.userId);
  }

  @Post('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createUser(
    @GetUser() admin: any,
    @Body() createUserDto: CreateUserDto,
  ) {
    return this.adminService.createUser(createUserDto, admin.userId);
  }

  @Get('users/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async getUserById(@Param('userId', ParseIntPipe) userId: number) {
    return this.adminService.getUserById(userId);
  }

  @Put('users/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FilesInterceptor('files', 2, {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max per file
      fileFilter: (req, file, cb) => {
        // Only allow image files - strict type checking
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only image files are allowed (JPEG, PNG, GIF, WebP)'), false);
        }
      },
    }),
  )
  async updateUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() updateUserDto: UpdateUserDto,
    @GetUser() admin: any,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.adminService.updateUser(userId, updateUserDto, admin.userId, files);
  }

  @Get('users/:userId/posts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async getUserPosts(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() listQueryDto: ListQueryDto,
  ) {
    return this.adminService.getUserPosts(userId, listQueryDto);
  }

  @Get('users/:userId/communities')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async getUserCommunities(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() listQueryDto: ListQueryDto,
  ) {
    return this.adminService.getUserCommunities(userId, listQueryDto);
  }

  @Get('users/:userId/comments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async getUserComments(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() listQueryDto: ListQueryDto,
  ) {
    return this.adminService.getUserComments(userId, listQueryDto);
  }

  @Get('users/:userId/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async getUserStats(@Param('userId', ParseIntPipe) userId: number) {
    return this.adminService.getUserStats(userId);
  }

  @Put('users/:userId/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async updateUserStatus(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() updateUserStatusDto: UpdateUserStatusDto,
    @GetUser() admin: any,
  ) {
    return this.adminService.updateUserStatus(
      userId,
      updateUserStatusDto,
      admin.userId,
    );
  }

  @Delete('users/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async deleteUser(
    @Param('userId', ParseIntPipe) userId: number,
    @GetUser() admin: any,
  ) {
    return this.adminService.deleteUser(userId, admin.userId);
  }

  // Post Management
  @Get('posts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async getPosts(@Query() listQueryDto: ListPostsQueryDto) {
    return this.adminService.getPosts(listQueryDto);
  }

  @Get('posts/:postId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async getPostById(@Param('postId', ParseIntPipe) postId: number) {
    return this.adminService.getPostByIdEnhanced(postId);
  }

  @Get('posts/:postId/comments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async getPostComments(
    @Param('postId', ParseIntPipe) postId: number,
    @Query() listQueryDto: ListQueryDto,
  ) {
    return this.adminService.getPostComments(postId, listQueryDto);
  }

  @Get('posts/:postId/analytics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async getPostAnalytics(
    @Param('postId', ParseIntPipe) postId: number,
    @Query('time_range') timeRange?: string,
  ) {
    return this.adminService.getPostAnalytics(postId, timeRange);
  }

  @Post('posts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FilesInterceptor('files', 3, {
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max per file
    }),
  )
  async createPost(
    @GetUser() admin: any,
    @Body() createPostDto: CreatePostDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.adminService.createPost(createPostDto, admin.userId, files);
  }

  @Put('posts/:postId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FilesInterceptor('files', 3, {
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max per file
    }),
  )
  async updatePost(
    @Param('postId', ParseIntPipe) postId: number,
    @Body() updatePostDto: UpdatePostDto,
    @GetUser() admin: any,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.adminService.updatePost(postId, updatePostDto, admin.userId, files);
  }

  @Put('posts/:postId/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async updatePostStatus(
    @Param('postId', ParseIntPipe) postId: number,
    @Body() updatePostStatusDto: UpdatePostStatusDto,
    @GetUser() admin: any,
  ) {
    return this.adminService.updatePostStatus(
      postId,
      updatePostStatusDto,
      admin.userId,
    );
  }

  @Delete('posts/:postId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async deletePost(
    @Param('postId', ParseIntPipe) postId: number,
    @GetUser() admin: any,
  ) {
    return this.adminService.deletePost(postId, admin.userId);
  }

  // Comment Management
  @Get('comments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async getComments(@Query() listQueryDto: ListCommentsQueryDto) {
    return this.adminService.getComments(listQueryDto);
  }

  @Get('comments/:commentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async getCommentById(@Param('commentId', ParseIntPipe) commentId: number) {
    return this.adminService.getCommentByIdEnhanced(commentId);
  }

  @Get('comments/:commentId/replies')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async getCommentReplies(
    @Param('commentId', ParseIntPipe) commentId: number,
    @Query() listQueryDto: ListQueryDto,
  ) {
    return this.adminService.getCommentReplies(commentId, listQueryDto);
  }

  @Put('comments/:commentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async updateComment(
    @Param('commentId', ParseIntPipe) commentId: number,
    @Body() updateCommentDto: UpdateCommentDto,
    @GetUser() admin: any,
  ) {
    return this.adminService.updateComment(commentId, updateCommentDto, admin.userId);
  }

  @Delete('comments/:commentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async deleteComment(
    @Param('commentId', ParseIntPipe) commentId: number,
    @GetUser() admin: any,
  ) {
    return this.adminService.deleteComment(commentId, admin.userId);
  }

  // Topic Management
  @Get('topics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async getTopics(@Query() listQueryDto: ListTopicsQueryDto) {
    return this.adminService.getTopics(listQueryDto);
  }

  @Get('parent-topics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async getParentTopics(@Query() listQueryDto: ListQueryDto) {
    return this.adminService.getParentTopics(listQueryDto);
  }

  @Get('topics/select-list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async getTopicsForSelectList(): Promise<TopicSelectListDto[]> {
    return this.adminService.getTopicsForSelectList();
  }

  @Get('topics/:topicId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async getTopicById(@Param('topicId', ParseIntPipe) topicId: number) {
    return this.adminService.getTopicByIdEnhanced(topicId);
  }

  @Get('topics/:topicId/posts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async getTopicPosts(
    @Param('topicId', ParseIntPipe) topicId: number,
    @Query() listQueryDto: ListQueryDto,
  ) {
    return this.adminService.getTopicPosts(topicId, listQueryDto);
  }

  @Get('topics/:topicId/communities')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async getTopicCommunities(
    @Param('topicId', ParseIntPipe) topicId: number,
    @Query() listQueryDto: ListQueryDto,
  ) {
    return this.adminService.getTopicCommunities(topicId, listQueryDto);
  }

  @Get('topics/:topicId/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async getTopicStats(@Param('topicId', ParseIntPipe) topicId: number) {
    return this.adminService.getTopicStats(topicId);
  }

  @Post('topics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('topic_image', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    }),
  )
  async createTopic(
    @GetUser() admin: any,
    @Body() createTopicDto: CreateTopicDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.adminService.createTopic(createTopicDto, admin.userId, file);
  }

  @Put('topics/:topicId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('topic_image', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    }),
  )
  async updateTopic(
    @Param('topicId', ParseIntPipe) topicId: number,
    @Body() updateTopicDto: UpdateTopicDto,
    @GetUser() admin: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.adminService.updateTopic(topicId, updateTopicDto, admin.userId, file);
  }

  @Put('topics/:topicId/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async updateTopicStatus(
    @Param('topicId', ParseIntPipe) topicId: number,
    @Body() updateTopicStatusDto: UpdateTopicStatusDto,
    @GetUser() admin: any,
  ) {
    return this.adminService.updateTopicStatus(
      topicId,
      updateTopicStatusDto,
      admin.userId,
    );
  }

  @Delete('topics/:topicId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async deleteTopic(
    @Param('topicId', ParseIntPipe) topicId: number,
    @GetUser() admin: any,
  ): Promise<{ message: string }> {
    return this.adminService.deleteTopic(topicId, admin.userId);
  }

  // Community Management
  @Get('communities')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async getCommunities(@Query() listQueryDto: ListCommunitiesQueryDto) {
    return this.adminService.getCommunities(listQueryDto);
  }

  @Get('communities/:communityId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async getCommunityById(
    @Param('communityId', ParseIntPipe) communityId: number,
  ) {
    return this.adminService.getCommunityByIdEnhanced(communityId);
  }

  @Post('communities')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('community_image', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    }),
  )
  async createCommunity(
    @GetUser() admin: any,
    @Body() createCommunityDto: CreateCommunityDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    // Debug logging
    console.log('=== CONTROLLER: CREATE COMMUNITY ===');
    console.log('Raw DTO received:', JSON.stringify(createCommunityDto, null, 2));
    console.log('is_active value:', createCommunityDto.is_active);
    console.log('is_active type:', typeof createCommunityDto.is_active);

    return this.adminService.createCommunity(createCommunityDto, admin.userId, file);
  }

  @Put('communities/:communityId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('community_image', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    }),
  )
  async updateCommunity(
    @Param('communityId', ParseIntPipe) communityId: number,
    @Body() updateCommunityDto: UpdateCommunityDto,
    @GetUser() admin: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    // Debug logging
    console.log('=== CONTROLLER: UPDATE COMMUNITY ===');
    console.log('Raw DTO received:', JSON.stringify(updateCommunityDto, null, 2));
    console.log('is_active value:', updateCommunityDto.is_active);
    console.log('is_active type:', typeof updateCommunityDto.is_active);

    return this.adminService.updateCommunity(communityId, updateCommunityDto, admin.userId, file);
  }

  @Put('communities/:communityId/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async updateCommunityStatus(
    @Param('communityId', ParseIntPipe) communityId: number,
    @Body() updateCommunityStatusDto: UpdateCommunityStatusDto,
    @GetUser() admin: any,
  ) {
    return this.adminService.updateCommunityStatus(
      communityId,
      updateCommunityStatusDto,
      admin.userId,
    );
  }

  @Delete('communities/:communityId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async deleteCommunity(
    @Param('communityId', ParseIntPipe) communityId: number,
    @GetUser() admin: any,
  ) {
    return this.adminService.deleteCommunity(communityId, admin.userId);
  }

  @Get('communities/:communityId/members')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async getCommunityMembers(
    @Param('communityId', ParseIntPipe) communityId: number,
    @Query() listQueryDto: ListQueryDto,
  ) {
    return this.adminService.getCommunityMembers(communityId, listQueryDto);
  }

  @Put('communities/:communityId/members/:memberId/role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async updateMemberRole(
    @Param('communityId', ParseIntPipe) communityId: number,
    @Param('memberId', ParseIntPipe) memberId: number,
    @Body() updateMemberRoleDto: UpdateMemberRoleDto,
    @GetUser() admin: any,
  ) {
    return this.adminService.updateMemberRole(
      communityId,
      memberId,
      updateMemberRoleDto,
      admin.userId,
    );
  }

  @Get('communities/:communityId/topics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async getCommunityTopics(
    @Param('communityId', ParseIntPipe) communityId: number,
  ) {
    return this.adminService.getCommunityTopics(communityId);
  }

  @Post('communities/:communityId/topics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async addTopicToCommunity(
    @Param('communityId', ParseIntPipe) communityId: number,
    @Body() addTopicDto: AddTopicToCommunityDto,
    @GetUser() admin: any,
  ) {
    return this.adminService.addTopicToCommunity(communityId, addTopicDto, admin.userId);
  }

  @Delete('communities/:communityId/topics/:topicId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async removeTopicFromCommunity(
    @Param('communityId', ParseIntPipe) communityId: number,
    @Param('topicId', ParseIntPipe) topicId: number,
    @GetUser() admin: any,
  ) {
    return this.adminService.removeTopicFromCommunity(communityId, topicId, admin.userId);
  }

  // Poll Management
  @Get('polls')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async getPolls(@Query() listQueryDto: ListPollsQueryDto) {
    return this.adminService.getPolls(listQueryDto);
  }

  @Get('polls/:pollId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async getPollById(@Param('pollId', ParseIntPipe) pollId: number) {
    return this.adminService.getPollByIdEnhanced(pollId);
  }

  @Get('polls/:pollId/analytics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async getPollAnalytics(@Param('pollId', ParseIntPipe) pollId: number) {
    return this.adminService.getPollAnalytics(pollId);
  }

  @Get('polls/:pollId/votes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async getPollVotes(
    @Param('pollId', ParseIntPipe) pollId: number,
    @Query() listQueryDto: ListQueryDto,
  ) {
    return this.adminService.getPollVotes(pollId, listQueryDto);
  }

  @Post('polls')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createPoll(
    @GetUser() admin: any,
    @Body() createPollDto: CreatePollDto,
  ) {
    return this.adminService.createPoll(createPollDto, admin.userId);
  }

  @Put('polls/:pollId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async updatePoll(
    @Param('pollId', ParseIntPipe) pollId: number,
    @Body() updatePollDto: UpdatePollDto,
    @GetUser() admin: any,
  ) {
    return this.adminService.updatePoll(pollId, updatePollDto, admin.userId);
  }

  @Delete('polls/:pollId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async deletePoll(
    @Param('pollId', ParseIntPipe) pollId: number,
    @GetUser() admin: any,
  ) {
    return this.adminService.deletePoll(pollId, admin.userId);
  }

  // ========== Subscription Management ==========

  @Get('subscriptions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async getSubscriptions(@Query() listQueryDto: ListSubscriptionsQueryDto) {
    return this.adminService.getSubscriptions(listQueryDto);
  }

  @Get('subscriptions/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async getSubscriptionById(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getSubscriptionById(id);
  }

  @Post('subscriptions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createSubscription(
    @GetUser() admin: any,
    @Body() createSubscriptionDto: CreateSubscriptionDto,
  ) {
    return this.adminService.createSubscription(createSubscriptionDto, admin.userId);
  }

  @Put('subscriptions/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async updateSubscription(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() admin: any,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
  ) {
    return this.adminService.updateSubscription(id, updateSubscriptionDto, admin.userId);
  }

  @Delete('subscriptions/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async deleteSubscription(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() admin: any,
  ) {
    return this.adminService.deleteSubscription(id, admin.userId);
  }

  // ========== User Subscription Management ==========

  @Get('user-subscriptions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async getUserSubscriptions(@Query() listQueryDto: ListUserSubscriptionsQueryDto) {
    return this.adminService.getUserSubscriptions(listQueryDto);
  }

  @Get('user-subscriptions/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async getUserSubscriptionById(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getUserSubscriptionById(id);
  }

  @Put('user-subscriptions/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async updateUserSubscriptionStatus(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() admin: any,
    @Body('status') status: SubscriptionStatus,
  ) {
    return this.adminService.updateUserSubscriptionStatus(id, status, admin.userId);
  }

  // ========== Payment Management ==========

  @Get('payments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async getPayments(@Query() listQueryDto: ListPaymentsQueryDto) {
    return this.adminService.getPayments(listQueryDto);
  }

  @Get('payments/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async getPaymentById(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getPaymentById(id);
  }

  @Post('payments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createPayment(
    @GetUser() admin: any,
    @Body() createPaymentDto: CreatePaymentDto,
  ) {
    return this.adminService.createPayment(createPaymentDto, admin.userId);
  }

  @Put('payments/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async updatePaymentStatus(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() admin: any,
    @Body('status') status: PaymentStatus,
  ) {
    return this.adminService.updatePaymentStatus(id, status, admin.userId);
  }

  // ========== Subscription & Payment Notifications ==========

  @Get('notifications/subscription-payment')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async getSubscriptionPaymentNotifications(
    @Query() listQueryDto: ListSubscriptionPaymentNotificationsDto,
  ) {
    return this.adminService.getSubscriptionPaymentNotifications(listQueryDto);
  }

  // ========== Bulk Operations ==========

  @Put('users/bulk-update')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async bulkUpdateUsers(
    @GetUser() admin: any,
    @Body() bulkUpdateDto: BulkUpdateDto,
  ) {
    return this.adminService.bulkUpdateUsers(bulkUpdateDto, admin.userId);
  }

  @Put('posts/bulk-update')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async bulkUpdatePosts(
    @GetUser() admin: any,
    @Body() bulkUpdateDto: BulkUpdateDto,
  ) {
    return this.adminService.bulkUpdatePosts(bulkUpdateDto, admin.userId);
  }





  @Put('communities/bulk-update')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async bulkUpdateCommunities(
    @GetUser() admin: any,
    @Body() bulkUpdateDto: BulkUpdateDto,
  ) {
    return this.adminService.bulkUpdateCommunities(bulkUpdateDto, admin.userId);
  }

  @Put('topics/bulk-update')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async bulkUpdateTopics(
    @GetUser() admin: any,
    @Body() bulkUpdateDto: BulkUpdateDto,
  ) {
    return this.adminService.bulkUpdateTopics(bulkUpdateDto, admin.userId);
  }

}

