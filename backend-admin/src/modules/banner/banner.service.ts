import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Like, IsNull, Not } from 'typeorm';
import { Banner, BannerType } from './entities/banner.entity';
import { UserTopic } from '../user/entities/user-topic.entity';
import { UserSubscription } from '../subscription/entities/user-subscription.entity';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { ListBannersQueryDto } from './dto/list-banners-query.dto';
import { GetBannersQueryDto } from './dto/get-banners-query.dto';
import { ActiveStatus } from '../admin/dto/list-users-query.dto';
import { MediaClientService } from '../shared/services/media-client.service';

@Injectable()
export class BannerService {
  private readonly logger = new Logger(BannerService.name);

  constructor(
    @InjectRepository(Banner)
    private readonly bannerRepository: Repository<Banner>,
    @InjectRepository(UserTopic)
    private readonly userTopicRepository: Repository<UserTopic>,
    @InjectRepository(UserSubscription)
    private readonly userSubscriptionRepository: Repository<UserSubscription>,
    private readonly mediaClientService: MediaClientService,
  ) {}

  /**
   * Create a new banner. Image is uploaded via media service.
   */
  async create(
    createDto: CreateBannerDto,
    userId: number,
    file?: Express.Multer.File,
  ): Promise<Banner> {
    let imageUrl = createDto.banner_image;

    // Upload file to media service if provided
    if (file) {
      try {
        const mediaResponse = await this.mediaClientService.uploadFile(file, {
          folder: 'banners',
          userId,
          optimize: true,
          is_public: true,
        });
        imageUrl = this.mediaClientService.buildFileUrl(mediaResponse.file_path);
      } catch (error) {
        this.logger.error(`Failed to upload banner image: ${error.message}`);
        throw new BadRequestException('Failed to upload banner image');
      }
    }

    if (!imageUrl) {
      throw new BadRequestException('Banner image is required (either file upload or URL)');
    }

    const isActive =
      createDto.is_active === undefined ||
      createDto.is_active === ActiveStatus.ACTIVE;

    const banner = this.bannerRepository.create({
      banner_title: createDto.banner_title ?? null,
      banner_description: createDto.banner_description ?? null,
      banner_image: imageUrl,
      banner_link: createDto.banner_link ?? null,
      banner_type: createDto.banner_type ?? BannerType.PROMOTION,
      target_countries: this.normalizeCsv(createDto.target_countries),
      target_topic_ids: this.normalizeCsv(createDto.target_topic_ids),
      target_subscription_ids: this.normalizeCsv(createDto.target_subscription_ids),
      excluded_countries: this.normalizeCsv(createDto.excluded_countries),
      excluded_topic_ids: this.normalizeCsv(createDto.excluded_topic_ids),
      excluded_subscription_ids: this.normalizeCsv(createDto.excluded_subscription_ids),
      valid_from: createDto.valid_from ? new Date(createDto.valid_from) : null,
      valid_until: createDto.valid_until ? new Date(createDto.valid_until) : null,
      display_order: createDto.display_order ?? 0,
      is_active: isActive,
      created_by: userId,
    });

    return this.bannerRepository.save(banner);
  }

  /**
   * Update an existing banner. Optionally replace the image via media service.
   */
  async update(
    id: number,
    updateDto: UpdateBannerDto,
    userId: number,
    file?: Express.Multer.File,
  ): Promise<Banner> {
    const banner = await this.bannerRepository.findOne({ where: { id } });
    if (!banner) {
      throw new NotFoundException('Banner not found');
    }

    // Handle image replacement
    if (file) {
      try {
        const mediaResponse = await this.mediaClientService.uploadFile(file, {
          folder: 'banners',
          userId,
          optimize: true,
          is_public: true,
        });
        banner.banner_image = this.mediaClientService.buildFileUrl(mediaResponse.file_path);
      } catch (error) {
        this.logger.error(`Failed to upload banner image: ${error.message}`);
        throw new BadRequestException('Failed to upload banner image');
      }
    } else if (updateDto.banner_image !== undefined) {
      banner.banner_image = updateDto.banner_image;
    }

    // Update simple fields
    if (updateDto.banner_title !== undefined) banner.banner_title = updateDto.banner_title;
    if (updateDto.banner_description !== undefined) banner.banner_description = updateDto.banner_description;
    if (updateDto.banner_link !== undefined) banner.banner_link = updateDto.banner_link;
    if (updateDto.banner_type !== undefined) banner.banner_type = updateDto.banner_type;
    if (updateDto.target_countries !== undefined)
      banner.target_countries = this.normalizeCsv(updateDto.target_countries);
    if (updateDto.target_topic_ids !== undefined)
      banner.target_topic_ids = this.normalizeCsv(updateDto.target_topic_ids);
    if (updateDto.target_subscription_ids !== undefined)
      banner.target_subscription_ids = this.normalizeCsv(updateDto.target_subscription_ids);
    if (updateDto.excluded_countries !== undefined)
      banner.excluded_countries = this.normalizeCsv(updateDto.excluded_countries);
    if (updateDto.excluded_topic_ids !== undefined)
      banner.excluded_topic_ids = this.normalizeCsv(updateDto.excluded_topic_ids);
    if (updateDto.excluded_subscription_ids !== undefined)
      banner.excluded_subscription_ids = this.normalizeCsv(updateDto.excluded_subscription_ids);
    if (updateDto.valid_from !== undefined)
      banner.valid_from = updateDto.valid_from ? new Date(updateDto.valid_from) : null;
    if (updateDto.valid_until !== undefined)
      banner.valid_until = updateDto.valid_until ? new Date(updateDto.valid_until) : null;
    if (updateDto.display_order !== undefined) banner.display_order = updateDto.display_order;
    if (updateDto.is_active !== undefined) {
      banner.is_active =
        updateDto.is_active === 'active' || (updateDto.is_active as any) === ActiveStatus.ACTIVE;
    }
    banner.updated_by = userId;

    return this.bannerRepository.save(banner);
  }

  /**
   * Delete a banner.
   */
  async delete(id: number): Promise<{ message: string }> {
    const banner = await this.bannerRepository.findOne({ where: { id } });
    if (!banner) {
      throw new NotFoundException('Banner not found');
    }
    await this.bannerRepository.remove(banner);
    return { message: 'Banner deleted successfully' };
  }

  /**
   * Admin: list all banners with pagination.
   */
  async list(query: ListBannersQueryDto): Promise<{
    data: Banner[];
    meta: { total: number; page: number; limit: number; total_pages: number };
  }> {
    const {
      page = 1,
      limit = 10,
      search,
      sort_by = 'display_order',
      sort_order = 'DESC',
      banner_type,
      is_active,
    } = query;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<Banner> = {};
    if (banner_type !== undefined) where.banner_type = banner_type;
    if (is_active !== undefined) where.is_active = is_active;
    if (search) where.banner_title = Like(`%${search}%`);

    const [data, total] = await this.bannerRepository.findAndCount({
      where,
      skip,
      take: limit,
      order: {
        [sort_by]: sort_order,
        created_at: 'DESC',
      },
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Admin: get a single banner by ID.
   */
  async findById(id: number): Promise<Banner> {
    const banner = await this.bannerRepository.findOne({ where: { id } });
    if (!banner) {
      throw new NotFoundException('Banner not found');
    }
    return banner;
  }

  /**
   * Public/User: get banners visible to the current user based on targeting conditions.
   * - Filters by is_active, valid_from/valid_until
   * - Filters by country (target / excluded)
   * - Filters by user's subscribed topics (target / excluded)
   * - Filters by user's active subscription (target / excluded)
   * - Sorted by display_order DESC, then created_at DESC
   */
  async getForUser(
    userId: number | null,
    query: GetBannersQueryDto,
  ): Promise<Banner[]> {
    const now = new Date();
    const qb = this.bannerRepository
      .createQueryBuilder('banner')
      .where('banner.is_active = :active', { active: true })
      .andWhere('(banner.valid_from IS NULL OR banner.valid_from <= :now)', { now })
      .andWhere('(banner.valid_until IS NULL OR banner.valid_until >= :now)', { now });

    if (query.banner_type) {
      qb.andWhere('banner.banner_type = :type', { type: query.banner_type });
    }

    qb.orderBy('banner.display_order', 'DESC').addOrderBy('banner.created_at', 'DESC');

    const banners = await qb.getMany();

    // Gather user context
    const userCountry = (query.country || '').toUpperCase() || null;

    let userTopicIds: number[] = [];
    let userSubscriptionIds: number[] = [];

    if (userId) {
      const userTopics = await this.userTopicRepository.find({
        where: { user_id: userId, is_active: true },
        select: ['topic_id'],
      });
      userTopicIds = userTopics.map((t) => t.topic_id);

      const userSubs = await this.userSubscriptionRepository.find({
        where: { user_id: userId, is_active: true },
        select: ['subscription_id'],
      });
      userSubscriptionIds = userSubs.map((s) => s.subscription_id);
    }

    // Apply targeting + exclusion rules in memory
    return banners.filter((b) => this.matchesUser(b, userCountry, userTopicIds, userSubscriptionIds));
  }

  // ─── Helpers ─────────────────────────────────────────────────

  private normalizeCsv(value?: string | null): string | null {
    if (!value || !value.trim()) return null;
    return value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean)
      .join(',') || null;
  }

  private csvToArray(value: string | null): string[] {
    if (!value) return [];
    return value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  }

  /**
   * Returns true if banner should be shown to a user with the given country,
   * topic IDs, and subscription IDs. NULL target = applies to all; NULL exclusion = no exclusion.
   */
  private matchesUser(
    banner: Banner,
    country: string | null,
    userTopicIds: number[],
    userSubscriptionIds: number[],
  ): boolean {
    // Country
    const targetCountries = this.csvToArray(banner.target_countries).map((c) => c.toUpperCase());
    const excludedCountries = this.csvToArray(banner.excluded_countries).map((c) => c.toUpperCase());
    if (targetCountries.length > 0) {
      if (!country || !targetCountries.includes(country)) return false;
    }
    if (country && excludedCountries.includes(country)) return false;

    // Topics
    const targetTopicIds = this.csvToArray(banner.target_topic_ids).map(Number).filter(Number.isInteger);
    const excludedTopicIds = this.csvToArray(banner.excluded_topic_ids).map(Number).filter(Number.isInteger);
    if (targetTopicIds.length > 0) {
      if (!userTopicIds.some((id) => targetTopicIds.includes(id))) return false;
    }
    if (excludedTopicIds.length > 0) {
      if (userTopicIds.some((id) => excludedTopicIds.includes(id))) return false;
    }

    // Subscriptions
    const targetSubIds = this.csvToArray(banner.target_subscription_ids).map(Number).filter(Number.isInteger);
    const excludedSubIds = this.csvToArray(banner.excluded_subscription_ids).map(Number).filter(Number.isInteger);
    if (targetSubIds.length > 0) {
      if (!userSubscriptionIds.some((id) => targetSubIds.includes(id))) return false;
    }
    if (excludedSubIds.length > 0) {
      if (userSubscriptionIds.some((id) => excludedSubIds.includes(id))) return false;
    }

    return true;
  }
}
