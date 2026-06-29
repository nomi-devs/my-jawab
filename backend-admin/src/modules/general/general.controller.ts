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
import { UserRole } from '../auth/entities/user.entity';

@Controller('topics')
@UseGuards(JwtAuthGuard)
export class GeneralController {
  constructor(private readonly generalService: GeneralService) {}

  // Public endpoints (authenticated users can view)
  @Get()
  @HttpCode(HttpStatus.OK)
  async getTopics(
    @Query() listQueryDto: ListTopicsQueryDto,
  ): Promise<{
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

  @Get('active')
  @HttpCode(HttpStatus.OK)
  async getActiveTopics(): Promise<TopicResponseDto[]> {
    return this.generalService.getActiveTopics();
  }

  @Get('select-list')
  @HttpCode(HttpStatus.OK)
  async getTopicsForSelectList(): Promise<TopicSelectListDto[]> {
    return this.generalService.getTopicsForSelectList();
  }

  @Get('slug/:slug')
  @HttpCode(HttpStatus.OK)
  async getTopicBySlug(
    @Param('slug') slug: string,
  ): Promise<TopicResponseDto> {
    return this.generalService.getTopicBySlug(slug);
  }

  @Get(':id/children')
  @HttpCode(HttpStatus.OK)
  async getTopicChildren(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TopicResponseDto[]> {
    return this.generalService.getTopicChildren(id);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getTopicById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TopicResponseDto> {
    return this.generalService.getTopicById(id);
  }

  // Admin-only endpoints
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
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

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
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
    return this.generalService.updateTopic(id, updateTopicDto, user.userId, file);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @HttpCode(HttpStatus.OK)
  async deleteTopic(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: any,
  ): Promise<{ message: string }> {
    return this.generalService.deleteTopic(id, user.userId);
  }
}

