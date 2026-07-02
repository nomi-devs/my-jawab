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
  UploadedFile,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { GeneralService } from './general.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { TopicResponseDto } from './dto/topic-response.dto';
import { TopicSelectListDto } from './dto/topic-select-list.dto';
import { ListTopicsQueryDto } from './dto/list-topics-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('MA / Topics')
@Controller('ma/topics')
@UseGuards(JwtAuthGuard)
export class GeneralController {
  constructor(private readonly generalService: GeneralService) {}

  // Public endpoints (authenticated users can view)
  @ApiOperation({ summary: 'List all topics' })
  @Get()
  @HttpCode(HttpStatus.OK)
  async getTopics(@Query() listQueryDto: ListTopicsQueryDto): Promise<{
    data: TopicResponseDto[];
    meta: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  }> {
    return this.generalService.getTopics(listQueryDto);
  }

  @ApiOperation({ summary: 'Get active topics' })
  @Get('active')
  @HttpCode(HttpStatus.OK)
  async getActiveTopics(): Promise<TopicResponseDto[]> {
    return this.generalService.getActiveTopics();
  }

  @ApiOperation({ summary: 'Get topics for select list' })
  @Get('select-list')
  @HttpCode(HttpStatus.OK)
  async getTopicsForSelectList(): Promise<TopicSelectListDto[]> {
    return this.generalService.getTopicsForSelectList();
  }

  @ApiOperation({ summary: 'Get topic by slug' })
  @ApiParam({ name: 'slug', type: String })
  @Get('slug/:slug')
  @HttpCode(HttpStatus.OK)
  async getTopicBySlug(@Param('slug') slug: string): Promise<TopicResponseDto> {
    return this.generalService.getTopicBySlug(slug);
  }

  @ApiOperation({ summary: 'Get topic sub-topics' })
  @ApiParam({ name: 'id', type: Number })
  @Get(':id/children')
  @HttpCode(HttpStatus.OK)
  async getTopicChildren(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TopicResponseDto[]> {
    return this.generalService.getTopicChildren(id);
  }

  @ApiOperation({ summary: 'Get topic by ID' })
  @ApiParam({ name: 'id', type: Number })
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getTopicById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TopicResponseDto> {
    return this.generalService.getTopicById(id);
  }

  // Admin-only endpoints
  @ApiOperation({ summary: 'Create topic' })
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        topic_image: { type: 'string', format: 'binary' },
        parent_id: { type: 'integer', example: 0 },
        topic_slug: { type: 'string', example: 'javascript' },
        topic_name: { type: 'string', example: 'JavaScript' },
        topic_description: { type: 'string' },
        is_active: { type: 'string', enum: ['active', 'inactive'] },
      },
    },
  })
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('topic_image', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    }),
  )
  async createTopic(
    @GetUser() user: any,
    @Body() createTopicDto: CreateTopicDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<TopicResponseDto> {
    return this.generalService.createTopic(createTopicDto, user.userId, file);
  }

  @ApiOperation({ summary: 'Update topic' })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({ name: 'id', type: Number })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        topic_image: { type: 'string', format: 'binary' },
        parent_id: { type: 'integer', example: 0 },
        topic_slug: { type: 'string', example: 'javascript' },
        topic_name: { type: 'string', example: 'JavaScript' },
        topic_description: { type: 'string' },
        is_active: { type: 'string', enum: ['active', 'inactive'] },
      },
    },
  })
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('topic_image', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    }),
  )
  async updateTopic(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: any,
    @Body() updateTopicDto: UpdateTopicDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<TopicResponseDto> {
    return this.generalService.updateTopic(
      id,
      updateTopicDto,
      user.userId,
      file,
    );
  }

  @ApiOperation({ summary: 'Delete topic' })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({ name: 'id', type: Number })
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.sub_admin)
  @HttpCode(HttpStatus.OK)
  async deleteTopic(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: any,
  ): Promise<{ message: string }> {
    return this.generalService.deleteTopic(id, user.userId);
  }
}
