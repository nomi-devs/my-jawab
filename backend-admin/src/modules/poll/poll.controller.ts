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

@Controller('polls')
@UseGuards(JwtAuthGuard)
export class PollController {
  constructor(private readonly pollService: PollService) {}

  // Public endpoints (authenticated users can view)
  @Get()
  @HttpCode(HttpStatus.OK)
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
  async getPollBySlug(
    @Param('slug') slug: string,
    @GetUser() user: any,
  ): Promise<PollResponseDto> {
    return this.pollService.getPollBySlug(slug, user.userId);
  }

  @Get('my-polls')
  @HttpCode(HttpStatus.OK)
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
  async createPoll(
    @GetUser() user: any,
    @Body() createPollDto: CreatePollDto,
  ): Promise<PollResponseDto> {
    return this.pollService.createPoll(createPollDto, user.userId);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updatePoll(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: any,
    @Body() updatePollDto: UpdatePollDto,
  ): Promise<PollResponseDto> {
    return this.pollService.updatePoll(id, updatePollDto, user.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deletePoll(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: any,
  ): Promise<{ message: string }> {
    return this.pollService.deletePoll(id, user.userId);
  }

  // Vote endpoint
  @Post(':id/vote')
  @HttpCode(HttpStatus.OK)
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

