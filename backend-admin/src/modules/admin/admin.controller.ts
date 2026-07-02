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
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
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
import { UserRole, SubscriptionStatus, PaymentStatus } from '@prisma/client';
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
import { ListSubscriptionPaymentNotificationsDto } from './dto/list-subscription-payment-notifications.dto';
import { TopicSelectListDto } from '../general/dto/topic-select-list.dto';

@ApiTags('Admin')
@ApiBearerAuth('JWT-auth')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ========== Auth ==========

  @ApiOperation({ summary: 'Admin login' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() adminLoginDto: AdminLoginDto): Promise<AuthResponseDto> {
    return this.adminService.login(adminLoginDto);
  }

  @ApiOperation({ summary: 'Admin logout' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post('logout')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async logout(@GetUser() admin: any): Promise<{ message: string }> {
    return this.adminService.logout(admin.userId);
  }

  @ApiOperation({ summary: 'Admin forgot password' })
  @ApiResponse({ status: 200, description: 'Password reset email sent' })
  @ApiResponse({ status: 404, description: 'Admin not found' })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body() forgotPasswordDto: AdminForgotPasswordDto,
  ): Promise<{ message: string }> {
    return this.adminService.forgotPassword(forgotPasswordDto);
  }

  @ApiOperation({ summary: 'Admin reset password' })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  @ApiResponse({ status: 400, description: 'Invalid or expired reset code' })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() resetPasswordDto: AdminResetPasswordDto,
  ): Promise<{ message: string }> {
    return this.adminService.resetPassword(resetPasswordDto);
  }

  @ApiOperation({ summary: 'Admin change password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Old password is incorrect' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post('change-password')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @GetUser() admin: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    return this.adminService.changePassword(admin.userId, changePasswordDto);
  }

  // ========== Dashboard ==========

  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard stats returned',
    type: DashboardStatsDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('dashboard/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async getDashboardStats(
    @Query() queryDto: DashboardStatsQueryDto,
  ): Promise<DashboardStatsDto> {
    return this.adminService.getDashboardStats(queryDto);
  }

  @ApiOperation({ summary: 'Get user growth metrics' })
  @ApiResponse({ status: 200, description: 'User growth data returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('dashboard/user-growth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async getUserGrowth(@Query() queryDto: UserGrowthQueryDto) {
    return this.adminService.getUserGrowth(queryDto);
  }

  // ========== Search ==========

  @ApiOperation({ summary: 'Global admin search' })
  @ApiResponse({ status: 200, description: 'Search results returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('search')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async search(@Query() searchQueryDto: SearchQueryDto) {
    return this.adminService.search(searchQueryDto);
  }

  // ========== Export Functionality ==========

  @ApiOperation({ summary: 'Export users list' })
  @ApiResponse({ status: 200, description: 'Users export data returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('users/export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async exportUsers(@Query() listQueryDto: ListUsersQueryDto) {
    return this.adminService.exportUsers(listQueryDto);
  }

  @ApiOperation({ summary: 'Export posts list' })
  @ApiResponse({ status: 200, description: 'Posts export data returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('posts/export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async exportPosts(@Query() listQueryDto: ListPostsQueryDto) {
    return this.adminService.exportPosts(listQueryDto);
  }

  @ApiOperation({ summary: 'Export comments list' })
  @ApiResponse({ status: 200, description: 'Comments export data returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('comments/export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async exportComments(@Query() listQueryDto: ListCommentsQueryDto) {
    return this.adminService.exportComments(listQueryDto);
  }

  @ApiOperation({ summary: 'Export communities list' })
  @ApiResponse({ status: 200, description: 'Communities export data returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('communities/export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async exportCommunities(@Query() listQueryDto: ListCommunitiesQueryDto) {
    return this.adminService.exportCommunities(listQueryDto);
  }

  @ApiOperation({ summary: 'Export topics list' })
  @ApiResponse({ status: 200, description: 'Topics export data returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('topics/export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async exportTopics(@Query() listQueryDto: ListTopicsQueryDto) {
    return this.adminService.exportTopics(listQueryDto);
  }

  @ApiOperation({ summary: 'Export polls list' })
  @ApiResponse({ status: 200, description: 'Polls export data returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('polls/export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async exportPolls(@Query() listQueryDto: ListPollsQueryDto) {
    return this.adminService.exportPolls(listQueryDto);
  }

  @ApiOperation({ summary: 'Export subscriptions list' })
  @ApiResponse({
    status: 200,
    description: 'Subscriptions export data returned',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('subscriptions/export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async exportSubscriptions(@Query() listQueryDto: ListSubscriptionsQueryDto) {
    return this.adminService.exportSubscriptions(listQueryDto);
  }

  @ApiOperation({ summary: 'Export payments list' })
  @ApiResponse({ status: 200, description: 'Payments export data returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('payments/export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async exportPayments(@Query() listQueryDto: ListPaymentsQueryDto) {
    return this.adminService.exportPayments(listQueryDto);
  }

  // ========== User Management ==========

  @ApiOperation({ summary: 'List users' })
  @ApiResponse({ status: 200, description: 'Paginated list of users returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async getUsers(@Query() listQueryDto: ListUsersQueryDto) {
    return this.adminService.getUsers(listQueryDto);
  }

  @ApiOperation({ summary: 'List soft-deleted users' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of deleted users returned',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('users/deleted')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async getDeletedUsers(@Query() listQueryDto: ListUsersQueryDto) {
    return this.adminService.getDeletedUsers(listQueryDto);
  }

  @ApiOperation({ summary: 'Restore a soft-deleted user' })
  @ApiParam({ name: 'userId', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'User restored successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Put('users/:userId/restore')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async restoreUser(
    @Param('userId', ParseIntPipe) userId: number,
    @GetUser() admin: any,
  ) {
    return this.adminService.restoreUser(userId, admin.userId);
  }

  @ApiOperation({ summary: 'Permanently delete a user (hard delete)' })
  @ApiParam({ name: 'userId', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'User permanently deleted' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Delete('users/:userId/hard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  @HttpCode(HttpStatus.OK)
  async hardDeleteUser(
    @Param('userId', ParseIntPipe) userId: number,
    @GetUser() admin: any,
  ) {
    return this.adminService.hardDeleteUser(userId, admin.userId);
  }

  @ApiOperation({ summary: 'Create user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.CREATED)
  async createUser(
    @GetUser() admin: any,
    @Body() createUserDto: CreateUserDto,
  ) {
    return this.adminService.createUser(createUserDto, admin.userId);
  }

  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'userId', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'User returned' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('users/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async getUserById(@Param('userId', ParseIntPipe) userId: number) {
    return this.adminService.getUserById(userId);
  }

  @ApiOperation({ summary: 'Update user' })
  @ApiParam({ name: 'userId', type: Number, example: 1 })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description:
      'User update payload. Attach profile_picture and/or profile_background as files.',
    schema: {
      type: 'object',
      properties: {
        username: { type: 'string', example: 'johndoe' },
        email: { type: 'string', example: 'john@example.com' },
        full_name: { type: 'string', example: 'John Doe' },
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description:
            'Up to 2 image files (profile picture and/or background)',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Put('users/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FilesInterceptor('files', 2, {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max per file
      fileFilter: (req, file, cb) => {
        // Only allow image files - strict type checking
        const allowedMimeTypes = [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/gif',
          'image/webp',
        ];
        if (allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Only image files are allowed (JPEG, PNG, GIF, WebP)',
            ),
            false,
          );
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
    return this.adminService.updateUser(
      userId,
      updateUserDto,
      admin.userId,
      files,
    );
  }

  @ApiOperation({ summary: 'Get posts by user' })
  @ApiParam({ name: 'userId', type: Number, example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of user posts returned',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('users/:userId/posts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async getUserPosts(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() listQueryDto: ListQueryDto,
  ) {
    return this.adminService.getUserPosts(userId, listQueryDto);
  }

  @ApiOperation({ summary: 'Get communities by user' })
  @ApiParam({ name: 'userId', type: Number, example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of user communities returned',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('users/:userId/communities')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async getUserCommunities(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() listQueryDto: ListQueryDto,
  ) {
    return this.adminService.getUserCommunities(userId, listQueryDto);
  }

  @ApiOperation({ summary: 'Get comments by user' })
  @ApiParam({ name: 'userId', type: Number, example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of user comments returned',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('users/:userId/comments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async getUserComments(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() listQueryDto: ListQueryDto,
  ) {
    return this.adminService.getUserComments(userId, listQueryDto);
  }

  @ApiOperation({ summary: 'Get user statistics' })
  @ApiParam({ name: 'userId', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'User stats returned' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('users/:userId/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async getUserStats(@Param('userId', ParseIntPipe) userId: number) {
    return this.adminService.getUserStats(userId);
  }

  @ApiOperation({ summary: 'Update user status or role' })
  @ApiParam({ name: 'userId', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'User status updated' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Put('users/:userId/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
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

  @ApiOperation({ summary: 'Delete user (soft delete)' })
  @ApiParam({ name: 'userId', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Delete('users/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async deleteUser(
    @Param('userId', ParseIntPipe) userId: number,
    @GetUser() admin: any,
  ) {
    return this.adminService.deleteUser(userId, admin.userId);
  }

  // ========== Post Management ==========

  @ApiOperation({ summary: 'List posts (admin)' })
  @ApiResponse({ status: 200, description: 'Paginated list of posts returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('posts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async getPosts(@Query() listQueryDto: ListPostsQueryDto) {
    return this.adminService.getPosts(listQueryDto);
  }

  @ApiOperation({ summary: 'Get post by ID' })
  @ApiParam({ name: 'postId', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Post returned' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('posts/:postId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async getPostById(@Param('postId', ParseIntPipe) postId: number) {
    return this.adminService.getPostByIdEnhanced(postId);
  }

  @ApiOperation({ summary: 'Get comments on a post' })
  @ApiParam({ name: 'postId', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Paginated comments returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('posts/:postId/comments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async getPostComments(
    @Param('postId', ParseIntPipe) postId: number,
    @Query() listQueryDto: ListQueryDto,
  ) {
    return this.adminService.getPostComments(postId, listQueryDto);
  }

  @ApiOperation({ summary: 'Get post analytics' })
  @ApiParam({ name: 'postId', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Post analytics returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('posts/:postId/analytics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async getPostAnalytics(
    @Param('postId', ParseIntPipe) postId: number,
    @Query('time_range') timeRange?: string,
  ) {
    return this.adminService.getPostAnalytics(postId, timeRange);
  }

  @ApiOperation({ summary: 'Create post (admin)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Post creation payload with optional media files.',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'My Post Title' },
        content: { type: 'string', example: 'Post content here' },
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Up to 3 media files',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Post created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post('posts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
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

  @ApiOperation({ summary: 'Update post (admin)' })
  @ApiParam({ name: 'postId', type: Number, example: 1 })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Post update payload with optional media files.',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Updated Post Title' },
        content: { type: 'string', example: 'Updated content here' },
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Up to 3 media files',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Post updated successfully' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Put('posts/:postId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
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
    return this.adminService.updatePost(
      postId,
      updatePostDto,
      admin.userId,
      files,
    );
  }

  @ApiOperation({ summary: 'Update post status or featured flag' })
  @ApiParam({ name: 'postId', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Post status updated' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Put('posts/:postId/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
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

  @ApiOperation({ summary: 'Delete post (admin)' })
  @ApiParam({ name: 'postId', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Post deleted successfully' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Delete('posts/:postId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async deletePost(
    @Param('postId', ParseIntPipe) postId: number,
    @GetUser() admin: any,
  ) {
    return this.adminService.deletePost(postId, admin.userId);
  }

  // ========== Comment Management ==========

  @ApiOperation({ summary: 'List comments (admin)' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of comments returned',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('comments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async getComments(@Query() listQueryDto: ListCommentsQueryDto) {
    return this.adminService.getComments(listQueryDto);
  }

  @ApiOperation({ summary: 'Get comment by ID' })
  @ApiParam({ name: 'commentId', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Comment returned' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('comments/:commentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async getCommentById(@Param('commentId', ParseIntPipe) commentId: number) {
    return this.adminService.getCommentByIdEnhanced(commentId);
  }

  @ApiOperation({ summary: 'Get replies for a comment' })
  @ApiParam({ name: 'commentId', type: Number, example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of replies returned',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('comments/:commentId/replies')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async getCommentReplies(
    @Param('commentId', ParseIntPipe) commentId: number,
    @Query() listQueryDto: ListQueryDto,
  ) {
    return this.adminService.getCommentReplies(commentId, listQueryDto);
  }

  @ApiOperation({ summary: 'Update comment (admin)' })
  @ApiParam({ name: 'commentId', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Comment updated successfully' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Put('comments/:commentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async updateComment(
    @Param('commentId', ParseIntPipe) commentId: number,
    @Body() updateCommentDto: UpdateCommentDto,
    @GetUser() admin: any,
  ) {
    return this.adminService.updateComment(
      commentId,
      updateCommentDto,
      admin.userId,
    );
  }

  @ApiOperation({ summary: 'Delete comment (admin)' })
  @ApiParam({ name: 'commentId', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Comment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Delete('comments/:commentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async deleteComment(
    @Param('commentId', ParseIntPipe) commentId: number,
    @GetUser() admin: any,
  ) {
    return this.adminService.deleteComment(commentId, admin.userId);
  }

  // ========== Topic Management ==========

  @ApiOperation({ summary: 'List topics (admin)' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of topics returned',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('topics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async getTopics(@Query() listQueryDto: ListTopicsQueryDto) {
    return this.adminService.getTopics(listQueryDto);
  }

  @ApiOperation({ summary: 'List parent topics' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of parent topics returned',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('parent-topics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async getParentTopics(@Query() listQueryDto: ListQueryDto) {
    return this.adminService.getParentTopics(listQueryDto);
  }

  @ApiOperation({ summary: 'Get topics select list (id + name only)' })
  @ApiResponse({
    status: 200,
    description: 'Topics select list returned',
    type: [TopicSelectListDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('topics/select-list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async getTopicsForSelectList(): Promise<TopicSelectListDto[]> {
    return this.adminService.getTopicsForSelectList();
  }

  @ApiOperation({ summary: 'Get topic by ID' })
  @ApiParam({ name: 'topicId', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Topic returned' })
  @ApiResponse({ status: 404, description: 'Topic not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('topics/:topicId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async getTopicById(@Param('topicId', ParseIntPipe) topicId: number) {
    return this.adminService.getTopicByIdEnhanced(topicId);
  }

  @ApiOperation({ summary: 'Get posts in a topic' })
  @ApiParam({ name: 'topicId', type: Number, example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of topic posts returned',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('topics/:topicId/posts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async getTopicPosts(
    @Param('topicId', ParseIntPipe) topicId: number,
    @Query() listQueryDto: ListQueryDto,
  ) {
    return this.adminService.getTopicPosts(topicId, listQueryDto);
  }

  @ApiOperation({ summary: 'Get communities in a topic' })
  @ApiParam({ name: 'topicId', type: Number, example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of topic communities returned',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('topics/:topicId/communities')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async getTopicCommunities(
    @Param('topicId', ParseIntPipe) topicId: number,
    @Query() listQueryDto: ListQueryDto,
  ) {
    return this.adminService.getTopicCommunities(topicId, listQueryDto);
  }

  @ApiOperation({ summary: 'Get topic statistics' })
  @ApiParam({ name: 'topicId', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Topic stats returned' })
  @ApiResponse({ status: 404, description: 'Topic not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('topics/:topicId/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async getTopicStats(@Param('topicId', ParseIntPipe) topicId: number) {
    return this.adminService.getTopicStats(topicId);
  }

  @ApiOperation({ summary: 'Create topic (admin)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Topic creation payload with optional image.',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Technology' },
        slug: { type: 'string', example: 'technology' },
        topic_image: {
          type: 'string',
          format: 'binary',
          description: 'Topic image file',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Topic created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post('topics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
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

  @ApiOperation({ summary: 'Update topic (admin)' })
  @ApiParam({ name: 'topicId', type: Number, example: 1 })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Topic update payload with optional image.',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Technology' },
        slug: { type: 'string', example: 'technology' },
        topic_image: {
          type: 'string',
          format: 'binary',
          description: 'Topic image file',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Topic updated successfully' })
  @ApiResponse({ status: 404, description: 'Topic not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Put('topics/:topicId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
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
    return this.adminService.updateTopic(
      topicId,
      updateTopicDto,
      admin.userId,
      file,
    );
  }

  @ApiOperation({ summary: 'Update topic status (active/inactive)' })
  @ApiParam({ name: 'topicId', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Topic status updated' })
  @ApiResponse({ status: 404, description: 'Topic not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Put('topics/:topicId/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
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

  @ApiOperation({ summary: 'Delete topic (admin)' })
  @ApiParam({ name: 'topicId', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Topic deleted successfully' })
  @ApiResponse({ status: 404, description: 'Topic not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Delete('topics/:topicId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async deleteTopic(
    @Param('topicId', ParseIntPipe) topicId: number,
    @GetUser() admin: any,
  ): Promise<{ message: string }> {
    return this.adminService.deleteTopic(topicId, admin.userId);
  }

  // ========== Community Management ==========

  @ApiOperation({ summary: 'List communities (admin)' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of communities returned',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('communities')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async getCommunities(@Query() listQueryDto: ListCommunitiesQueryDto) {
    return this.adminService.getCommunities(listQueryDto);
  }

  @ApiOperation({ summary: 'Get community by ID' })
  @ApiParam({ name: 'communityId', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Community returned' })
  @ApiResponse({ status: 404, description: 'Community not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('communities/:communityId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async getCommunityById(
    @Param('communityId', ParseIntPipe) communityId: number,
  ) {
    return this.adminService.getCommunityByIdEnhanced(communityId);
  }

  @ApiOperation({ summary: 'Create community (admin)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Community creation payload with optional banner image.',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Tech Enthusiasts' },
        description: { type: 'string', example: 'A community for tech lovers' },
        community_image: {
          type: 'string',
          format: 'binary',
          description: 'Community banner image',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Community created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post('communities')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
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
    console.log(
      'Raw DTO received:',
      JSON.stringify(createCommunityDto, null, 2),
    );
    console.log('is_active value:', createCommunityDto.is_active);
    console.log('is_active type:', typeof createCommunityDto.is_active);

    return this.adminService.createCommunity(
      createCommunityDto,
      admin.userId,
      file,
    );
  }

  @ApiOperation({ summary: 'Update community (admin)' })
  @ApiParam({ name: 'communityId', type: Number, example: 1 })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Community update payload with optional banner image.',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Tech Enthusiasts' },
        description: { type: 'string', example: 'A community for tech lovers' },
        community_image: {
          type: 'string',
          format: 'binary',
          description: 'Community banner image',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Community updated successfully' })
  @ApiResponse({ status: 404, description: 'Community not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Put('communities/:communityId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
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
    console.log(
      'Raw DTO received:',
      JSON.stringify(updateCommunityDto, null, 2),
    );
    console.log('is_active value:', updateCommunityDto.is_active);
    console.log('is_active type:', typeof updateCommunityDto.is_active);

    return this.adminService.updateCommunity(
      communityId,
      updateCommunityDto,
      admin.userId,
      file,
    );
  }

  @ApiOperation({ summary: 'Update community status (active/inactive)' })
  @ApiParam({ name: 'communityId', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Community status updated' })
  @ApiResponse({ status: 404, description: 'Community not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Put('communities/:communityId/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
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

  @ApiOperation({ summary: 'Delete community (admin)' })
  @ApiParam({ name: 'communityId', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Community deleted successfully' })
  @ApiResponse({ status: 404, description: 'Community not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Delete('communities/:communityId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async deleteCommunity(
    @Param('communityId', ParseIntPipe) communityId: number,
    @GetUser() admin: any,
  ) {
    return this.adminService.deleteCommunity(communityId, admin.userId);
  }

  @ApiOperation({ summary: 'Get community members' })
  @ApiParam({ name: 'communityId', type: Number, example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of community members returned',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('communities/:communityId/members')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async getCommunityMembers(
    @Param('communityId', ParseIntPipe) communityId: number,
    @Query() listQueryDto: ListQueryDto,
  ) {
    return this.adminService.getCommunityMembers(communityId, listQueryDto);
  }

  @ApiOperation({ summary: 'Update community member role' })
  @ApiParam({ name: 'communityId', type: Number, example: 1 })
  @ApiParam({ name: 'memberId', type: Number, example: 5 })
  @ApiResponse({ status: 200, description: 'Member role updated' })
  @ApiResponse({ status: 404, description: 'Community or member not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Put('communities/:communityId/members/:memberId/role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
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

  @ApiOperation({ summary: 'Get topics in a community' })
  @ApiParam({ name: 'communityId', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Community topics returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('communities/:communityId/topics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async getCommunityTopics(
    @Param('communityId', ParseIntPipe) communityId: number,
  ) {
    return this.adminService.getCommunityTopics(communityId);
  }

  @ApiOperation({ summary: 'Add topic to community' })
  @ApiParam({ name: 'communityId', type: Number, example: 1 })
  @ApiResponse({ status: 201, description: 'Topic added to community' })
  @ApiResponse({ status: 404, description: 'Community or topic not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post('communities/:communityId/topics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.CREATED)
  async addTopicToCommunity(
    @Param('communityId', ParseIntPipe) communityId: number,
    @Body() addTopicDto: AddTopicToCommunityDto,
    @GetUser() admin: any,
  ) {
    return this.adminService.addTopicToCommunity(
      communityId,
      addTopicDto,
      admin.userId,
    );
  }

  @ApiOperation({ summary: 'Remove topic from community' })
  @ApiParam({ name: 'communityId', type: Number, example: 1 })
  @ApiParam({ name: 'topicId', type: Number, example: 3 })
  @ApiResponse({ status: 200, description: 'Topic removed from community' })
  @ApiResponse({ status: 404, description: 'Community or topic not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Delete('communities/:communityId/topics/:topicId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async removeTopicFromCommunity(
    @Param('communityId', ParseIntPipe) communityId: number,
    @Param('topicId', ParseIntPipe) topicId: number,
    @GetUser() admin: any,
  ) {
    return this.adminService.removeTopicFromCommunity(
      communityId,
      topicId,
      admin.userId,
    );
  }

  // ========== Poll Management ==========

  @ApiOperation({ summary: 'List polls (admin)' })
  @ApiResponse({ status: 200, description: 'Paginated list of polls returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('polls')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async getPolls(@Query() listQueryDto: ListPollsQueryDto) {
    return this.adminService.getPolls(listQueryDto);
  }

  @ApiOperation({ summary: 'Get poll by ID' })
  @ApiParam({ name: 'pollId', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Poll returned' })
  @ApiResponse({ status: 404, description: 'Poll not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('polls/:pollId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async getPollById(@Param('pollId', ParseIntPipe) pollId: number) {
    return this.adminService.getPollByIdEnhanced(pollId);
  }

  @ApiOperation({ summary: 'Get poll analytics' })
  @ApiParam({ name: 'pollId', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Poll analytics returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('polls/:pollId/analytics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async getPollAnalytics(@Param('pollId', ParseIntPipe) pollId: number) {
    return this.adminService.getPollAnalytics(pollId);
  }

  @ApiOperation({ summary: 'Get poll votes' })
  @ApiParam({ name: 'pollId', type: Number, example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of poll votes returned',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('polls/:pollId/votes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async getPollVotes(
    @Param('pollId', ParseIntPipe) pollId: number,
    @Query() listQueryDto: ListQueryDto,
  ) {
    return this.adminService.getPollVotes(pollId, listQueryDto);
  }

  @ApiOperation({ summary: 'Create poll (admin)' })
  @ApiResponse({ status: 201, description: 'Poll created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post('polls')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.CREATED)
  async createPoll(
    @GetUser() admin: any,
    @Body() createPollDto: CreatePollDto,
  ) {
    return this.adminService.createPoll(createPollDto, admin.userId);
  }

  @ApiOperation({ summary: 'Update poll (admin)' })
  @ApiParam({ name: 'pollId', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Poll updated successfully' })
  @ApiResponse({ status: 404, description: 'Poll not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Put('polls/:pollId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async updatePoll(
    @Param('pollId', ParseIntPipe) pollId: number,
    @Body() updatePollDto: UpdatePollDto,
    @GetUser() admin: any,
  ) {
    return this.adminService.updatePoll(pollId, updatePollDto, admin.userId);
  }

  @ApiOperation({ summary: 'Delete poll (admin)' })
  @ApiParam({ name: 'pollId', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Poll deleted successfully' })
  @ApiResponse({ status: 404, description: 'Poll not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Delete('polls/:pollId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async deletePoll(
    @Param('pollId', ParseIntPipe) pollId: number,
    @GetUser() admin: any,
  ) {
    return this.adminService.deletePoll(pollId, admin.userId);
  }

  // ========== Subscription Management ==========

  @ApiOperation({ summary: 'List subscription plans (admin)' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of subscriptions returned',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('subscriptions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async getSubscriptions(@Query() listQueryDto: ListSubscriptionsQueryDto) {
    return this.adminService.getSubscriptions(listQueryDto);
  }

  @ApiOperation({ summary: 'Get subscription plan by ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Subscription plan returned' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('subscriptions/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async getSubscriptionById(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getSubscriptionById(id);
  }

  @ApiOperation({ summary: 'Create subscription plan (admin)' })
  @ApiResponse({
    status: 201,
    description: 'Subscription plan created successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post('subscriptions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.CREATED)
  async createSubscription(
    @GetUser() admin: any,
    @Body() createSubscriptionDto: CreateSubscriptionDto,
  ) {
    return this.adminService.createSubscription(
      createSubscriptionDto,
      admin.userId,
    );
  }

  @ApiOperation({ summary: 'Update subscription plan (admin)' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Subscription plan updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Put('subscriptions/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async updateSubscription(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() admin: any,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
  ) {
    return this.adminService.updateSubscription(
      id,
      updateSubscriptionDto,
      admin.userId,
    );
  }

  @ApiOperation({ summary: 'Delete subscription plan (admin)' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Subscription plan deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Delete('subscriptions/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async deleteSubscription(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() admin: any,
  ) {
    return this.adminService.deleteSubscription(id, admin.userId);
  }

  // ========== User Subscription Management ==========

  @ApiOperation({ summary: 'List user subscriptions (admin)' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of user subscriptions returned',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('user-subscriptions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async getUserSubscriptions(
    @Query() listQueryDto: ListUserSubscriptionsQueryDto,
  ) {
    return this.adminService.getUserSubscriptions(listQueryDto);
  }

  @ApiOperation({ summary: 'Get user subscription by ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'User subscription returned' })
  @ApiResponse({ status: 404, description: 'User subscription not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('user-subscriptions/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async getUserSubscriptionById(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getUserSubscriptionById(id);
  }

  @ApiOperation({ summary: 'Update user subscription status' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'User subscription status updated' })
  @ApiResponse({ status: 404, description: 'User subscription not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Put('user-subscriptions/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async updateUserSubscriptionStatus(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() admin: any,
    @Body('status') status: SubscriptionStatus,
  ) {
    return this.adminService.updateUserSubscriptionStatus(
      id,
      status,
      admin.userId,
    );
  }

  // ========== Payment Management ==========

  @ApiOperation({ summary: 'List payments (admin)' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of payments returned',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('payments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async getPayments(@Query() listQueryDto: ListPaymentsQueryDto) {
    return this.adminService.getPayments(listQueryDto);
  }

  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Payment returned' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('payments/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async getPaymentById(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getPaymentById(id);
  }

  @ApiOperation({ summary: 'Create payment record (admin)' })
  @ApiResponse({ status: 201, description: 'Payment created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post('payments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.CREATED)
  async createPayment(
    @GetUser() admin: any,
    @Body() createPaymentDto: CreatePaymentDto,
  ) {
    return this.adminService.createPayment(createPaymentDto, admin.userId);
  }

  @ApiOperation({ summary: 'Update payment status (admin)' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Payment status updated' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Put('payments/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async updatePaymentStatus(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() admin: any,
    @Body('status') status: PaymentStatus,
  ) {
    return this.adminService.updatePaymentStatus(id, status, admin.userId);
  }

  // ========== Subscription & Payment Notifications ==========

  @ApiOperation({ summary: 'List subscription and payment notifications' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of notifications returned',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('notifications/subscription-payment')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async getSubscriptionPaymentNotifications(
    @Query() listQueryDto: ListSubscriptionPaymentNotificationsDto,
  ) {
    return this.adminService.getSubscriptionPaymentNotifications(listQueryDto);
  }

  // ========== Bulk Operations ==========

  @ApiOperation({ summary: 'Bulk update users' })
  @ApiResponse({ status: 200, description: 'Users updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Put('users/bulk-update')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async bulkUpdateUsers(
    @GetUser() admin: any,
    @Body() bulkUpdateDto: BulkUpdateDto,
  ) {
    return this.adminService.bulkUpdateUsers(bulkUpdateDto, admin.userId);
  }

  @ApiOperation({ summary: 'Bulk update posts' })
  @ApiResponse({ status: 200, description: 'Posts updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Put('posts/bulk-update')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async bulkUpdatePosts(
    @GetUser() admin: any,
    @Body() bulkUpdateDto: BulkUpdateDto,
  ) {
    return this.adminService.bulkUpdatePosts(bulkUpdateDto, admin.userId);
  }

  @ApiOperation({ summary: 'Bulk update communities' })
  @ApiResponse({ status: 200, description: 'Communities updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Put('communities/bulk-update')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async bulkUpdateCommunities(
    @GetUser() admin: any,
    @Body() bulkUpdateDto: BulkUpdateDto,
  ) {
    return this.adminService.bulkUpdateCommunities(bulkUpdateDto, admin.userId);
  }

  @ApiOperation({ summary: 'Bulk update topics' })
  @ApiResponse({ status: 200, description: 'Topics updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Put('topics/bulk-update')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async bulkUpdateTopics(
    @GetUser() admin: any,
    @Body() bulkUpdateDto: BulkUpdateDto,
  ) {
    return this.adminService.bulkUpdateTopics(bulkUpdateDto, admin.userId);
  }
}
