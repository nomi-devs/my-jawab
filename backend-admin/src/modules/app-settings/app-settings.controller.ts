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
import { AppSettingsService } from './app-settings.service';
import { CreateAppSettingDto } from './dto/create-app-setting.dto';
import { UpdateAppSettingDto } from './dto/update-app-setting.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('admin/app-settings')
export class AppSettingsController {
    constructor(private readonly appSettingsService: AppSettingsService) { }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
    create(@Body() createAppSettingDto: CreateAppSettingDto, @GetUser() user: any) {
        return this.appSettingsService.create(createAppSettingDto, user.userId);
    }

    @Get()
    findAll(@Query('group') group?: string) {
        return this.appSettingsService.findAll(group);
    }

    @Get(':key')
    findByKey(@Param('key') key: string) {
        return this.appSettingsService.findByKey(key);
    }

    @Patch(':key')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
    update(
        @Param('key') key: string,
        @Body() updateAppSettingDto: UpdateAppSettingDto,
        @GetUser() user: any,
    ) {
        return this.appSettingsService.update(key, updateAppSettingDto, user.userId);
    }

    @Delete(':key')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
    remove(@Param('key') key: string) {
        return this.appSettingsService.remove(key);
    }
}
