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
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { PollService } from './poll.service';
import { CreatePollDto } from './dto/create-poll.dto';
import { UpdatePollDto } from './dto/update-poll.dto';
import { PollResponseDto } from './dto/poll-response.dto';
import { ListPollsQueryDto } from './dto/list-polls-query.dto';
import { VotePollDto } from './dto/vote-poll.dto';
import { LikePollDto } from './dto/like-poll.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { FeatureGuard } from '../entitlements/guards/feature.guard';
import { RequiresFeature } from '../entitlements/decorators/requires-feature.decorator';

@ApiTags('Polls')
@ApiBearerAuth('JWT-auth')
@Controller('polls')
@UseGuards(JwtAuthGuard)
export class PollController {
  constructor(private readonly pollService: PollService) {}

  // Public endpoints (authenticated users can view)
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List polls with pagination and filters' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of polls',
    type: PollResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPolls(
    @Query() listQueryDto: ListPollsQueryDto,
    @GetUser() user: any,
  ): Promise<{
    data: PollResponseDto[];
    meta: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  }> {
    return this.pollService.getPolls(listQueryDto, user.userId);
  }

  @Get('featured')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get featured polls' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of featured polls',
    type: PollResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getFeaturedPolls(
    @Query() listQueryDto: ListPollsQueryDto,
    @GetUser() user: any,
  ): Promise<{
    data: PollResponseDto[];
    meta: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  }> {
    return this.pollService.getFeaturedPolls(listQueryDto, user.userId);
  }

  @Get('slug/:slug')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get poll by slug' })
  @ApiParam({
    name: 'slug',
    description: 'URL-friendly poll identifier',
    example: 'favorite-color-poll',
  })
  @ApiResponse({
    status: 200,
    description: 'Poll found',
    type: PollResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Poll not found' })
  async getPollBySlug(
    @Param('slug') slug: string,
    @GetUser() user: any,
  ): Promise<PollResponseDto> {
    return this.pollService.getPollBySlug(slug, user.userId);
  }

  @Get('my-polls')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get polls created by current user' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of polls created by the authenticated user',
    type: PollResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyPolls(
    @Query() listQueryDto: ListPollsQueryDto,
    @GetUser() user: any,
  ): Promise<{
    data: PollResponseDto[];
    meta: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  }> {
    return this.pollService.getUserPolls(user.userId, listQueryDto);
  }

  @Get('user/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get polls by user ID' })
  @ApiParam({
    name: 'userId',
    description: 'ID of the user whose polls to retrieve',
    example: 7,
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of polls created by the specified user',
    type: PollResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserPolls(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() listQueryDto: ListPollsQueryDto,
    @GetUser() user: any,
  ): Promise<{
    data: PollResponseDto[];
    meta: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  }> {
    return this.pollService.getUserPolls(userId, listQueryDto);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get poll by ID' })
  @ApiParam({ name: 'id', description: 'Poll ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Poll found',
    type: PollResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Poll not found' })
  async getPollById(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: any,
  ): Promise<PollResponseDto> {
    return this.pollService.getPollById(id, user.userId);
  }

  // Poll management endpoints
  @Post()
  @UseGuards(JwtAuthGuard, FeatureGuard)
  @RequiresFeature('can_create_polls')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new poll' })
  @ApiResponse({
    status: 201,
    description: 'Poll created successfully',
    type: PollResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Feature not available for current plan',
  })
  async createPoll(
    @GetUser() user: any,
    @Body() createPollDto: CreatePollDto,
  ): Promise<PollResponseDto> {
    return this.pollService.createPoll(createPollDto, user.userId);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a poll' })
  @ApiParam({ name: 'id', description: 'Poll ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Poll updated successfully',
    type: PollResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — not the poll owner' })
  @ApiResponse({ status: 404, description: 'Poll not found' })
  async updatePoll(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: any,
    @Body() updatePollDto: UpdatePollDto,
  ): Promise<PollResponseDto> {
    return this.pollService.updatePoll(id, updatePollDto, user.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a poll' })
  @ApiParam({ name: 'id', description: 'Poll ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Poll deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — not the poll owner' })
  @ApiResponse({ status: 404, description: 'Poll not found' })
  async deletePoll(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: any,
  ): Promise<{ message: string }> {
    return this.pollService.deletePoll(id, user.userId);
  }

  // Vote endpoint
  @Post(':id/vote')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Vote on a poll option' })
  @ApiParam({ name: 'id', description: 'Poll ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Vote recorded successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid option or poll already ended',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Poll not found' })
  async votePoll(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: any,
    @Body() votePollDto: VotePollDto,
  ): Promise<{
    message: string;
    vote_count: number;
    option_vote_counts: Record<number, number>;
  }> {
    return this.pollService.votePoll(id, votePollDto, user.userId);
  }

  // Like/Dislike endpoints
  @Post(':id/like')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Like or dislike a poll' })
  @ApiParam({ name: 'id', description: 'Poll ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Like/dislike recorded successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Poll not found' })
  async likePoll(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: any,
    @Body() likePollDto: LikePollDto,
  ): Promise<{
    message: string;
    like_count: number;
    dislike_count: number;
    like_status: 'like' | 'dislike' | null;
  }> {
    return this.pollService.likePoll(id, likePollDto, user.userId);
  }
}
