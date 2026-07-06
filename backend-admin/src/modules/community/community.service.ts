import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
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
import { MediaClientService } from '../shared/services/media-client.service';

@Injectable()
export class CommunityService {
  private readonly logger = new Logger(CommunityService.name);

  // Helper: Generate a short hash from ID for slug uniqueness
  private generateIdHash(id: number): string {
    const hash = createHash('md5').update(id.toString()).digest('hex');
    // Use first 8 characters of hash for shorter slug
    return hash.substring(0, 8);
  }

  // Helper: Generate slug with ID hash
  private generateSlugWithHash(baseSlug: string, id: number): string {
    const hash = this.generateIdHash(id);
    // Remove any existing hash at the end (in case of updates)
    const cleanSlug = baseSlug.replace(/-[a-f0-9]{8}$/i, '');
    return `${cleanSlug}-${hash}`;
  }

  constructor(
    private prisma: PrismaService,
    private mediaClientService: MediaClientService,
  ) {}

  // Create Community
  async createCommunity(
    createCommunityDto: CreateCommunityDto,
    userId: number,
    file?: Express.Multer.File,
  ): Promise<CommunityResponseDto> {
    // Note: Slug uniqueness check removed - slugs will include ID hash to ensure uniqueness

    let communityImage = createCommunityDto.community_image;

    // Upload community image if provided
    if (file) {
      try {
        const mediaResponse = await this.mediaClientService.uploadFile(file, {
          folder: 'communities',
          userId,
          optimize: true,
          is_public: true,
        });
        communityImage = this.mediaClientService.buildFileUrl(
          mediaResponse.file_path,
        );
      } catch (error:any) {
        this.logger.error(`Failed to upload community image: ${error.message}`);
        throw new BadRequestException('Failed to upload community image');
      }
    }

    // Helper function to transform is_active value
    const transformIsActive = (value: any): boolean => {
      if (value === undefined || value === null || value === '') return true; // Default to true
      if (typeof value === 'boolean') return value;
      const stringValue = String(value).toLowerCase().trim();
      if (
        stringValue === 'active' ||
        stringValue === 'true' ||
        stringValue === '1'
      )
        return true;
      if (
        stringValue === 'inactive' ||
        stringValue === 'false' ||
        stringValue === '0'
      )
        return false;
      if (value === 1 || value === '1') return true;
      if (value === 0 || value === '0') return false;
      return true; // Default to true if unrecognized
    };

    // Debug logging
    console.log('=== CREATE COMMUNITY DEBUG ===');
    console.log(
      'createCommunityDto:',
      JSON.stringify(createCommunityDto, null, 2),
    );
    console.log('is_active value:', createCommunityDto.is_active);
    console.log('is_active type:', typeof createCommunityDto.is_active);

    // Exclude topic_ids from community creation (handled separately)
    const { topic_ids, ...communityData } = createCommunityDto;
    const transformedIsActive = transformIsActive(createCommunityDto.is_active);
    console.log('Transformed is_active:', transformedIsActive);

    // Save to get the ID (with initial slug; will be updated with hash)
    const savedCommunity = await this.prisma.community.create({
      data: {
        ...communityData,
        community_image: communityImage,
        is_active: transformedIsActive,
        created_by: userId,
      },
    });

    // Generate slug with ID hash and update
    const finalSlug = this.generateSlugWithHash(
      createCommunityDto.community_slug,
      savedCommunity.id,
    );
    const finalCommunity = await this.prisma.community.update({
      where: { id: savedCommunity.id },
      data: { community_slug: finalSlug },
    });

    // Add creator as admin member
    await this.prisma.communityUser.create({
      data: {
        community_id: finalCommunity.id,
        user_id: userId,
        role: 'admin',
        is_active: true,
        created_by: userId,
      },
    });

    // Add topics if provided
    if (
      createCommunityDto.topic_ids &&
      createCommunityDto.topic_ids.length > 0
    ) {
      // Validate all topics exist and are active
      const topics = await this.prisma.topic.findMany({
        where: { id: { in: createCommunityDto.topic_ids }, is_active: true },
        select: { id: true },
      });

      if (topics.length !== createCommunityDto.topic_ids.length) {
        throw new BadRequestException(
          'One or more topics not found or inactive',
        );
      }

      // Create community-topic associations
      await this.prisma.communityTopic.createMany({
        data: createCommunityDto.topic_ids.map((topicId) => ({
          community_id: finalCommunity.id,
          topic_id: topicId,
          is_active: true,
          created_by: userId,
        })),
      });
    }

    return this.mapToResponseDto(finalCommunity);
  }

  // Get All Communities with pagination and filters
  async getCommunities(
    listQueryDto: ListCommunitiesQueryDto,
    userId?: number,
  ): Promise<{
    data: CommunityResponseDto[];
    meta: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  }> {
    const {
      page = 1,
      limit = 10,
      search,
      sort_by = 'created_at',
      sort_order = 'DESC',
      is_active,
      include_member_count = false,
      include_topic_count = false,
    } = listQueryDto;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (is_active !== undefined) {
      where.is_active = is_active;
    }

    if (search) {
      where.OR = [
        { community_name: { contains: search } },
        { community_slug: { contains: search } },
        { community_description: { contains: search } },
      ];
    }

    const sortOrderLower = sort_order.toLowerCase() as 'asc' | 'desc';

    const [communities, total] = await Promise.all([
      this.prisma.community.findMany({
        where,
        orderBy: { [sort_by]: sortOrderLower },
        skip,
        take: limit,
      }),
      this.prisma.community.count({ where }),
    ]);

    // Load additional data if requested
    const communitiesWithCounts = await Promise.all(
      communities.map(async (community) => {
        // member_count is a denormalized column (kept in sync by join()/leave()),
        // already present on `community` — no need to count CommunityUser rows here.
        const response: any = { ...community };

        if (include_topic_count) {
          const topicCount = await this.prisma.communityTopic.count({
            where: { community_id: community.id, is_active: true },
          });
          response.topic_count = topicCount;
        }

        if (userId) {
          const membership = await this.prisma.communityUser.findFirst({
            where: {
              community_id: community.id,
              user_id: userId,
              is_active: true,
            },
          });
          response.is_member = !!membership;
          response.user_role = membership?.role || null;
        }

        return response;
      }),
    );

    return {
      data: communitiesWithCounts.map((community) =>
        this.mapToResponseDto(community),
      ),
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  // Get Joined Communities for the logged-in user
  async getJoinedCommunities(
    listQueryDto: ListCommunitiesQueryDto,
    userId: number,
  ): Promise<{
    data: CommunityResponseDto[];
    meta: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  }> {
    const {
      page = 1,
      limit = 10,
      search,
      sort_by = 'created_at',
      sort_order = 'DESC',
      is_active,
      include_member_count = false,
      include_topic_count = false,
    } = listQueryDto;

    const skip = (page - 1) * limit;
    const sortOrderLower = sort_order.toLowerCase() as 'asc' | 'desc';

    // Build where for communities the user has joined
    const communityWhere: any = {
      is_active: true,
      members: {
        some: {
          user_id: userId,
          is_active: true,
        },
      },
    };

    if (is_active !== undefined) {
      communityWhere.is_active = is_active;
    }

    if (search) {
      communityWhere.OR = [
        { community_name: { contains: search } },
        { community_slug: { contains: search } },
        { community_description: { contains: search } },
      ];
    }

    const [communities, total] = await Promise.all([
      this.prisma.community.findMany({
        where: communityWhere,
        orderBy: { [sort_by]: sortOrderLower },
        skip,
        take: limit,
      }),
      this.prisma.community.count({ where: communityWhere }),
    ]);

    // Load additional data
    const communitiesWithCounts = await Promise.all(
      communities.map(async (community) => {
        // member_count is a denormalized column (kept in sync by join()/leave()).
        const response: any = { ...community };

        if (include_topic_count) {
          const topicCount = await this.prisma.communityTopic.count({
            where: { community_id: community.id, is_active: true },
          });
          response.topic_count = topicCount;
        }

        // Get membership info (user is definitely a member, but get role)
        const membership = await this.prisma.communityUser.findFirst({
          where: {
            community_id: community.id,
            user_id: userId,
            is_active: true,
          },
        });
        response.is_member = true; // User is definitely a member
        response.user_role = membership?.role || null;

        return response;
      }),
    );

    return {
      data: communitiesWithCounts.map((community) =>
        this.mapToResponseDto(community),
      ),
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  // Get Personalized Communities based on user's subscribed topics
  async getPersonalizedCommunities(
    listQueryDto: ListCommunitiesQueryDto,
    userId: number,
  ): Promise<{
    data: CommunityResponseDto[];
    meta: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  }> {
    const {
      page = 1,
      limit = 10,
      search,
      sort_by = 'created_at',
      sort_order = 'DESC',
      is_active,
      include_member_count = false,
      include_topic_count = false,
    } = listQueryDto;

    const skip = (page - 1) * limit;
    const sortOrderLower = sort_order.toLowerCase() as 'asc' | 'desc';

    // Get user's subscribed topics
    const userSubscribedTopics = await this.prisma.userTopic.findMany({
      where: { user_id: userId, is_active: true },
      select: { topic_id: true },
    });

    const subscribedTopicIds = userSubscribedTopics.map((ut) => ut.topic_id);

    // If user has no subscribed topics, return empty result
    if (subscribedTopicIds.length === 0) {
      return {
        data: [],
        meta: { total: 0, page, limit, total_pages: 0 },
      };
    }

    // Get communities that have at least one of the user's subscribed topics
    const communityWhere: any = {
      is_active: true,
      communityTopics: {
        some: {
          topic_id: { in: subscribedTopicIds },
          is_active: true,
        },
      },
    };

    if (is_active !== undefined) {
      communityWhere.is_active = is_active;
    }

    if (search) {
      communityWhere.OR = [
        { community_name: { contains: search } },
        { community_slug: { contains: search } },
        { community_description: { contains: search } },
      ];
    }

    const [communities, total] = await Promise.all([
      this.prisma.community.findMany({
        where: communityWhere,
        orderBy: { [sort_by]: sortOrderLower },
        skip,
        take: limit,
      }),
      this.prisma.community.count({ where: communityWhere }),
    ]);

    // Load additional data if requested
    const communitiesWithCounts = await Promise.all(
      communities.map(async (community) => {
        // member_count is a denormalized column (kept in sync by join()/leave()).
        const response: any = { ...community };

        if (include_topic_count) {
          const topicCount = await this.prisma.communityTopic.count({
            where: { community_id: community.id, is_active: true },
          });
          response.topic_count = topicCount;
        }

        // Check membership
        const membership = await this.prisma.communityUser.findFirst({
          where: {
            community_id: community.id,
            user_id: userId,
            is_active: true,
          },
        });
        response.is_member = !!membership;
        response.user_role = membership?.role || null;

        // Get matching topics (topics that user subscribed to and community has)
        const matchingTopics = await this.prisma.communityTopic.findMany({
          where: {
            community_id: community.id,
            topic_id: { in: subscribedTopicIds },
            is_active: true,
          },
          include: { topic: true },
        });
        response.matching_topics = matchingTopics.map((ct) => ({
          id: ct.topic.id,
          topic_slug: ct.topic.topic_slug,
          topic_name: ct.topic.topic_name,
        }));

        return response;
      }),
    );

    return {
      data: communitiesWithCounts.map((community) =>
        this.mapToResponseDto(community),
      ),
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  // Get Trending Communities
  // Ranks communities by a weighted score:
  //   total_members * 1  +  new_members_last_7_days * 5  +  new_posts_last_7_days * 3
  async getTrendingCommunities(
    listQueryDto: ListCommunitiesQueryDto,
    userId?: number,
  ): Promise<{
    data: CommunityResponseDto[];
    meta: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  }> {
    const {
      page = 1,
      limit = 10,
      search,
      is_active = true,
      include_topic_count = false,
    } = listQueryDto;

    const skip = (page - 1) * limit;

    // Trending is admin-curated (is_trending flag, toggled via admin update-status),
    // not algorithmic — ranked by member_count among communities admins have flagged.
    const where: any = { is_active, is_trending: true };

    if (search) {
      where.OR = [
        { community_name: { contains: search } },
        { community_slug: { contains: search } },
        { community_description: { contains: search } },
      ];
    }

    const [communities, total] = await Promise.all([
      this.prisma.community.findMany({
        where,
        orderBy: [{ member_count: 'desc' }, { created_at: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.community.count({ where }),
    ]);

    // Enrich with membership info, topic count, etc.
    const enriched = await Promise.all(
      communities.map(async (community) => {
        const response: any = { ...community };

        if (include_topic_count) {
          response.topic_count = await this.prisma.communityTopic.count({
            where: { community_id: community.id, is_active: true },
          });
        }

        if (userId) {
          const membership = await this.prisma.communityUser.findFirst({
            where: {
              community_id: community.id,
              user_id: userId,
              is_active: true,
            },
          });
          response.is_member = !!membership;
          response.user_role = membership?.role || null;
        }

        return response;
      }),
    );

    return {
      data: enriched.map((community) => this.mapToResponseDto(community)),
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  // Get Community by ID
  async getCommunityById(
    communityId: number,
    userId?: number,
  ): Promise<CommunityResponseDto> {
    const community = await this.prisma.community.findUnique({
      where: { id: communityId },
    });

    if (!community) {
      throw new NotFoundException('Community not found');
    }

    const response: any = { ...community };
    // member_count is a denormalized column (kept in sync by join()/leave()).

    // Get topic count
    const topicCount = await this.prisma.communityTopic.count({
      where: { community_id: communityId, is_active: true },
    });
    response.topic_count = topicCount;

    // Get user membership if userId provided
    if (userId) {
      const membership = await this.prisma.communityUser.findFirst({
        where: {
          community_id: communityId,
          user_id: userId,
          is_active: true,
        },
      });
      response.is_member = !!membership;
      response.user_role = membership?.role || null;
    }

    return this.mapToResponseDto(response);
  }

  // Get Community by Slug
  async getCommunityBySlug(
    slug: string,
    userId?: number,
  ): Promise<CommunityResponseDto> {
    const community = await this.prisma.community.findFirst({
      where: { community_slug: slug },
    });

    if (!community) {
      throw new NotFoundException('Community not found');
    }

    return this.getCommunityById(community.id, userId);
  }

  // Update Community
  async updateCommunity(
    communityId: number,
    updateCommunityDto: UpdateCommunityDto,
    userId: number,
    file?: Express.Multer.File,
  ): Promise<CommunityResponseDto> {
    const community = await this.prisma.community.findUnique({
      where: { id: communityId },
    });

    if (!community) {
      throw new NotFoundException('Community not found');
    }

    // Check if user has admin or moderator role
    const membership = await this.prisma.communityUser.findFirst({
      where: {
        community_id: communityId,
        user_id: userId,
        is_active: true,
      },
    });

    if (
      !membership ||
      (membership.role !== 'admin' && membership.role !== 'moderator')
    ) {
      throw new ForbiddenException(
        'Only community admins and moderators can update the community',
      );
    }

    // Upload community image if provided
    if (file) {
      try {
        const mediaResponse = await this.mediaClientService.uploadFile(file, {
          folder: 'communities',
          userId,
          optimize: true,
          is_public: true,
        });
        updateCommunityDto.community_image =
          this.mediaClientService.buildFileUrl(mediaResponse.file_path);
      } catch (error:any) {
        this.logger.error(`Failed to upload community image: ${error.message}`);
        throw new BadRequestException('Failed to upload community image');
      }
    }

    const updateData: any = { ...updateCommunityDto, updated_by: userId };

    // If slug is being updated, generate new slug with ID hash
    if (
      updateCommunityDto.community_slug &&
      updateCommunityDto.community_slug !== community.community_slug
    ) {
      updateData.community_slug = this.generateSlugWithHash(
        updateCommunityDto.community_slug,
        community.id,
      );
    }

    const updatedCommunity = await this.prisma.community.update({
      where: { id: communityId },
      data: updateData,
    });

    return this.mapToResponseDto(updatedCommunity);
  }

  // Delete Community (soft delete)
  async deleteCommunity(
    communityId: number,
    userId: number,
  ): Promise<{ message: string }> {
    const community = await this.prisma.community.findUnique({
      where: { id: communityId },
    });

    if (!community) {
      throw new NotFoundException('Community not found');
    }

    // Check if user is admin
    const membership = await this.prisma.communityUser.findFirst({
      where: {
        community_id: communityId,
        user_id: userId,
        is_active: true,
      },
    });

    if (!membership || membership.role !== 'admin') {
      throw new ForbiddenException(
        'Only community admins can delete the community',
      );
    }

    // Soft delete
    await this.prisma.community.update({
      where: { id: communityId },
      data: { is_active: false, updated_by: userId },
    });

    return { message: 'Community deleted successfully' };
  }

  // Join Community
  async joinCommunity(
    communityId: number,
    userId: number,
  ): Promise<{ message: string }> {
    const community = await this.prisma.community.findFirst({
      where: { id: communityId, is_active: true },
      select: { id: true },
    });

    if (!community) {
      throw new NotFoundException('Community not found or inactive');
    }

    // Check if already a member
    const existingMembership = await this.prisma.communityUser.findFirst({
      where: { community_id: communityId, user_id: userId },
    });

    if (existingMembership) {
      if (existingMembership.is_active) {
        throw new ConflictException('Already a member of this community');
      } else {
        // Reactivate membership
        await this.prisma.communityUser.update({
          where: { id: existingMembership.id },
          data: { is_active: true, updated_by: userId },
        });
        await this.prisma.community.update({
          where: { id: communityId },
          data: { member_count: { increment: 1 } },
        });
        return { message: 'Successfully joined community' };
      }
    }

    // Create new membership
    await this.prisma.communityUser.create({
      data: {
        community_id: communityId,
        user_id: userId,
        role: 'member',
        is_active: true,
        created_by: userId,
      },
    });
    await this.prisma.community.update({
      where: { id: communityId },
      data: { member_count: { increment: 1 } },
    });

    return { message: 'Successfully joined community' };
  }

  // Leave Community
  async leaveCommunity(
    communityId: number,
    userId: number,
  ): Promise<{ message: string }> {
    const membership = await this.prisma.communityUser.findFirst({
      where: {
        community_id: communityId,
        user_id: userId,
        is_active: true,
      },
    });

    if (!membership) {
      throw new NotFoundException('Not a member of this community');
    }

    // Check if user is the only admin
    if (membership.role === 'admin') {
      const adminCount = await this.prisma.communityUser.count({
        where: {
          community_id: communityId,
          role: 'admin',
          is_active: true,
        },
      });

      if (adminCount === 1) {
        throw new BadRequestException(
          'Cannot leave community: you are the only admin. Please assign another admin first.',
        );
      }
    }

    // Soft delete membership
    await this.prisma.communityUser.update({
      where: { id: membership.id },
      data: { is_active: false, updated_by: userId },
    });
    await this.prisma.community.update({
      where: { id: communityId },
      data: { member_count: { decrement: 1 } },
    });

    return { message: 'Successfully left community' };
  }

  // Get Community Members
  async getCommunityMembers(
    communityId: number,
    listQueryDto: any,
  ): Promise<{
    data: CommunityMemberResponseDto[];
    meta: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  }> {
    const community = await this.prisma.community.findUnique({
      where: { id: communityId },
      select: { id: true },
    });

    if (!community) {
      throw new NotFoundException('Community not found');
    }

    const {
      page = 1,
      limit = 10,
      role,
      sort_by = 'created_at',
      sort_order = 'DESC',
    } = listQueryDto;

    const skip = (page - 1) * limit;
    const sortOrderLower = sort_order.toLowerCase() as 'asc' | 'desc';

    const where: any = {
      community_id: communityId,
      is_active: true,
    };

    if (role) {
      where.role = role;
    }

    const [members, total] = await Promise.all([
      this.prisma.communityUser.findMany({
        where,
        include: { user: true },
        orderBy: { [sort_by]: sortOrderLower },
        skip,
        take: limit,
      }),
      this.prisma.communityUser.count({ where }),
    ]);

    return {
      data: members.map((member) => this.mapMemberToResponseDto(member)),
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  // Update Member Role
  async updateMemberRole(
    communityId: number,
    memberId: number,
    updateMemberRoleDto: UpdateMemberRoleDto,
    userId: number,
  ): Promise<CommunityMemberResponseDto> {
    // Check if requester is admin
    const requesterMembership = await this.prisma.communityUser.findFirst({
      where: {
        community_id: communityId,
        user_id: userId,
        is_active: true,
      },
    });

    if (!requesterMembership || requesterMembership.role !== 'admin') {
      throw new ForbiddenException(
        'Only community admins can update member roles',
      );
    }

    // Get target member
    const targetMember = await this.prisma.communityUser.findFirst({
      where: {
        community_id: communityId,
        user_id: memberId,
        is_active: true,
      },
      include: { user: true },
    });

    if (!targetMember) {
      throw new NotFoundException('Member not found');
    }

    // Prevent removing the last admin
    if (targetMember.role === 'admin' && updateMemberRoleDto.role !== 'admin') {
      const adminCount = await this.prisma.communityUser.count({
        where: {
          community_id: communityId,
          role: 'admin',
          is_active: true,
        },
      });

      if (adminCount === 1) {
        throw new BadRequestException(
          'Cannot change role: this is the only admin. Please assign another admin first.',
        );
      }
    }

    const updatedMember = await this.prisma.communityUser.update({
      where: { id: targetMember.id },
      data: { role: updateMemberRoleDto.role, updated_by: userId },
      include: { user: true },
    });

    return this.mapMemberToResponseDto(updatedMember);
  }

  // Add Topic to Community
  async addTopicToCommunity(
    communityId: number,
    addTopicDto: AddTopicToCommunityDto,
    userId: number,
  ): Promise<CommunityTopicResponseDto> {
    const community = await this.prisma.community.findFirst({
      where: { id: communityId, is_active: true },
      select: { id: true },
    });

    if (!community) {
      throw new NotFoundException('Community not found or inactive');
    }

    // Check if user has admin or moderator role
    const membership = await this.prisma.communityUser.findFirst({
      where: {
        community_id: communityId,
        user_id: userId,
        is_active: true,
      },
    });

    if (
      !membership ||
      (membership.role !== 'admin' && membership.role !== 'moderator')
    ) {
      throw new ForbiddenException(
        'Only community admins and moderators can add topics',
      );
    }

    // Check if topic exists
    const topic = await this.prisma.topic.findFirst({
      where: { id: addTopicDto.topic_id, is_active: true },
      select: { id: true },
    });

    if (!topic) {
      throw new NotFoundException('Topic not found or inactive');
    }

    // Check if topic is already associated
    const existingAssociation = await this.prisma.communityTopic.findFirst({
      where: {
        community_id: communityId,
        topic_id: addTopicDto.topic_id,
      },
    });

    if (existingAssociation) {
      if (existingAssociation.is_active) {
        throw new ConflictException(
          'Topic is already associated with this community',
        );
      } else {
        // Reactivate association
        const reactivated = await this.prisma.communityTopic.update({
          where: { id: existingAssociation.id },
          data: { is_active: true, updated_by: userId },
          include: { topic: true },
        });
        return this.mapTopicToResponseDto(reactivated);
      }
    }

    // Create new association
    const savedAssociation = await this.prisma.communityTopic.create({
      data: {
        community_id: communityId,
        topic_id: addTopicDto.topic_id,
        is_active: true,
        created_by: userId,
      },
      include: { topic: true },
    });

    return this.mapTopicToResponseDto(savedAssociation);
  }

  // Remove Topic from Community
  async removeTopicFromCommunity(
    communityId: number,
    topicId: number,
    userId: number,
  ): Promise<{ message: string }> {
    // Check if user has admin or moderator role
    const membership = await this.prisma.communityUser.findFirst({
      where: {
        community_id: communityId,
        user_id: userId,
        is_active: true,
      },
    });

    if (
      !membership ||
      (membership.role !== 'admin' && membership.role !== 'moderator')
    ) {
      throw new ForbiddenException(
        'Only community admins and moderators can remove topics',
      );
    }

    const association = await this.prisma.communityTopic.findFirst({
      where: {
        community_id: communityId,
        topic_id: topicId,
        is_active: true,
      },
    });

    if (!association) {
      throw new NotFoundException(
        'Topic is not associated with this community',
      );
    }

    // Soft delete
    await this.prisma.communityTopic.update({
      where: { id: association.id },
      data: { is_active: false, updated_by: userId },
    });

    return { message: 'Topic removed from community successfully' };
  }

  // Get Community Topics
  async getCommunityTopics(
    communityId: number,
  ): Promise<CommunityTopicResponseDto[]> {
    const community = await this.prisma.community.findUnique({
      where: { id: communityId },
      select: { id: true },
    });

    if (!community) {
      throw new NotFoundException('Community not found');
    }

    const topics = await this.prisma.communityTopic.findMany({
      where: { community_id: communityId, is_active: true },
      include: { topic: true },
      orderBy: { created_at: 'desc' },
    });

    return topics.map((topic) => this.mapTopicToResponseDto(topic));
  }

  // Helper: Map entity to response DTO
  private mapToResponseDto(community: any): CommunityResponseDto {
    return {
      id: community.id,
      community_slug: community.community_slug,
      community_name: community.community_name,
      community_description: community.community_description,
      community_image: community.community_image,
      is_active: community.is_active,
      is_trending: community.is_trending,
      created_by: community.created_by,
      updated_by: community.updated_by,
      created_at: community.created_at,
      updated_at: community.updated_at,
      member_count: community.member_count,
      topic_count: community.topic_count,
      user_role: community.user_role,
      is_member: community.is_member,
      ...(community.matching_topics && {
        matching_topics: community.matching_topics,
      }),
    };
  }

  // Helper: Map topic association to response DTO
  private mapTopicToResponseDto(
    communityTopic: any,
  ): CommunityTopicResponseDto {
    return {
      id: communityTopic.id,
      community_id: communityTopic.community_id,
      topic_id: communityTopic.topic_id,
      is_active: communityTopic.is_active,
      created_at: communityTopic.created_at,
      updated_at: communityTopic.updated_at,
      ...(communityTopic.topic && {
        topic: {
          id: communityTopic.topic.id,
          topic_slug: communityTopic.topic.topic_slug,
          topic_name: communityTopic.topic.topic_name,
          topic_description: communityTopic.topic.topic_description,
          topic_image: communityTopic.topic.topic_image,
        },
      }),
    };
  }

  // Helper: Map member to response DTO
  private mapMemberToResponseDto(
    communityUser: any,
  ): CommunityMemberResponseDto {
    return {
      id: communityUser.id,
      community_id: communityUser.community_id,
      user_id: communityUser.user_id,
      role: communityUser.role,
      is_active: communityUser.is_active,
      created_at: communityUser.created_at,
      updated_at: communityUser.updated_at,
      ...(communityUser.user && {
        user: {
          id: communityUser.user.id,
          username: communityUser.user.username,
          email: communityUser.user.email,
        },
      }),
    };
  }
}
