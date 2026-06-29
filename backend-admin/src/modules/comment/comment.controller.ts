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
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentResponseDto } from './dto/comment-response.dto';
import { ListCommentsQueryDto } from './dto/list-comments-query.dto';
import { LikeCommentDto } from './dto/like-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('comments')
@UseGuards(JwtAuthGuard)
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  // Public endpoints (authenticated users can view)
  @Get()
  @HttpCode(HttpStatus.OK)
  async getComments(
    @Query() listQueryDto: ListCommentsQueryDto,
    @GetUser() user: any,
  ): Promise<{
    data: CommentResponseDto[];
    meta: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  }> {
    return this.commentService.getComments(listQueryDto, user.userId);
  }

  @Get('post/:postId')
  @HttpCode(HttpStatus.OK)
  async getCommentsByPost(
    @Param('postId', ParseIntPipe) postId: number,
    @Query() listQueryDto: ListCommentsQueryDto,
    @GetUser() user: any,
  ): Promise<{
    data: CommentResponseDto[];
    meta: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  }> {
    return this.commentService.getCommentsByPost(
      postId,
      listQueryDto,
      user.userId,
    );
  }

  @Get('poll/:pollId')
  @HttpCode(HttpStatus.OK)
  async getCommentsByPoll(
    @Param('pollId', ParseIntPipe) pollId: number,
    @Query() listQueryDto: ListCommentsQueryDto,
    @GetUser() user: any,
  ): Promise<{
    data: CommentResponseDto[];
    meta: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  }> {
    return this.commentService.getCommentsByPoll(
      pollId,
      listQueryDto,
      user.userId,
    );
  }

  @Get('reply/:commentId')
  @HttpCode(HttpStatus.OK)
  async getCommentReplies(
    @Param('commentId', ParseIntPipe) commentId: number,
    @Query() listQueryDto: ListCommentsQueryDto,
    @GetUser() user: any,
  ): Promise<{
    data: CommentResponseDto[];
    meta: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  }> {
    return this.commentService.getCommentReplies(
      commentId,
      listQueryDto,
      user.userId,
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getCommentById(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: any,
  ): Promise<CommentResponseDto> {
    return this.commentService.getCommentById(id, user.userId);
  }

  // Comment management endpoints
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createComment(
    @GetUser() user: any,
    @Body() createCommentDto: CreateCommentDto,
  ): Promise<CommentResponseDto> {
    return this.commentService.createComment(createCommentDto, user.userId);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updateComment(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: any,
    @Body() updateCommentDto: UpdateCommentDto,
  ): Promise<CommentResponseDto> {
    return this.commentService.updateComment(id, updateCommentDto, user.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteComment(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: any,
  ): Promise<{ message: string }> {
    return this.commentService.deleteComment(id, user.userId);
  }

  // Like/Dislike endpoints
  @Post(':id/like')
  @HttpCode(HttpStatus.OK)
  async likeComment(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: any,
    @Body() likeCommentDto: LikeCommentDto,
  ): Promise<{
    message: string;
    like_count: number;
    dislike_count: number;
    like_status: 'like' | 'dislike' | null;
  }> {
    return this.commentService.likeComment(id, likeCommentDto, user.userId);
  }
}

