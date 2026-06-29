import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, In } from 'typeorm';
import { createHash } from 'crypto';
import { Community } from './entities/community.entity';
import { CommunityTopic } from './entities/community-topic.entity';
import { CommunityUser, CommunityUserRole } from './entities/community-user.entity';
import { Topic } from '../general/entities/topic.entity';
import { UserTopic } from '../user/entities/user-topic.entity';
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
    @InjectRepository(Community)
    private communityRepository: Repository<Community>,
    @InjectRepository(CommunityTopic)
    private communityTopicRepository: Repository<CommunityTopic>,
    @InjectRepository(CommunityUser)
    private communityUserRepository: Repository<CommunityUser>,
    @InjectRepository(Topic)
    private topicRepository: Repository<Topic>,
    @InjectRepository(UserTopic)
    private userTopicRepository: Repository<UserTopic>,
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
      } catch (error) {
        this.logger.error(
          `Failed to upload community image: ${error.message}`,
        );
        throw new BadRequestException('Failed to upload community image');
      }
    }

    // Helper function to transform is_active value (manual fallback if Transform decorator doesn't work)
    const transformIsActive = (value: any): boolean => {
      if (value === undefined || value === null || value === '') return true; // Default to true
      if (typeof value === 'boolean') return value;
      const stringValue = String(value).toLowerCase().trim();
      if (stringValue === 'active' || stringValue === 'true' || stringValue === '1') return true;
      if (stringValue === 'inactive' || stringValue === 'false' || stringValue === '0') return false;
      if (value === 1 || value === '1') return true;
      if (value === 0 || value === '0') return false;
      return true; // Default to true if unrecognized
    };

    // Debug logging
    console.log('=== CREATE COMMUNITY DEBUG ===');
    console.log('createCommunityDto:', JSON.stringify(createCommunityDto, null, 2));
    console.log('is_active value:', createCommunityDto.is_active);
    console.log('is_active type:', typeof createCommunityDto.is_active);

    // Create community with initial slug (will be updated with hash after save)
    // Exclude topic_ids from community creation (handled separately)
    const { topic_ids, ...communityData } = createCommunityDto;
    const transformedIsActive = transformIsActive(createCommunityDto.is_active);
    console.log('Transformed is_active:', transformedIsActive);
    
    const community = this.communityRepository.create({
      ...communityData,
      community_image: communityImage,
      is_active: transformedIsActive,
      created_by: userId,
    });

    // Save to get the ID
    const savedCommunity = await this.communityRepository.save(community);
    
    // Generate slug with ID hash and update
    savedCommunity.community_slug = this.generateSlugWithHash(createCommunityDto.community_slug, savedCommunity.id);
    const finalCommunity = await this.communityRepository.save(savedCommunity);

    // Add creator as admin member
    await this.communityUserRepository.save({
      community_id: finalCommunity.id,
      user_id: userId,
      role: CommunityUserRole.ADMIN,
      is_active: true,
      created_by: userId,
    });

    // Add topics if provided
    if (createCommunityDto.topic_ids && createCommunityDto.topic_ids.length > 0) {
      // Validate all topics exist and are active
      const topics = await this.topicRepository.find({
        where: { id: In(createCommunityDto.topic_ids), is_active: true },
        select: ['id'],
      });

      if (topics.length !== createCommunityDto.topic_ids.length) {
        throw new BadRequestException('One or more topics not found or inactive');
      }

      // Create community-topic associations
      const communityTopics = createCommunityDto.topic_ids.map((topicId) =>
        this.communityTopicRepository.create({
          community_id: finalCommunity.id,
          topic_id: topicId,
          is_active: true,
          created_by: userId,
        }),
      );

      await this.communityTopicRepository.save(communityTopics);
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
      // Note: For personalized communities we always want member_count in the response,
      // so this flag is read for compatibility but ignored in the logic below.
      include_member_count = false,
      include_topic_count = false,
    } = listQueryDto;

    const skip = (page - 1) * limit;

    // Build query
    const queryBuilder = this.communityRepository.createQueryBuilder('community');

    if (is_active !== undefined) {
      queryBuilder.where('community.is_active = :is_active', { is_active });
    }

    if (search) {
      queryBuilder.andWhere(
        '(community.community_name LIKE :search OR community.community_slug LIKE :search OR community.community_description LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Add sorting
    queryBuilder.orderBy(`community.${sort_by}`, sort_order);

    // Get total count
    const total = await queryBuilder.getCount();

    // Get paginated results
    queryBuilder.skip(skip).take(limit);

    const communities = await queryBuilder.getMany();

    // Load additional data if requested
    const communitiesWithCounts = await Promise.all(
      communities.map(async (community) => {
        const response: any = { ...community };

        // Always include member_count for personalized community suggestions
        const memberCount = await this.communityUserRepository.count({
          where: { community_id: community.id, is_active: true },
        });
        response.member_count = memberCount;

        if (include_topic_count) {
          const topicCount = await this.communityTopicRepository.count({
            where: { community_id: community.id, is_active: true },
          });
          response.topic_count = topicCount;
        }

        if (userId) {
          const membership = await this.communityUserRepository.findOne({
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

    // Get communities that the user has joined
    const queryBuilder = this.communityRepository
      .createQueryBuilder('community')
      .innerJoin(
        'community_users',
        'cu',
        'cu.community_id = community.id AND cu.user_id = :userId AND cu.is_active = :cuActive',
        {
          userId,
          cuActive: true,
        },
      )
      .where('community.is_active = :isActive', { isActive: true })
      .select('community')
      .distinct(true);

    if (is_active !== undefined) {
      queryBuilder.andWhere('community.is_active = :is_active', { is_active });
    }

    if (search) {
      queryBuilder.andWhere(
        '(community.community_name LIKE :search OR community.community_slug LIKE :search OR community.community_description LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Add sorting
    queryBuilder.orderBy(`community.${sort_by}`, sort_order);

    // Get total count
    const total = await queryBuilder.getCount();

    // Get paginated results
    queryBuilder.skip(skip).take(limit);

    const communities = await queryBuilder.getMany();

    // Load additional data
    const communitiesWithCounts = await Promise.all(
      communities.map(async (community) => {
        const response: any = { ...community };

        // Always include member_count for joined communities
        const memberCount = await this.communityUserRepository.count({
          where: { community_id: community.id, is_active: true },
        });
        response.member_count = memberCount;

        if (include_topic_count) {
          const topicCount = await this.communityTopicRepository.count({
            where: { community_id: community.id, is_active: true },
          });
          response.topic_count = topicCount;
        }

        // Get membership info (user is definitely a member, but get role)
        const membership = await this.communityUserRepository.findOne({
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
      // Note: For personalized communities we now always include member_count
      // in the response; this flag is kept only for DTO compatibility.
      include_member_count = false,
      include_topic_count = false,
    } = listQueryDto;

    const skip = (page - 1) * limit;

    // Get user's subscribed topics
    const userSubscribedTopics = await this.userTopicRepository.find({
      where: {
        user_id: userId,
        is_active: true,
      },
      select: ['topic_id'],
    });

    const subscribedTopicIds = userSubscribedTopics.map((ut) => ut.topic_id);

    // If user has no subscribed topics, return empty result
    if (subscribedTopicIds.length === 0) {
      return {
        data: [],
        meta: {
          total: 0,
          page,
          limit,
          total_pages: 0,
        },
      };
    }

    // Get communities that have at least one of the user's subscribed topics
    const queryBuilder = this.communityRepository
      .createQueryBuilder('community')
      .innerJoin(
        'community_topics',
        'ct',
        'ct.community_id = community.id AND ct.topic_id IN (:...topicIds) AND ct.is_active = :ctActive',
        {
          topicIds: subscribedTopicIds,
          ctActive: true,
        },
      )
      .where('community.is_active = :isActive', { isActive: true })
      .select('community')
      .distinct(true);

    if (is_active !== undefined) {
      queryBuilder.andWhere('community.is_active = :is_active', { is_active });
    }

    if (search) {
      queryBuilder.andWhere(
        '(community.community_name LIKE :search OR community.community_slug LIKE :search OR community.community_description LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Add sorting
    queryBuilder.orderBy(`community.${sort_by}`, sort_order);

    // Get total count
    const total = await queryBuilder.getCount();

    // Get paginated results
    queryBuilder.skip(skip).take(limit);

    const communities = await queryBuilder.getMany();

    // Load additional data if requested
    const communitiesWithCounts = await Promise.all(
      communities.map(async (community) => {
        const response: any = { ...community };

        // Always include member_count for personalized communities
        const memberCount = await this.communityUserRepository.count({
          where: { community_id: community.id, is_active: true },
        });
        response.member_count = memberCount;

        if (include_topic_count) {
          const topicCount = await this.communityTopicRepository.count({
            where: { community_id: community.id, is_active: true },
          });
          response.topic_count = topicCount;
        }

        // Check membership
        const membership = await this.communityUserRepository.findOne({
          where: {
            community_id: community.id,
            user_id: userId,
            is_active: true,
          },
        });
        response.is_member = !!membership;
        response.user_role = membership?.role || null;

        // Get matching topics (topics that user subscribed to and community has)
        const matchingTopics = await this.communityTopicRepository.find({
          where: {
            community_id: community.id,
            topic_id: In(subscribedTopicIds),
            is_active: true,
          },
          relations: ['topic'],
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

    // Get all active communities that match the filter
    const queryBuilder = this.communityRepository.createQueryBuilder('community');
    queryBuilder.where('community.is_active = :is_active', { is_active });

    if (search) {
      queryBuilder.andWhere(
        '(community.community_name LIKE :search OR community.community_slug LIKE :search OR community.community_description LIKE :search)',
        { search: `%${search}%` },
      );
    }

    const allCommunities = await queryBuilder.getMany();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Compute scores per community
    const scored = await Promise.all(
      allCommunities.map(async (community) => {
        const totalMembers = await this.communityUserRepository.count({
          where: { community_id: community.id, is_active: true },
        });

        const recentMembers = await this.communityUserRepository
          .createQueryBuilder('cu')
          .where('cu.community_id = :cid', { cid: community.id })
          .andWhere('cu.is_active = :active', { active: true })
          .andWhere('cu.created_at >= :since', { since: sevenDaysAgo })
          .getCount();

        // Recent posts assigned to this community (community_ids is CSV)
        const recentPosts = await this.communityUserRepository.manager
          .getRepository('user_posts')
          .createQueryBuilder('post')
          .where('post.post_status = :status', { status: 'published' })
          .andWhere('post.created_at >= :since', { since: sevenDaysAgo })
          .andWhere(
            `(post.community_ids = :cid OR post.community_ids LIKE :cidStart OR post.community_ids LIKE :cidEnd OR post.community_ids LIKE :cidMid)`,
            {
              cid: `${community.id}`,
              cidStart: `${community.id},%`,
              cidEnd: `%,${community.id}`,
              cidMid: `%,${community.id},%`,
            },
          )
          .getCount();

        const trending_score =
          totalMembers * 1 + recentMembers * 5 + recentPosts * 3;

        return {
          community,
          totalMembers,
          recentMembers,
          recentPosts,
          trending_score,
        };
      }),
    );

    // Sort by score desc, then total members desc, then created_at desc
    scored.sort((a, b) => {
      if (b.trending_score !== a.trending_score)
        return b.trending_score - a.trending_score;
      if (b.totalMembers !== a.totalMembers)
        return b.totalMembers - a.totalMembers;
      return b.community.created_at.getTime() - a.community.created_at.getTime();
    });

    const total = scored.length;
    const paginated = scored.slice(skip, skip + limit);

    // Enrich with membership info, topic count, etc.
    const enriched = await Promise.all(
      paginated.map(async (item) => {
        const response: any = { ...item.community };
        response.member_count = item.totalMembers;
        response.recent_members_7d = item.recentMembers;
        response.recent_posts_7d = item.recentPosts;
        response.trending_score = item.trending_score;

        if (include_topic_count) {
          response.topic_count = await this.communityTopicRepository.count({
            where: { community_id: item.community.id, is_active: true },
          });
        }

        if (userId) {
          const membership = await this.communityUserRepository.findOne({
            where: {
              community_id: item.community.id,
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
    const community = await this.communityRepository.findOne({
      where: { id: communityId },
    });

    if (!community) {
      throw new NotFoundException('Community not found');
    }

    const response: any = { ...community };

    // Get member count
    const memberCount = await this.communityUserRepository.count({
      where: { community_id: communityId, is_active: true },
    });
    response.member_count = memberCount;

    // Get topic count
    const topicCount = await this.communityTopicRepository.count({
      where: { community_id: communityId, is_active: true },
    });
    response.topic_count = topicCount;

    // Get user membership if userId provided
    if (userId) {
      const membership = await this.communityUserRepository.findOne({
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
    const community = await this.communityRepository.findOne({
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
    const community = await this.communityRepository.findOne({
      where: { id: communityId },
    });

    if (!community) {
      throw new NotFoundException('Community not found');
    }

    // Check if user has admin or moderator role
    const membership = await this.communityUserRepository.findOne({
      where: {
        community_id: communityId,
        user_id: userId,
        is_active: true,
      },
    });

    if (
      !membership ||
      (membership.role !== CommunityUserRole.ADMIN &&
        membership.role !== CommunityUserRole.MODERATOR)
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
        updateCommunityDto.community_image = this.mediaClientService.buildFileUrl(
          mediaResponse.file_path,
        );
      } catch (error) {
        this.logger.error(
          `Failed to upload community image: ${error.message}`,
        );
        throw new BadRequestException('Failed to upload community image');
      }
    }

    // If slug is being updated, generate new slug with ID hash
    if (
      updateCommunityDto.community_slug &&
      updateCommunityDto.community_slug !== community.community_slug
    ) {
      // Remove any existing hash and generate new one with current ID
      updateCommunityDto.community_slug = this.generateSlugWithHash(updateCommunityDto.community_slug, community.id);
    }

    // Update community
    Object.assign(community, updateCommunityDto);
    community.updated_by = userId;

    const updatedCommunity = await this.communityRepository.save(community);
    return this.mapToResponseDto(updatedCommunity);
  }

  // Delete Community (soft delete)
  async deleteCommunity(
    communityId: number,
    userId: number,
  ): Promise<{ message: string }> {
    const community = await this.communityRepository.findOne({
      where: { id: communityId },
    });

    if (!community) {
      throw new NotFoundException('Community not found');
    }

    // Check if user is admin
    const membership = await this.communityUserRepository.findOne({
      where: {
        community_id: communityId,
        user_id: userId,
        is_active: true,
      },
    });

    if (!membership || membership.role !== CommunityUserRole.ADMIN) {
      throw new ForbiddenException(
        'Only community admins can delete the community',
      );
    }

    // Soft delete
    community.is_active = false;
    community.updated_by = userId;
    await this.communityRepository.save(community);

    return { message: 'Community deleted successfully' };
  }

  // Join Community
  async joinCommunity(
    communityId: number,
    userId: number,
  ): Promise<{ message: string }> {
    const community = await this.communityRepository.findOne({
      where: { id: communityId, is_active: true },
      select: ['id'],
    });

    if (!community) {
      throw new NotFoundException('Community not found or inactive');
    }

    // Check if already a member
    const existingMembership = await this.communityUserRepository.findOne({
      where: {
        community_id: communityId,
        user_id: userId,
      },
    });

    if (existingMembership) {
      if (existingMembership.is_active) {
        throw new ConflictException('Already a member of this community');
      } else {
        // Reactivate membership
        existingMembership.is_active = true;
        existingMembership.updated_by = userId;
        await this.communityUserRepository.save(existingMembership);
        return { message: 'Successfully joined community' };
      }
    }

    // Create new membership
    const membership = this.communityUserRepository.create({
      community_id: communityId,
      user_id: userId,
      role: CommunityUserRole.MEMBER,
      is_active: true,
      created_by: userId,
    });

    await this.communityUserRepository.save(membership);
    return { message: 'Successfully joined community' };
  }

  // Leave Community
  async leaveCommunity(
    communityId: number,
    userId: number,
  ): Promise<{ message: string }> {
    const membership = await this.communityUserRepository.findOne({
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
    if (membership.role === CommunityUserRole.ADMIN) {
      const adminCount = await this.communityUserRepository.count({
        where: {
          community_id: communityId,
          role: CommunityUserRole.ADMIN,
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
    membership.is_active = false;
    membership.updated_by = userId;
    await this.communityUserRepository.save(membership);

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
    const community = await this.communityRepository.findOne({
      where: { id: communityId },
      select: ['id'],
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

    const queryBuilder = this.communityUserRepository
      .createQueryBuilder('communityUser')
      .leftJoinAndSelect('communityUser.user', 'user')
      .where('communityUser.community_id = :communityId', { communityId })
      .andWhere('communityUser.is_active = :isActive', { isActive: true });

    if (role) {
      queryBuilder.andWhere('communityUser.role = :role', { role });
    }

    queryBuilder.orderBy(`communityUser.${sort_by}`, sort_order);

    const total = await queryBuilder.getCount();
    queryBuilder.skip(skip).take(limit);

    const members = await queryBuilder.getMany();

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
    const requesterMembership = await this.communityUserRepository.findOne({
      where: {
        community_id: communityId,
        user_id: userId,
        is_active: true,
      },
    });

    if (
      !requesterMembership ||
      requesterMembership.role !== CommunityUserRole.ADMIN
    ) {
      throw new ForbiddenException(
        'Only community admins can update member roles',
      );
    }

    // Get target member
    const targetMember = await this.communityUserRepository.findOne({
      where: {
        community_id: communityId,
        user_id: memberId,
        is_active: true,
      },
      relations: ['user'],
    });

    if (!targetMember) {
      throw new NotFoundException('Member not found');
    }

    // Prevent removing the last admin
    if (
      targetMember.role === CommunityUserRole.ADMIN &&
      updateMemberRoleDto.role !== CommunityUserRole.ADMIN
    ) {
      const adminCount = await this.communityUserRepository.count({
        where: {
          community_id: communityId,
          role: CommunityUserRole.ADMIN,
          is_active: true,
        },
      });

      if (adminCount === 1) {
        throw new BadRequestException(
          'Cannot change role: this is the only admin. Please assign another admin first.',
        );
      }
    }

    targetMember.role = updateMemberRoleDto.role;
    targetMember.updated_by = userId;
    await this.communityUserRepository.save(targetMember);

    return this.mapMemberToResponseDto(targetMember);
  }

  // Add Topic to Community
  async addTopicToCommunity(
    communityId: number,
    addTopicDto: AddTopicToCommunityDto,
    userId: number,
  ): Promise<CommunityTopicResponseDto> {
    const community = await this.communityRepository.findOne({
      where: { id: communityId, is_active: true },
      select: ['id'],
    });

    if (!community) {
      throw new NotFoundException('Community not found or inactive');
    }

    // Check if user has admin or moderator role
    const membership = await this.communityUserRepository.findOne({
      where: {
        community_id: communityId,
        user_id: userId,
        is_active: true,
      },
    });

    if (
      !membership ||
      (membership.role !== CommunityUserRole.ADMIN &&
        membership.role !== CommunityUserRole.MODERATOR)
    ) {
      throw new ForbiddenException(
        'Only community admins and moderators can add topics',
      );
    }

    // Check if topic exists
    const topic = await this.topicRepository.findOne({
      where: { id: addTopicDto.topic_id, is_active: true },
      select: ['id'],
    });

    if (!topic) {
      throw new NotFoundException('Topic not found or inactive');
    }

    // Check if topic is already associated
    const existingAssociation = await this.communityTopicRepository.findOne({
      where: {
        community_id: communityId,
        topic_id: addTopicDto.topic_id,
      },
    });

    if (existingAssociation) {
      if (existingAssociation.is_active) {
        throw new ConflictException('Topic is already associated with this community');
      } else {
        // Reactivate association
        existingAssociation.is_active = true;
        existingAssociation.updated_by = userId;
        await this.communityTopicRepository.save(existingAssociation);
        return this.mapTopicToResponseDto(existingAssociation);
      }
    }

    // Create new association
    const communityTopic = this.communityTopicRepository.create({
      community_id: communityId,
      topic_id: addTopicDto.topic_id,
      is_active: true,
      created_by: userId,
    });

    const savedAssociation = await this.communityTopicRepository.save(
      communityTopic,
    );
    return this.mapTopicToResponseDto(savedAssociation);
  }

  // Remove Topic from Community
  async removeTopicFromCommunity(
    communityId: number,
    topicId: number,
    userId: number,
  ): Promise<{ message: string }> {
    // Check if user has admin or moderator role
    const membership = await this.communityUserRepository.findOne({
      where: {
        community_id: communityId,
        user_id: userId,
        is_active: true,
      },
    });

    if (
      !membership ||
      (membership.role !== CommunityUserRole.ADMIN &&
        membership.role !== CommunityUserRole.MODERATOR)
    ) {
      throw new ForbiddenException(
        'Only community admins and moderators can remove topics',
      );
    }

    const association = await this.communityTopicRepository.findOne({
      where: {
        community_id: communityId,
        topic_id: topicId,
        is_active: true,
      },
    });

    if (!association) {
      throw new NotFoundException('Topic is not associated with this community');
    }

    // Soft delete
    association.is_active = false;
    association.updated_by = userId;
    await this.communityTopicRepository.save(association);

    return { message: 'Topic removed from community successfully' };
  }

  // Get Community Topics
  async getCommunityTopics(
    communityId: number,
  ): Promise<CommunityTopicResponseDto[]> {
    const community = await this.communityRepository.findOne({
      where: { id: communityId },
      select: ['id'],
    });

    if (!community) {
      throw new NotFoundException('Community not found');
    }

    const topics = await this.communityTopicRepository.find({
      where: { community_id: communityId, is_active: true },
      relations: ['topic'],
      order: { created_at: 'DESC' },
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
    communityTopic: CommunityTopic,
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
    communityUser: CommunityUser,
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

