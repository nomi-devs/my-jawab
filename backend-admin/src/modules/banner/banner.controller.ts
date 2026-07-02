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
import { BannerService } from './banner.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { ListBannersQueryDto } from './dto/list-banners-query.dto';
import { GetBannersQueryDto } from './dto/get-banners-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserRole } from '@prisma/client';

/**
 * Public/User endpoint — returns banners targeted to the current user.
 */
@ApiTags('MA / Banners')
@Controller('ma/banners')
@UseGuards(JwtAuthGuard)
export class BannerController {
  constructor(private readonly bannerService: BannerService) {}

  @ApiOperation({ summary: 'Get banners for current user' })
  @ApiBearerAuth('JWT-auth')
  @Get()
  @HttpCode(HttpStatus.OK)
  async getBanners(@Query() query: GetBannersQueryDto, @GetUser() user: any) {
    return this.bannerService.getForUser(user.userId, query);
  }
}

/**
 * Admin endpoints — CRUD banners.
 */
@ApiTags('Banners')
@ApiBearerAuth('JWT-auth')
@Controller('admin/banners')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.admin, UserRole.sub_admin)
export class AdminBannerController {
  constructor(private readonly bannerService: BannerService) {}

  @ApiOperation({ summary: 'List all banners (admin)' })
  @Get()
  @HttpCode(HttpStatus.OK)
  async list(@Query() query: ListBannersQueryDto) {
    return this.bannerService.list(query);
  }

  @ApiOperation({ summary: 'Get banner by ID' })
  @ApiParam({ name: 'id', type: Number })
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findById(@Param('id', ParseIntPipe) id: number) {
    return this.bannerService.findById(id);
  }

  @ApiOperation({ summary: 'Create banner' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        banner_image: { type: 'string', format: 'binary' },
        banner_title: { type: 'string', example: 'Summer Sale' },
        banner_description: { type: 'string' },
        banner_link: { type: 'string', example: 'https://example.com' },
        banner_type: {
          type: 'string',
          enum: ['promotion', 'ad', 'announcement'],
        },
        target_countries: { type: 'string', example: 'PK,US' },
        target_topic_ids: { type: 'string', example: '1,2,3' },
        target_subscription_ids: { type: 'string' },
        excluded_countries: { type: 'string' },
        excluded_topic_ids: { type: 'string' },
        excluded_subscription_ids: { type: 'string' },
        valid_from: { type: 'string', example: '2025-01-01' },
        valid_until: { type: 'string', example: '2025-12-31' },
        display_order: { type: 'integer', example: 1 },
        is_active: { type: 'string', enum: ['active', 'inactive'] },
      },
    },
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('banner_image', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
  )
  async create(
    @GetUser() admin: any,
    @Body() createDto: CreateBannerDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.bannerService.create(createDto, admin.userId, file);
  }

  @ApiOperation({ summary: 'Update banner' })
  @ApiParam({ name: 'id', type: Number })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        banner_image: { type: 'string', format: 'binary' },
        banner_title: { type: 'string', example: 'Summer Sale' },
        banner_description: { type: 'string' },
        banner_link: { type: 'string', example: 'https://example.com' },
        banner_type: {
          type: 'string',
          enum: ['promotion', 'ad', 'announcement'],
        },
        target_countries: { type: 'string', example: 'PK,US' },
        target_topic_ids: { type: 'string', example: '1,2,3' },
        target_subscription_ids: { type: 'string' },
        excluded_countries: { type: 'string' },
        excluded_topic_ids: { type: 'string' },
        excluded_subscription_ids: { type: 'string' },
        valid_from: { type: 'string', example: '2025-01-01' },
        valid_until: { type: 'string', example: '2025-12-31' },
        display_order: { type: 'integer', example: 1 },
        is_active: { type: 'string', enum: ['active', 'inactive'] },
      },
    },
  })
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('banner_image', {
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async update(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() admin: any,
    @Body() updateDto: UpdateBannerDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.bannerService.update(id, updateDto, admin.userId, file);
  }

  @ApiOperation({ summary: 'Delete banner' })
  @ApiParam({ name: 'id', type: Number })
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.bannerService.delete(id);
  }
}
