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
import { BannerService } from './banner.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { ListBannersQueryDto } from './dto/list-banners-query.dto';
import { GetBannersQueryDto } from './dto/get-banners-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserRole } from '../auth/entities/user.entity';

/**
 * Public/User endpoint — returns banners targeted to the current user.
 */
@Controller('banners')
@UseGuards(JwtAuthGuard)
export class BannerController {
  constructor(private readonly bannerService: BannerService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getBanners(
    @Query() query: GetBannersQueryDto,
    @GetUser() user: any,
  ) {
    return this.bannerService.getForUser(user.userId, query);
  }
}

/**
 * Admin endpoints — CRUD banners.
 */
@Controller('admin/banners')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
export class AdminBannerController {
  constructor(private readonly bannerService: BannerService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async list(@Query() query: ListBannersQueryDto) {
    return this.bannerService.list(query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findById(@Param('id', ParseIntPipe) id: number) {
    return this.bannerService.findById(id);
  }

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

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.bannerService.delete(id);
  }
}
