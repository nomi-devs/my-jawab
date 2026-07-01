import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AppSettingsService } from './app-settings.service';
import { CreateAppSettingDto } from './dto/create-app-setting.dto';
import { UpdateAppSettingDto } from './dto/update-app-setting.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { GetUser } from '../auth/decorators/get-user.decorator';

@ApiTags('App Settings')
@ApiBearerAuth('JWT-auth')
@Controller('admin/app-settings')
export class AppSettingsController {
  constructor(private readonly appSettingsService: AppSettingsService) {}

  @ApiOperation({ summary: 'Create app setting' })
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  create(
    @Body() createAppSettingDto: CreateAppSettingDto,
    @GetUser() user: any,
  ) {
    return this.appSettingsService.create(createAppSettingDto, user.userId);
  }

  @ApiOperation({ summary: 'Get all settings' })
  @ApiQuery({ name: 'group', required: false, type: String })
  @Get()
  findAll(@Query('group') group?: string) {
    return this.appSettingsService.findAll(group);
  }

  @ApiOperation({ summary: 'Get setting by key' })
  @ApiParam({ name: 'key', type: String })
  @Get(':key')
  findByKey(@Param('key') key: string) {
    return this.appSettingsService.findByKey(key);
  }

  @ApiOperation({ summary: 'Update setting' })
  @ApiParam({ name: 'key', type: String })
  @Patch(':key')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  update(
    @Param('key') key: string,
    @Body() updateAppSettingDto: UpdateAppSettingDto,
    @GetUser() user: any,
  ) {
    return this.appSettingsService.update(
      key,
      updateAppSettingDto,
      user.userId,
    );
  }

  @ApiOperation({ summary: 'Delete setting' })
  @ApiParam({ name: 'key', type: String })
  @Delete(':key')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  remove(@Param('key') key: string) {
    return this.appSettingsService.remove(key);
  }
}
