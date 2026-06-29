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
import { PrivacyPolicyService } from './privacy-policy.service';
import { CreatePrivacyPolicyDto } from './dto/create-privacy-policy.dto';
import { UpdatePrivacyPolicyDto } from './dto/update-privacy-policy.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserRole } from '../auth/entities/user.entity';

@Controller('privacy-policy')
export class PrivacyPolicyController {
  constructor(
    private readonly privacyPolicyService: PrivacyPolicyService,
  ) {}

  // ─── Public Endpoints (no auth) ─────────────────────────────

  @Get()
  @HttpCode(HttpStatus.OK)
  async getActivePrivacyPolicy() {
    return this.privacyPolicyService.findActive();
  }
}

@Controller('admin/privacy-policy')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
export class AdminPrivacyPolicyController {
  constructor(
    private readonly privacyPolicyService: PrivacyPolicyService,
  ) {}

  // ─── Admin Endpoints ────────────────────────────────────────

  @Get()
  @HttpCode(HttpStatus.OK)
  async getPrivacyPolicy() {
    return this.privacyPolicyService.findOne();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createPrivacyPolicy(
    @GetUser() admin: any,
    @Body() createDto: CreatePrivacyPolicyDto,
  ) {
    return this.privacyPolicyService.create(createDto, admin.userId);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updatePrivacyPolicy(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() admin: any,
    @Body() updateDto: UpdatePrivacyPolicyDto,
  ) {
    return this.privacyPolicyService.update(id, updateDto, admin.userId);
  }
}
