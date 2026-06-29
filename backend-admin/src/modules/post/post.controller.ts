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
  UseInterceptors,
  UploadedFiles,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostResponseDto } from './dto/post-response.dto';
import { ListPostsQueryDto } from './dto/list-posts-query.dto';
import { LikePostDto } from './dto/like-post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostController {
  constructor(private readonly postService: PostService) {}

  // Public endpoints (authenticated users can view)
  @Get()
  @HttpCode(HttpStatus.OK)
  async getPosts(
    @Query() listQueryDto: ListPostsQueryDto,
    @GetUser() user: any,
  ): Promise<{
    data: PostResponseDto[];
    meta: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  }> {
    return this.postService.getPosts(listQueryDto, user.userId);
  }

  @Get('featured')
  @HttpCode(HttpStatus.OK)
  async getFeaturedPosts(
    @Query() listQueryDto: ListPostsQueryDto,
    @GetUser() user: any,
  ): Promise<{
    data: PostResponseDto[];
    meta: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  }> {
    return this.postService.getFeaturedPosts(listQueryDto, user.userId);
  }

  @Get('slug/:slug')
  @HttpCode(HttpStatus.OK)
  async getPostBySlug(
    @Param('slug') slug: string,
    @GetUser() user: any,
  ): Promise<PostResponseDto> {
    return this.postService.getPostBySlug(slug, user.userId);
  }

  @Get('my-posts')
  @HttpCode(HttpStatus.OK)
  async getMyPosts(
    @Query() listQueryDto: ListPostsQueryDto,
    @GetUser() user: any,
  ): Promise<{
    data: PostResponseDto[];
    meta: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  }> {
    return this.postService.getUserPosts(user.userId, listQueryDto);
  }

  @Get('user/:userId')
  @HttpCode(HttpStatus.OK)
  async getUserPosts(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() listQueryDto: ListPostsQueryDto,
    @GetUser() user: any,
  ): Promise<{
    data: PostResponseDto[];
    meta: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  }> {
    return this.postService.getUserPosts(userId, listQueryDto);
  }

  @Get('topic/:topicId')
  @HttpCode(HttpStatus.OK)
  async getPostsByTopic(
    @Param('topicId', ParseIntPipe) topicId: number,
    @Query() listQueryDto: ListPostsQueryDto,
    @GetUser() user: any,
  ): Promise<{
    data: PostResponseDto[];
    meta: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  }> {
    return this.postService.getPostsByTopic(topicId, listQueryDto, user.userId);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getPostById(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: any,
  ): Promise<PostResponseDto> {
    return this.postService.getPostById(id, user.userId);
  }

  // Post management endpoints
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FilesInterceptor('files', 3, {
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max per file
    }),
  )
  async createPost(
    @GetUser() user: any,
    @Body() createPostDto: CreatePostDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ): Promise<PostResponseDto> {
    return this.postService.createPost(createPostDto, user.userId, files);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FilesInterceptor('files', 3, {
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max per file
    }),
  )
  async updatePost(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: any,
    @Body() updatePostDto: UpdatePostDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ): Promise<PostResponseDto> {
    return this.postService.updatePost(id, updatePostDto, user.userId, files);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deletePost(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: any,
  ): Promise<{ message: string }> {
    return this.postService.deletePost(id, user.userId);
  }

  // Like/Dislike endpoints
  @Post(':id/like')
  @HttpCode(HttpStatus.OK)
  async likePost(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: any,
    @Body() likePostDto: LikePostDto,
  ): Promise<{
    message: string;
    like_count: number;
    dislike_count: number;
    like_status: 'like' | 'dislike' | null;
  }> {
    return this.postService.likePost(id, likePostDto, user.userId);
  }
}

