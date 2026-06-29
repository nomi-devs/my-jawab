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
import { CommunityService } from './community.service';
import { CreateCommunityDto } from './dto/create-community.dto';
import { UpdateCommunityDto } from './dto/update-community.dto';
import {
  CommunityResponseDto,
  CommunityTopicResponseDto,
  CommunityMemberResponseDto,
} from './dto/community-response.dto';
import { ListCommunitiesQueryDto } from './dto/list-communities-query.dto';
import { AddTopicToCommunityDto } from './dto/add-topic-to-community.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { FeatureGuard } from '../entitlements/guards/feature.guard';
import { RequiresFeature } from '../entitlements/decorators/requires-feature.decorator';

@Controller('communities')
@UseGuards(JwtAuthGuard)
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  // Public endpoints (authenticated users can view)
  @Get()
  @HttpCode(HttpStatus.OK)
  async getCommunities(
    @Query() listQueryDto: ListCommunitiesQueryDto,
    @GetUser() user: any,
  ): Promise<{
    data: CommunityResponseDto[];
    meta: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  }> {
    return this.communityService.getCommunities(listQueryDto, user.userId);
  }

  @Get('personalized')
  @HttpCode(HttpStatus.OK)
  async getPersonalizedCommunities(
    @Query() listQueryDto: ListCommunitiesQueryDto,
    @GetUser() user: any,
  ): Promise<{
    data: CommunityResponseDto[];
    meta: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  }> {
    return this.communityService.getPersonalizedCommunities(listQueryDto, user.userId);
  }

  @Get('joined')
  @HttpCode(HttpStatus.OK)
  async getJoinedCommunities(
    @Query() listQueryDto: ListCommunitiesQueryDto,
    @GetUser() user: any,
  ): Promise<{
    data: CommunityResponseDto[];
    meta: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  }> {
    return this.communityService.getJoinedCommunities(listQueryDto, user.userId);
  }

  @Get('trending')
  @HttpCode(HttpStatus.OK)
  async getTrendingCommunities(
    @Query() listQueryDto: ListCommunitiesQueryDto,
    @GetUser() user: any,
  ): Promise<{
    data: CommunityResponseDto[];
    meta: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  }> {
    return this.communityService.getTrendingCommunities(listQueryDto, user.userId);
  }

  @Get('slug/:slug')
  @HttpCode(HttpStatus.OK)
  async getCommunityBySlug(
    @Param('slug') slug: string,
    @GetUser() user: any,
  ): Promise<CommunityResponseDto> {
    return this.communityService.getCommunityBySlug(slug, user.userId);
  }

  @Get(':id/members')
  @HttpCode(HttpStatus.OK)
  async getCommunityMembers(
    @Param('id', ParseIntPipe) id: number,
    @Query() listQueryDto: any,
  ): Promise<{
    data: CommunityMemberResponseDto[];
    meta: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  }> {
    return this.communityService.getCommunityMembers(id, listQueryDto);
  }

  @Get(':id/topics')
  @HttpCode(HttpStatus.OK)
  async getCommunityTopics(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CommunityTopicResponseDto[]> {
    return this.communityService.getCommunityTopics(id);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getCommunityById(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: any,
  ): Promise<CommunityResponseDto> {
    return this.communityService.getCommunityById(id, user.userId);
  }

  // Member management endpoints
  @Post(':id/join')
  @HttpCode(HttpStatus.OK)
  async joinCommunity(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: any,
  ): Promise<{ message: string }> {
    return this.communityService.joinCommunity(id, user.userId);
  }

  @Post(':id/leave')
  @HttpCode(HttpStatus.OK)
  async leaveCommunity(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: any,
  ): Promise<{ message: string }> {
    return this.communityService.leaveCommunity(id, user.userId);
  }

  // Admin/Moderator endpoints
  @Post()
  @UseGuards(JwtAuthGuard, FeatureGuard)
  @RequiresFeature('can_create_communities')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('community_image', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    }),
  )
  async createCommunity(
    @GetUser() user: any,
    @Body() createCommunityDto: CreateCommunityDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<CommunityResponseDto> {
    return this.communityService.createCommunity(
      createCommunityDto,
      user.userId,
      file,
    );
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('community_image', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    }),
  )
  async updateCommunity(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: any,
    @Body() updateCommunityDto: UpdateCommunityDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<CommunityResponseDto> {
    return this.communityService.updateCommunity(
      id,
      updateCommunityDto,
      user.userId,
      file,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteCommunity(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: any,
  ): Promise<{ message: string }> {
    return this.communityService.deleteCommunity(id, user.userId);
  }

  @Post(':id/topics')
  @HttpCode(HttpStatus.CREATED)
  async addTopicToCommunity(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: any,
    @Body() addTopicDto: AddTopicToCommunityDto,
  ): Promise<CommunityTopicResponseDto> {
    return this.communityService.addTopicToCommunity(id, addTopicDto, user.userId);
  }

  @Delete(':id/topics/:topicId')
  @HttpCode(HttpStatus.OK)
  async removeTopicFromCommunity(
    @Param('id', ParseIntPipe) id: number,
    @Param('topicId', ParseIntPipe) topicId: number,
    @GetUser() user: any,
  ): Promise<{ message: string }> {
    return this.communityService.removeTopicFromCommunity(id, topicId, user.userId);
  }

  @Put(':id/members/:memberId/role')
  @HttpCode(HttpStatus.OK)
  async updateMemberRole(
    @Param('id', ParseIntPipe) id: number,
    @Param('memberId', ParseIntPipe) memberId: number,
    @GetUser() user: any,
    @Body() updateMemberRoleDto: UpdateMemberRoleDto,
  ): Promise<CommunityMemberResponseDto> {
    return this.communityService.updateMemberRole(
      id,
      memberId,
      updateMemberRoleDto,
      user.userId,
    );
  }
}

