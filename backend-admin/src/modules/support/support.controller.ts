import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { SupportService } from './support.service';
import { CreateSupportDto } from './dto/create-support.dto';
import { UpdateSupportDto } from './dto/update-support.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserRole } from '../auth/entities/user.entity';

@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  // ─── Public Endpoint (no auth) ──────────────────────────────

  @Get()
  @HttpCode(HttpStatus.OK)
  async getActiveSupport() {
    return this.supportService.findActive();
  }
}

@Controller('admin/support')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
export class AdminSupportController {
  constructor(private readonly supportService: SupportService) {}

  // ─── Admin Endpoints ────────────────────────────────────────

  @Get()
  @HttpCode(HttpStatus.OK)
  async getSupport() {
    return this.supportService.findOne();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createSupport(
    @GetUser() admin: any,
    @Body() createDto: CreateSupportDto,
  ) {
    return this.supportService.create(createDto, admin.userId);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updateSupport(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() admin: any,
    @Body() updateDto: UpdateSupportDto,
  ) {
    return this.supportService.update(id, updateDto, admin.userId);
  }
}
