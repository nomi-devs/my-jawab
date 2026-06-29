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

@Controller('users')
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
        if (body.upload_profile_background === 'true' || body.upload_profile_background === true) {
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
  async getProfile(@GetUser() user: any): Promise<ProfileResponseDto> {
    return this.userService.getProfile(user.userId);
  }

  @Get('profile/:userId')
  @HttpCode(HttpStatus.OK)
  async getProfileByUserId(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<ProfileResponseDto> {
    return this.userService.getProfileByUserId(userId);
  }

  @Get('check')
  @HttpCode(HttpStatus.OK)
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
        if (body.upload_profile_background === 'true' || body.upload_profile_background === true) {
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
  async followUser(
    @GetUser() user: any,
    @Body() followUserDto: FollowUserDto,
  ): Promise<{ message: string }> {
    return this.userService.followUser(user.userId, followUserDto);
  }

  @Delete('follow/:userId')
  @HttpCode(HttpStatus.OK)
  async unfollowUser(
    @GetUser() user: any,
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<{ message: string }> {
    return this.userService.unfollowUser(user.userId, userId);
  }

  @Get('followers')
  @HttpCode(HttpStatus.OK)
  async getFollowers(@GetUser() user: any) {
    return this.userService.getFollowers(user.userId);
  }

  @Get('followers/count')
  @HttpCode(HttpStatus.OK)
  async getFollowerCount(@GetUser() user: any) {
    const count = await this.userService.getFollowerCount(user.userId);
    return { count };
  }

  @Get('followers/count/:userId')
  @HttpCode(HttpStatus.OK)
  async getFollowerCountByUserId(
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    const count = await this.userService.getFollowerCount(userId);
    return { count };
  }

  @Get('followers/:userId')
  @HttpCode(HttpStatus.OK)
  async getFollowersByUserId(
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.userService.getFollowers(userId);
  }

  @Get('following')
  @HttpCode(HttpStatus.OK)
  async getFollowing(@GetUser() user: any) {
    return this.userService.getFollowing(user.userId);
  }

  @Get('following/count')
  @HttpCode(HttpStatus.OK)
  async getFollowingCount(@GetUser() user: any) {
    const count = await this.userService.getFollowingCount(user.userId);
    return { count };
  }

  @Get('following/count/:userId')
  @HttpCode(HttpStatus.OK)
  async getFollowingCountByUserId(
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    const count = await this.userService.getFollowingCount(userId);
    return { count };
  }

  @Get('following/:userId')
  @HttpCode(HttpStatus.OK)
  async getFollowingByUserId(
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.userService.getFollowing(userId);
  }

  

  // Topic Subscription Endpoints
  @Get('topics')
  @HttpCode(HttpStatus.OK)
  async getUserTopics(@GetUser() user: any) {
    return this.userService.getUserTopics(user.userId);
  }

  @Post('topics/subscribe')
  @HttpCode(HttpStatus.OK)
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
  async unsubscribeTopic(
    @GetUser() user: any,
    @Param('topicId', ParseIntPipe) topicId: number,
  ): Promise<{ message: string }> {
    return this.userService.unsubscribeTopic(user.userId, topicId);
  }

  @Get('topics/:userId')
  @HttpCode(HttpStatus.OK)
  async getUserTopicsByUserId(
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.userService.getUserTopics(userId);
  }

  // Account Management
  @Delete('account')
  @HttpCode(HttpStatus.OK)
  async deleteMyAccount(
    @GetUser() user: any,
  ): Promise<{ message: string }> {
    return this.userService.deleteMyAccount(user.userId);
  }

  // My Content Endpoints
  @Get('my-posts')
  @HttpCode(HttpStatus.OK)
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

