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
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentResponseDto } from './dto/comment-response.dto';
import { ListCommentsQueryDto } from './dto/list-comments-query.dto';
import { LikeCommentDto } from './dto/like-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@ApiTags('Comments')
@ApiBearerAuth('JWT-auth')
@Controller('comments')
@UseGuards(JwtAuthGuard)
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  // Public endpoints (authenticated users can view)
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all comments' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of comments',
    type: CommentResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiOperation({ summary: 'Get comments for a post' })
  @ApiParam({
    name: 'postId',
    type: Number,
    description: 'Post ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of comments for the post',
    type: CommentResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Post not found' })
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
  @ApiOperation({ summary: 'Get comments for a poll' })
  @ApiParam({
    name: 'pollId',
    type: Number,
    description: 'Poll ID',
    example: 2,
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of comments for the poll',
    type: CommentResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Poll not found' })
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
  @ApiOperation({ summary: 'Get replies to a comment' })
  @ApiParam({
    name: 'commentId',
    type: Number,
    description: 'Parent comment ID',
    example: 5,
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of replies',
    type: CommentResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
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
  @ApiOperation({ summary: 'Get comment by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Comment ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Comment details',
    type: CommentResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async getCommentById(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: any,
  ): Promise<CommentResponseDto> {
    return this.commentService.getCommentById(id, user.userId);
  }

  // Comment management endpoints
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new comment or reply' })
  @ApiResponse({
    status: 201,
    description: 'Comment created successfully',
    type: CommentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createComment(
    @GetUser() user: any,
    @Body() createCommentDto: CreateCommentDto,
  ): Promise<CommentResponseDto> {
    return this.commentService.createComment(createCommentDto, user.userId);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a comment' })
  @ApiParam({ name: 'id', type: Number, description: 'Comment ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Comment updated successfully',
    type: CommentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async updateComment(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: any,
    @Body() updateCommentDto: UpdateCommentDto,
  ): Promise<CommentResponseDto> {
    return this.commentService.updateComment(id, updateCommentDto, user.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiParam({ name: 'id', type: Number, description: 'Comment ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Comment deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async deleteComment(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: any,
  ): Promise<{ message: string }> {
    return this.commentService.deleteComment(id, user.userId);
  }

  // Like/Dislike endpoints
  @Post(':id/like')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Like or dislike a comment' })
  @ApiParam({ name: 'id', type: Number, description: 'Comment ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Like/dislike recorded successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Comment liked successfully' },
        like_count: { type: 'number', example: 5 },
        dislike_count: { type: 'number', example: 1 },
        like_status: {
          type: 'string',
          enum: ['like', 'dislike'],
          nullable: true,
          example: 'like',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
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
