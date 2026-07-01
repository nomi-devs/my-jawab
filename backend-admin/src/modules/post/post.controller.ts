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
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostResponseDto } from './dto/post-response.dto';
import { ListPostsQueryDto } from './dto/list-posts-query.dto';
import { LikePostDto } from './dto/like-post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@ApiTags('Posts')
@ApiBearerAuth('JWT-auth')
@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostController {
  constructor(private readonly postService: PostService) {}

  // Public endpoints (authenticated users can view)
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List posts with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of posts',
    type: PostResponseDto,
    isArray: true,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiOperation({ summary: 'List featured posts' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of featured posts',
    type: PostResponseDto,
    isArray: true,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiOperation({ summary: 'Get post by slug' })
  @ApiParam({ name: 'slug', type: String, example: 'my-first-post' })
  @ApiResponse({
    status: 200,
    description: 'Returns the post matching the given slug',
    type: PostResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async getPostBySlug(
    @Param('slug') slug: string,
    @GetUser() user: any,
  ): Promise<PostResponseDto> {
    return this.postService.getPostBySlug(slug, user.userId);
  }

  @Get('my-posts')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current user posts' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of posts for the authenticated user',
    type: PostResponseDto,
    isArray: true,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiOperation({ summary: 'Get posts by user ID' })
  @ApiParam({ name: 'userId', type: Number, example: 42 })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of posts for the specified user',
    type: PostResponseDto,
    isArray: true,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiOperation({ summary: 'Get posts by topic ID' })
  @ApiParam({ name: 'topicId', type: Number, example: 3 })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of posts for the specified topic',
    type: PostResponseDto,
    isArray: true,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiOperation({ summary: 'Get post by ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Returns the post with the given ID',
    type: PostResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async getPostById(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: any,
  ): Promise<PostResponseDto> {
    return this.postService.getPostById(id, user.userId);
  }

  // Post management endpoints
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new post (multipart/form-data, up to 3 files)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Up to 3 files (image, video, or audio)',
        },
        community_ids: {
          type: 'array',
          items: { type: 'number' },
          example: [1, 2],
        },
        post_slug: { type: 'string', maxLength: 255, example: 'my-first-post' },
        post_title: {
          type: 'string',
          maxLength: 255,
          example: 'My First Post',
        },
        post_content: {
          type: 'string',
          example: 'This is the post body content.',
        },
        post_image: {
          type: 'string',
          example: 'https://example.com/image.jpg',
        },
        post_video: {
          type: 'string',
          example: 'https://example.com/video.mp4',
        },
        post_audio: {
          type: 'string',
          example: 'https://example.com/audio.mp3',
        },
        post_link: { type: 'string', example: 'https://example.com/article' },
        post_status: {
          type: 'string',
          enum: ['draft', 'published', 'archived'],
          example: 'published',
        },
        post_type: {
          type: 'string',
          enum: ['post', 'question'],
          example: 'post',
        },
        post_topic_id: { type: 'number', example: 5 },
        post_tags: {
          type: 'array',
          items: { type: 'string' },
          example: ['news', 'tech'],
        },
        is_featured: {
          type: 'string',
          enum: ['featured', 'not_featured'],
          example: 'not_featured',
        },
      },
      required: ['post_slug', 'post_title', 'post_content'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Post created successfully',
    type: PostResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiOperation({ summary: 'Update a post' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Up to 3 files (image or audio)',
        },
        community_ids: {
          type: 'array',
          items: { type: 'number' },
          example: [1, 2],
        },
        post_slug: { type: 'string', maxLength: 255, example: 'my-first-post' },
        post_title: {
          type: 'string',
          maxLength: 255,
          example: 'My First Post',
        },
        post_content: {
          type: 'string',
          example: 'This is the post body content.',
        },
        post_image: {
          type: 'string',
          example: 'https://example.com/image.jpg',
        },
        post_video: {
          type: 'string',
          example: 'https://example.com/video.mp4',
        },
        post_audio: {
          type: 'string',
          example: 'https://example.com/audio.mp3',
        },
        post_link: { type: 'string', example: 'https://example.com/article' },
        post_status: {
          type: 'string',
          enum: ['draft', 'published', 'archived'],
          example: 'published',
        },
        post_type: {
          type: 'string',
          enum: ['post', 'question'],
          example: 'post',
        },
        post_topic_id: { type: 'number', example: 5 },
        post_tags: {
          type: 'array',
          items: { type: 'string' },
          example: ['news', 'tech'],
        },
        is_featured: {
          type: 'string',
          enum: ['featured', 'not_featured'],
          example: 'not_featured',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Post updated successfully',
    type: PostResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Post not found' })
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
  @ApiOperation({ summary: 'Delete a post' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Post deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async deletePost(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: any,
  ): Promise<{ message: string }> {
    return this.postService.deletePost(id, user.userId);
  }

  // Like/Dislike endpoints
  @Post(':id/like')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Like or dislike a post' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Like/dislike toggled successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Post not found' })
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
