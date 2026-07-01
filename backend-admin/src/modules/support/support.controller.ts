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
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { SupportService } from './support.service';
import { CreateSupportDto } from './dto/create-support.dto';
import { UpdateSupportDto } from './dto/update-support.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserRole } from '../auth/entities/user.entity';

@ApiTags('Support')
@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  // ─── Public Endpoint (no auth) ──────────────────────────────

  @ApiOperation({ summary: 'Get active support info' })
  @Get()
  @HttpCode(HttpStatus.OK)
  async getActiveSupport() {
    return this.supportService.findActive();
  }
}

@ApiTags('Support')
@ApiBearerAuth('JWT-auth')
@Controller('admin/support')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
export class AdminSupportController {
  constructor(private readonly supportService: SupportService) {}

  // ─── Admin Endpoints ────────────────────────────────────────

  @ApiOperation({ summary: 'Get support info (admin)' })
  @Get()
  @HttpCode(HttpStatus.OK)
  async getSupport() {
    return this.supportService.findOne();
  }

  @ApiOperation({ summary: 'Create support info' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createSupport(
    @GetUser() admin: any,
    @Body() createDto: CreateSupportDto,
  ) {
    return this.supportService.create(createDto, admin.userId);
  }

  @ApiOperation({ summary: 'Update support info' })
  @ApiParam({ name: 'id', type: Number })
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
