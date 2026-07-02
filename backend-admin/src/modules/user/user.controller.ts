import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { FollowUserDto } from './dto/follow-user.dto';
import { SubscribeTopicDto } from './dto/subscribe-topic.dto';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ListPostsQueryDto } from '../post/dto/list-posts-query.dto';
import { ListPollsQueryDto } from '../poll/dto/list-polls-query.dto';
import { ListCommentsQueryDto } from '../comment/dto/list-comments-query.dto';
import { Query } from '@nestjs/common';

@ApiTags('MA / Users')
@ApiBearerAuth('JWT-auth')
@Controller('ma/users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  // Profile Endpoints
  @Post('profile')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FilesInterceptor('files', 2, {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max per file
    }),
  )
  @ApiOperation({
    summary:
      'Create user profile (multipart, up to 2 files: picture & background)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description:
            'Up to 2 files: [0] profile picture, [1] profile background',
        },
        full_name: { type: 'string', maxLength: 255, example: 'John Doe' },
        profile_picture: {
          type: 'string',
          example: 'https://cdn.example.com/pic.jpg',
        },
        profile_background: {
          type: 'string',
          example: 'https://cdn.example.com/bg.jpg',
        },
        tagline: {
          type: 'string',
          maxLength: 255,
          example: 'Software Engineer | Tech Enthusiast',
        },
        profile_bio: {
          type: 'string',
          example: 'A passionate developer from Karachi.',
        },
        profile_gender: {
          type: 'string',
          enum: ['male', 'female', 'other'],
          example: 'male',
        },
        profile_birthday: { type: 'string', example: '1995-06-15' },
        profile_website: {
          type: 'string',
          maxLength: 500,
          example: 'https://johndoe.dev',
        },
        profile_location: {
          type: 'string',
          maxLength: 255,
          example: 'Karachi, Pakistan',
        },
        upload_profile_background: {
          type: 'string',
          example: 'true',
          description:
            'Set to "true" when the single uploaded file is the background',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Profile created successfully',
    type: ProfileResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createProfile(
    @GetUser() user: any,
    @Body() createProfileDto: CreateProfileDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ): Promise<ProfileResponseDto> {
    // Files are sent in order: profile_picture first, then profile_background
    // If only one file is sent, we need to check the body for flags to identify which one it is
    let profilePictureFile: Express.Multer.File | undefined;
    let profileBackgroundFile: Express.Multer.File | undefined;

    if (files && files.length > 0) {
      if (files.length === 1) {
        // Only one file - check body flags to determine which type
        const body = createProfileDto as any;
        if (
          body.upload_profile_background === 'true' ||
          body.upload_profile_background === true
        ) {
          // Only background picture is being uploaded
          profileBackgroundFile = files[0];
        } else {
          // Default: assume it's profile picture (for backward compatibility)
          profilePictureFile = files[0];
        }
      } else if (files.length === 2) {
        // Two files: first is profile_picture, second is profile_background
        profilePictureFile = files[0];
        profileBackgroundFile = files[1];
      }
    }

    return this.userService.createProfile(
      user.userId,
      createProfileDto,
      profilePictureFile,
      profileBackgroundFile,
    );
  }

  @Get('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile retrieved successfully',
    type: ProfileResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@GetUser() user: any): Promise<ProfileResponseDto> {
    return this.userService.getProfile(user.userId);
  }

  @Get('profile/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get profile by user ID' })
  @ApiParam({
    name: 'userId',
    type: Number,
    description: 'Target user ID',
    example: 7,
  })
  @ApiResponse({
    status: 200,
    description: 'Profile retrieved successfully',
    type: ProfileResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfileByUserId(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<ProfileResponseDto> {
    return this.userService.getProfileByUserId(userId);
  }

  @Get('check')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check user account status' })
  @ApiResponse({ status: 200, description: 'User status returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async checkUserStatus(@GetUser() user: any) {
    return this.userService.getUserStatus(user.userId);
  }

  @Put('profile')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FilesInterceptor('files', 2, {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max per file
    }),
  )
  @ApiOperation({ summary: 'Update user profile' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description:
            'Up to 2 files: [0] profile picture, [1] profile background',
        },
        full_name: { type: 'string', maxLength: 255, example: 'John Doe' },
        profile_picture: {
          type: 'string',
          example: 'https://cdn.example.com/pic.jpg',
        },
        profile_background: {
          type: 'string',
          example: 'https://cdn.example.com/bg.jpg',
        },
        tagline: {
          type: 'string',
          maxLength: 255,
          example: 'Software Engineer | Tech Enthusiast',
        },
        profile_bio: {
          type: 'string',
          example: 'A passionate developer from Karachi.',
        },
        profile_gender: {
          type: 'string',
          enum: ['male', 'female', 'other'],
          example: 'male',
        },
        profile_birthday: { type: 'string', example: '1995-06-15' },
        profile_website: {
          type: 'string',
          maxLength: 500,
          example: 'https://johndoe.dev',
        },
        profile_location: {
          type: 'string',
          maxLength: 255,
          example: 'Karachi, Pakistan',
        },
        upload_profile_background: {
          type: 'string',
          example: 'true',
          description:
            'Set to "true" when the single uploaded file is the background',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: ProfileResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(
    @GetUser() user: any,
    @Body() updateProfileDto: UpdateProfileDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ): Promise<ProfileResponseDto> {
    // Files are sent in order: profile_picture first, then profile_background
    // If only one file is sent, we need to check the body for flags to identify which one it is
    // Frontend should send 'upload_profile_picture' or 'upload_profile_background' flags
    let profilePictureFile: Express.Multer.File | undefined;
    let profileBackgroundFile: Express.Multer.File | undefined;

    if (files && files.length > 0) {
      if (files.length === 1) {
        // Only one file - check body flags to determine which type
        const body = updateProfileDto as any;
        if (
          body.upload_profile_background === 'true' ||
          body.upload_profile_background === true
        ) {
          // Only background picture is being uploaded
          profileBackgroundFile = files[0];
        } else {
          // Default: assume it's profile picture (for backward compatibility)
          profilePictureFile = files[0];
        }
      } else if (files.length === 2) {
        // Two files: first is profile_picture, second is profile_background
        profilePictureFile = files[0];
        profileBackgroundFile = files[1];
      }
    }

    return this.userService.updateProfile(
      user.userId,
      updateProfileDto,
      profilePictureFile,
      profileBackgroundFile,
    );
  }

  // Follow/Unfollow Endpoints
  @Post('follow')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Follow a user' })
  @ApiResponse({ status: 200, description: 'User followed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async followUser(
    @GetUser() user: any,
    @Body() followUserDto: FollowUserDto,
  ): Promise<{ message: string }> {
    return this.userService.followUser(user.userId, followUserDto);
  }

  @Delete('follow/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unfollow a user' })
  @ApiParam({
    name: 'userId',
    type: Number,
    description: 'ID of the user to unfollow',
    example: 42,
  })
  @ApiResponse({ status: 200, description: 'User unfollowed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async unfollowUser(
    @GetUser() user: any,
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<{ message: string }> {
    return this.userService.unfollowUser(user.userId, userId);
  }

  @Get('followers')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current user followers' })
  @ApiResponse({ status: 200, description: 'Followers list returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getFollowers(@GetUser() user: any) {
    return this.userService.getFollowers(user.userId);
  }

  @Get('followers/count')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get follower count for the current user' })
  @ApiResponse({
    status: 200,
    description: 'Follower count returned',
    schema: { example: { count: 12 } },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getFollowerCount(@GetUser() user: any) {
    const count = await this.userService.getFollowerCount(user.userId);
    return { count };
  }

  @Get('followers/count/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get follower count for a specific user' })
  @ApiParam({
    name: 'userId',
    type: Number,
    description: 'Target user ID',
    example: 7,
  })
  @ApiResponse({
    status: 200,
    description: 'Follower count returned',
    schema: { example: { count: 12 } },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getFollowerCountByUserId(
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    const count = await this.userService.getFollowerCount(userId);
    return { count };
  }

  @Get('followers/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get followers for a specific user' })
  @ApiParam({
    name: 'userId',
    type: Number,
    description: 'Target user ID',
    example: 7,
  })
  @ApiResponse({ status: 200, description: 'Followers list returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getFollowersByUserId(@Param('userId', ParseIntPipe) userId: number) {
    return this.userService.getFollowers(userId);
  }

  @Get('following')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get users the current user follows' })
  @ApiResponse({ status: 200, description: 'Following list returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getFollowing(@GetUser() user: any) {
    return this.userService.getFollowing(user.userId);
  }

  @Get('following/count')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get following count for the current user' })
  @ApiResponse({
    status: 200,
    description: 'Following count returned',
    schema: { example: { count: 5 } },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getFollowingCount(@GetUser() user: any) {
    const count = await this.userService.getFollowingCount(user.userId);
    return { count };
  }

  @Get('following/count/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get following count for a specific user' })
  @ApiParam({
    name: 'userId',
    type: Number,
    description: 'Target user ID',
    example: 7,
  })
  @ApiResponse({
    status: 200,
    description: 'Following count returned',
    schema: { example: { count: 5 } },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getFollowingCountByUserId(
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    const count = await this.userService.getFollowingCount(userId);
    return { count };
  }

  @Get('following/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get users followed by a specific user' })
  @ApiParam({
    name: 'userId',
    type: Number,
    description: 'Target user ID',
    example: 7,
  })
  @ApiResponse({ status: 200, description: 'Following list returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getFollowingByUserId(@Param('userId', ParseIntPipe) userId: number) {
    return this.userService.getFollowing(userId);
  }

  // Topic Subscription Endpoints
  @Get('topics')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get subscribed topics for the current user' })
  @ApiResponse({ status: 200, description: 'Topics list returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserTopics(@GetUser() user: any) {
    return this.userService.getUserTopics(user.userId);
  }

  @Post('topics/subscribe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Subscribe to topics' })
  @ApiResponse({
    status: 200,
    description: 'Topic subscription result',
    schema: {
      example: {
        message: 'Subscribed successfully',
        subscribed: [1, 3],
        already_subscribed: [5],
        not_found: [],
        failed: [],
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async subscribeTopic(
    @GetUser() user: any,
    @Body() subscribeTopicDto: SubscribeTopicDto,
  ): Promise<{
    message: string;
    subscribed: number[];
    already_subscribed: number[];
    not_found: number[];
    failed: number[];
  }> {
    return this.userService.subscribeTopic(user.userId, subscribeTopicDto);
  }

  @Delete('topics/unsubscribe/:topicId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unsubscribe from a topic' })
  @ApiParam({
    name: 'topicId',
    type: Number,
    description: 'Topic ID to unsubscribe from',
    example: 5,
  })
  @ApiResponse({ status: 200, description: 'Unsubscribed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async unsubscribeTopic(
    @GetUser() user: any,
    @Param('topicId', ParseIntPipe) topicId: number,
  ): Promise<{ message: string }> {
    return this.userService.unsubscribeTopic(user.userId, topicId);
  }

  @Get('topics/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get subscribed topics for a specific user' })
  @ApiParam({
    name: 'userId',
    type: Number,
    description: 'Target user ID',
    example: 7,
  })
  @ApiResponse({ status: 200, description: 'Topics list returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserTopicsByUserId(@Param('userId', ParseIntPipe) userId: number) {
    return this.userService.getUserTopics(userId);
  }

  // Account Management
  @Delete('account')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete current user account' })
  @ApiResponse({ status: 200, description: 'Account deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteMyAccount(@GetUser() user: any): Promise<{ message: string }> {
    return this.userService.deleteMyAccount(user.userId);
  }

  // My Content Endpoints
  @Get('my-posts')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get posts created by the current user' })
  @ApiResponse({ status: 200, description: 'Paginated posts list returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyPosts(
    @GetUser() user: any,
    @Query() listQueryDto: ListPostsQueryDto,
  ): Promise<{
    data: any[];
    meta: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  }> {
    return this.userService.getMyPosts(user.userId, listQueryDto);
  }

  @Get('my-polls')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get polls created by the current user' })
  @ApiResponse({ status: 200, description: 'Paginated polls list returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyPolls(
    @GetUser() user: any,
    @Query() listQueryDto: ListPollsQueryDto,
  ): Promise<{
    data: any[];
    meta: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  }> {
    return this.userService.getMyPolls(user.userId, listQueryDto);
  }

  @Get('my-replies')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get replies (comments) created by the current user',
  })
  @ApiResponse({ status: 200, description: 'Paginated replies list returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyReplies(
    @GetUser() user: any,
    @Query() listQueryDto: ListCommentsQueryDto,
  ): Promise<{
    data: any[];
    meta: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  }> {
    return this.userService.getMyReplies(user.userId, listQueryDto);
  }
}
