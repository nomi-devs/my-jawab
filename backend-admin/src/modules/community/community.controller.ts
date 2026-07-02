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
  ApiResponse,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
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
import { UserRole } from '@prisma/client';
import { FeatureGuard } from '../entitlements/guards/feature.guard';
import { RequiresFeature } from '../entitlements/decorators/requires-feature.decorator';

@ApiTags('MA / Communities')
@ApiBearerAuth('JWT-auth')
@Controller('ma/communities')
@UseGuards(JwtAuthGuard)
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  // Public endpoints (authenticated users can view)
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List communities with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of communities',
    type: CommunityResponseDto,
  })
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
  @ApiOperation({ summary: 'Get personalized communities for current user' })
  @ApiResponse({
    status: 200,
    description: 'Returns personalized communities based on user interests',
    type: CommunityResponseDto,
  })
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
    return this.communityService.getPersonalizedCommunities(
      listQueryDto,
      user.userId,
    );
  }

  @Get('joined')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get communities the current user has joined' })
  @ApiResponse({
    status: 200,
    description: 'Returns communities the current user is a member of',
    type: CommunityResponseDto,
  })
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
    return this.communityService.getJoinedCommunities(
      listQueryDto,
      user.userId,
    );
  }

  @Get('trending')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get trending communities' })
  @ApiResponse({
    status: 200,
    description: 'Returns trending communities ordered by member activity',
    type: CommunityResponseDto,
  })
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
    return this.communityService.getTrendingCommunities(
      listQueryDto,
      user.userId,
    );
  }

  @Get('slug/:slug')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get community by slug' })
  @ApiParam({
    name: 'slug',
    type: 'string',
    description: 'Community slug',
    example: 'tech-lovers',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the community matching the slug',
    type: CommunityResponseDto,
  })
  async getCommunityBySlug(
    @Param('slug') slug: string,
    @GetUser() user: any,
  ): Promise<CommunityResponseDto> {
    return this.communityService.getCommunityBySlug(slug, user.userId);
  }

  @Get(':id/members')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get community members' })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Community ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of community members',
    type: CommunityMemberResponseDto,
  })
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
  @ApiOperation({ summary: 'Get community topics' })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Community ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Returns list of topics associated with the community',
    type: CommunityTopicResponseDto,
  })
  async getCommunityTopics(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CommunityTopicResponseDto[]> {
    return this.communityService.getCommunityTopics(id);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get community by ID' })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Community ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the community with the given ID',
    type: CommunityResponseDto,
  })
  async getCommunityById(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: any,
  ): Promise<CommunityResponseDto> {
    return this.communityService.getCommunityById(id, user.userId);
  }

  // Member management endpoints
  @Post(':id/join')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Join a community' })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Community ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully joined the community',
  })
  async joinCommunity(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: any,
  ): Promise<{ message: string }> {
    return this.communityService.joinCommunity(id, user.userId);
  }

  @Post(':id/leave')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Leave a community' })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Community ID',
    example: 1,
  })
  @ApiResponse({ status: 200, description: 'Successfully left the community' })
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
  @ApiOperation({ summary: 'Create a new community (multipart/form-data)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['community_slug', 'community_name'],
      properties: {
        community_slug: {
          type: 'string',
          maxLength: 255,
          example: 'tech-lovers',
        },
        community_name: {
          type: 'string',
          maxLength: 255,
          example: 'Tech Lovers',
        },
        community_description: {
          type: 'string',
          example: 'A community for tech enthusiasts',
        },
        community_image: {
          type: 'string',
          format: 'binary',
          description: 'Community image file',
        },
        is_active: { type: 'boolean', example: true },
        topic_ids: {
          type: 'array',
          items: { type: 'number' },
          example: [1, 3],
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Community created successfully',
    type: CommunityResponseDto,
  })
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
  @ApiOperation({ summary: 'Update community details' })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Community ID',
    example: 1,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        community_slug: {
          type: 'string',
          maxLength: 255,
          example: 'tech-lovers',
        },
        community_name: {
          type: 'string',
          maxLength: 255,
          example: 'Tech Lovers',
        },
        community_description: {
          type: 'string',
          example: 'A community for tech enthusiasts',
        },
        community_image: {
          type: 'string',
          format: 'binary',
          description: 'Community image file',
        },
        is_active: { type: 'boolean', example: true },
        active: {
          type: 'boolean',
          description: 'Alias for is_active',
          example: true,
        },
        topic_ids: {
          type: 'array',
          items: { type: 'number' },
          example: [1, 3],
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Community updated successfully',
    type: CommunityResponseDto,
  })
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
  @ApiOperation({ summary: 'Delete community' })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Community ID',
    example: 1,
  })
  @ApiResponse({ status: 200, description: 'Community deleted successfully' })
  async deleteCommunity(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: any,
  ): Promise<{ message: string }> {
    return this.communityService.deleteCommunity(id, user.userId);
  }

  @Post(':id/topics')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add topic to community' })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Community ID',
    example: 1,
  })
  @ApiResponse({
    status: 201,
    description: 'Topic added to community successfully',
    type: CommunityTopicResponseDto,
  })
  async addTopicToCommunity(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: any,
    @Body() addTopicDto: AddTopicToCommunityDto,
  ): Promise<CommunityTopicResponseDto> {
    return this.communityService.addTopicToCommunity(
      id,
      addTopicDto,
      user.userId,
    );
  }

  @Delete(':id/topics/:topicId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove topic from community' })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Community ID',
    example: 1,
  })
  @ApiParam({
    name: 'topicId',
    type: 'number',
    description: 'Topic ID to remove',
    example: 5,
  })
  @ApiResponse({
    status: 200,
    description: 'Topic removed from community successfully',
  })
  async removeTopicFromCommunity(
    @Param('id', ParseIntPipe) id: number,
    @Param('topicId', ParseIntPipe) topicId: number,
    @GetUser() user: any,
  ): Promise<{ message: string }> {
    return this.communityService.removeTopicFromCommunity(
      id,
      topicId,
      user.userId,
    );
  }

  @Put(':id/members/:memberId/role')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a member role' })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Community ID',
    example: 1,
  })
  @ApiParam({
    name: 'memberId',
    type: 'number',
    description: 'Member user ID',
    example: 42,
  })
  @ApiResponse({
    status: 200,
    description: 'Member role updated successfully',
    type: CommunityMemberResponseDto,
  })
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
