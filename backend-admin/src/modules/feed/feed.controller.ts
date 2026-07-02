import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { FeedService } from './feed.service';
import { GetFeedQueryDto } from './dto/get-feed-query.dto';
import { FeedResponseDto } from './dto/feed-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@ApiTags('MA / Feed')
@ApiBearerAuth('JWT-auth')
@Controller('ma/feed')
@UseGuards(JwtAuthGuard)
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  /**
   * Get feed (auto-routes to personalized/topic/community/user/trending).
   * Banners are automatically injected after every 10 posts.
   */
  @ApiOperation({ summary: 'Get auto-routed feed' })
  @ApiQuery({ name: 'country', required: false, type: String })
  @Get()
  @HttpCode(HttpStatus.OK)
  async getFeed(
    @GetUser('userId') userId: number,
    @Query() query: GetFeedQueryDto,
    @Query('country') country?: string,
  ): Promise<FeedResponseDto> {
    const response = await this.feedService.getFeed(userId, query);
    return this.feedService.injectBannersIntoFeed(response, userId, country);
  }

  /**
   * Get personalized feed (from followed users, subscribed topics, joined communities)
   */
  @ApiOperation({ summary: 'Get personalized feed' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'country', required: false, type: String })
  @Get('personalized')
  @HttpCode(HttpStatus.OK)
  async getPersonalizedFeed(
    @GetUser('userId') userId: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('country') country?: string,
  ): Promise<FeedResponseDto> {
    const response = await this.feedService.getPersonalizedFeed(
      userId,
      page || 1,
      limit || 20,
    );
    return this.feedService.injectBannersIntoFeed(response, userId, country);
  }

  /**
   * Get topic feed
   */
  @ApiOperation({ summary: 'Get topic feed' })
  @ApiQuery({ name: 'topic_id', required: true, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'country', required: false, type: String })
  @Get('topic')
  @HttpCode(HttpStatus.OK)
  async getTopicFeed(
    @GetUser('userId') userId: number,
    @Query('topic_id') topicId: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('country') country?: string,
  ): Promise<FeedResponseDto> {
    const response = await this.feedService.getTopicFeed(
      userId,
      topicId,
      page || 1,
      limit || 20,
    );
    return this.feedService.injectBannersIntoFeed(response, userId, country);
  }

  /**
   * Get community feed
   */
  @ApiOperation({ summary: 'Get community feed' })
  @ApiQuery({ name: 'community_id', required: true, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'country', required: false, type: String })
  @Get('community')
  @HttpCode(HttpStatus.OK)
  async getCommunityFeed(
    @GetUser('userId') userId: number,
    @Query('community_id') communityId: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('country') country?: string,
  ): Promise<FeedResponseDto> {
    const response = await this.feedService.getCommunityFeed(
      userId,
      communityId,
      page || 1,
      limit || 20,
    );
    return this.feedService.injectBannersIntoFeed(response, userId, country);
  }

  /**
   * Get user feed
   */
  @ApiOperation({ summary: 'Get user feed' })
  @ApiQuery({ name: 'user_id', required: true, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'country', required: false, type: String })
  @Get('user')
  @HttpCode(HttpStatus.OK)
  async getUserFeed(
    @GetUser('userId') userId: number,
    @Query('user_id') targetUserId: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('country') country?: string,
  ): Promise<FeedResponseDto> {
    const response = await this.feedService.getUserFeed(
      userId,
      targetUserId,
      page || 1,
      limit || 20,
    );
    return this.feedService.injectBannersIntoFeed(response, userId, country);
  }

  /**
   * Get trending feed
   */
  @ApiOperation({ summary: 'Get trending feed' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'country', required: false, type: String })
  @Get('trending')
  @HttpCode(HttpStatus.OK)
  async getTrendingFeed(
    @GetUser('userId') userId: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('country') country?: string,
  ): Promise<FeedResponseDto> {
    const response = await this.feedService.getTrendingFeed(
      userId,
      page || 1,
      limit || 20,
    );
    return this.feedService.injectBannersIntoFeed(response, userId, country);
  }

  /**
   * Get polls-only feed
   */
  @ApiOperation({ summary: 'Get polls feed' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'country', required: false, type: String })
  @Get('polls')
  @HttpCode(HttpStatus.OK)
  async getPollsFeed(
    @GetUser('userId') userId: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('country') country?: string,
  ): Promise<FeedResponseDto> {
    const response = await this.feedService.getPollsFeed(
      userId,
      page || 1,
      limit || 20,
    );
    return this.feedService.injectBannersIntoFeed(response, userId, country);
  }

  /**
   * Get posts-only feed
   */
  @ApiOperation({ summary: 'Get posts feed' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'country', required: false, type: String })
  @Get('posts')
  @HttpCode(HttpStatus.OK)
  async getPostsFeed(
    @GetUser('userId') userId: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('country') country?: string,
  ): Promise<FeedResponseDto> {
    const response = await this.feedService.getPostsFeed(
      userId,
      page || 1,
      limit || 20,
    );
    return this.feedService.injectBannersIntoFeed(response, userId, country);
  }
}
