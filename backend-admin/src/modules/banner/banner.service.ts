import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Banner, BannerType } from '@prisma/client';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { ListBannersQueryDto } from './dto/list-banners-query.dto';
import { GetBannersQueryDto } from './dto/get-banners-query.dto';
import { ActiveStatus } from '../admin/dto/list-users-query.dto';
import { MediaClientService } from '../shared/services/media-client.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BannerService {
  private readonly logger = new Logger(BannerService.name);

  constructor(
    private readonly prisma: PrismaService,
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
        imageUrl = this.mediaClientService.buildFileUrl(
          mediaResponse.file_path,
        );
      } catch (error:any) {
        this.logger.error(`Failed to upload banner image: ${error.message}`);
        throw new BadRequestException('Failed to upload banner image');
      }
    }

    if (!imageUrl) {
      throw new BadRequestException(
        'Banner image is required (either file upload or URL)',
      );
    }

    const isActive =
      createDto.is_active === undefined ||
      createDto.is_active === ActiveStatus.ACTIVE;

    const banner = await this.prisma.banner.create({
      data: {
        banner_title: createDto.banner_title ?? null,
        banner_description: createDto.banner_description ?? null,
        banner_image: imageUrl,
        banner_link: createDto.banner_link ?? null,
        banner_type: createDto.banner_type ?? 'promotion',
        target_countries: this.normalizeCsv(createDto.target_countries),
        target_topic_ids: this.normalizeCsv(createDto.target_topic_ids),
        target_subscription_ids: this.normalizeCsv(
          createDto.target_subscription_ids,
        ),
        excluded_countries: this.normalizeCsv(createDto.excluded_countries),
        excluded_topic_ids: this.normalizeCsv(createDto.excluded_topic_ids),
        excluded_subscription_ids: this.normalizeCsv(
          createDto.excluded_subscription_ids,
        ),
        valid_from: createDto.valid_from
          ? new Date(createDto.valid_from)
          : null,
        valid_until: createDto.valid_until
          ? new Date(createDto.valid_until)
          : null,
        display_order: createDto.display_order ?? 0,
        is_active: isActive,
        created_by: userId,
      },
    });

    return banner as any as Banner;
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
    const banner = await this.prisma.banner.findUnique({ where: { id } });
    if (!banner) {
      throw new NotFoundException('Banner not found');
    }

    const updateData: any = { updated_by: userId };

    // Handle image replacement
    if (file) {
      try {
        const mediaResponse = await this.mediaClientService.uploadFile(file, {
          folder: 'banners',
          userId,
          optimize: true,
          is_public: true,
        });
        updateData.banner_image = this.mediaClientService.buildFileUrl(
          mediaResponse.file_path,
        );
      } catch (error:any) {
        this.logger.error(`Failed to upload banner image: ${error.message}`);
        throw new BadRequestException('Failed to upload banner image');
      }
    } else if (updateDto.banner_image !== undefined) {
      updateData.banner_image = updateDto.banner_image;
    }

    // Update simple fields
    if (updateDto.banner_title !== undefined)
      updateData.banner_title = updateDto.banner_title;
    if (updateDto.banner_description !== undefined)
      updateData.banner_description = updateDto.banner_description;
    if (updateDto.banner_link !== undefined)
      updateData.banner_link = updateDto.banner_link;
    if (updateDto.banner_type !== undefined)
      updateData.banner_type = updateDto.banner_type;
    if (updateDto.target_countries !== undefined)
      updateData.target_countries = this.normalizeCsv(
        updateDto.target_countries,
      );
    if (updateDto.target_topic_ids !== undefined)
      updateData.target_topic_ids = this.normalizeCsv(
        updateDto.target_topic_ids,
      );
    if (updateDto.target_subscription_ids !== undefined)
      updateData.target_subscription_ids = this.normalizeCsv(
        updateDto.target_subscription_ids,
      );
    if (updateDto.excluded_countries !== undefined)
      updateData.excluded_countries = this.normalizeCsv(
        updateDto.excluded_countries,
      );
    if (updateDto.excluded_topic_ids !== undefined)
      updateData.excluded_topic_ids = this.normalizeCsv(
        updateDto.excluded_topic_ids,
      );
    if (updateDto.excluded_subscription_ids !== undefined)
      updateData.excluded_subscription_ids = this.normalizeCsv(
        updateDto.excluded_subscription_ids,
      );
    if (updateDto.valid_from !== undefined)
      updateData.valid_from = updateDto.valid_from
        ? new Date(updateDto.valid_from)
        : null;
    if (updateDto.valid_until !== undefined)
      updateData.valid_until = updateDto.valid_until
        ? new Date(updateDto.valid_until)
        : null;
    if (updateDto.display_order !== undefined)
      updateData.display_order = updateDto.display_order;
    if (updateDto.is_active !== undefined) {
      updateData.is_active =
        updateDto.is_active === 'active' ||
        (updateDto.is_active as any) === ActiveStatus.ACTIVE;
    }

    const updated = await this.prisma.banner.update({
      where: { id },
      data: updateData,
    });
    return updated as any as Banner;
  }

  /**
   * Delete a banner.
   */
  async delete(id: number): Promise<{ message: string }> {
    const banner = await this.prisma.banner.findUnique({ where: { id } });
    if (!banner) {
      throw new NotFoundException('Banner not found');
    }
    await this.prisma.banner.delete({ where: { id: banner.id } });
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

    const where: any = {};
    if (banner_type !== undefined) where.banner_type = banner_type;
    if (is_active !== undefined) where.is_active = is_active;
    if (search) where.banner_title = { contains: search };

    const orderBy: any = [
      { [sort_by]: sort_order.toLowerCase() as any },
      { created_at: 'desc' },
    ];

    const [data, total] = await Promise.all([
      this.prisma.banner.findMany({ where, skip, take: limit, orderBy }),
      this.prisma.banner.count({ where }),
    ]);

    return {
      data: data as any as Banner[],
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
    const banner = await this.prisma.banner.findUnique({ where: { id } });
    if (!banner) {
      throw new NotFoundException('Banner not found');
    }
    return banner as any as Banner;
  }

  /**
   * Public/User: get banners visible to the current user based on targeting conditions.
   */
  async getForUser(
    userId: number | null,
    query: GetBannersQueryDto,
  ): Promise<Banner[]> {
    const now = new Date();

    const where: any = {
      is_active: true,
      AND: [
        { OR: [{ valid_from: null }, { valid_from: { lte: now } }] },
        { OR: [{ valid_until: null }, { valid_until: { gte: now } }] },
      ],
      ...(query.banner_type ? { banner_type: query.banner_type } : {}),
    };

    const banners = await this.prisma.banner.findMany({
      where,
      orderBy: [{ display_order: 'desc' }, { created_at: 'desc' }],
    });

    // Gather user context
    const userCountry = (query.country || '').toUpperCase() || null;

    let userTopicIds: number[] = [];
    let userSubscriptionIds: number[] = [];

    if (userId) {
      const userTopics = await this.prisma.userTopic.findMany({
        where: { user_id: userId, is_active: true },
        select: { topic_id: true },
      });
      userTopicIds = userTopics.map((t) => t.topic_id);

      const userSubs = await this.prisma.userSubscription.findMany({
        where: { user_id: userId, is_active: true },
        select: { subscription_id: true },
      });
      userSubscriptionIds = userSubs.map((s) => s.subscription_id);
    }

    // Apply targeting + exclusion rules in memory
    return banners.filter((b) =>
      this.matchesUser(
        b as any,
        userCountry,
        userTopicIds,
        userSubscriptionIds,
      ),
    ) as any as Banner[];
  }

  // ─── Helpers ─────────────────────────────────────────────────

  private normalizeCsv(value?: string | null): string | null {
    if (!value || !value.trim()) return null;
    return (
      value
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean)
        .join(',') || null
    );
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
    const targetCountries = this.csvToArray(banner.target_countries).map((c) =>
      c.toUpperCase(),
    );
    const excludedCountries = this.csvToArray(banner.excluded_countries).map(
      (c) => c.toUpperCase(),
    );
    if (targetCountries.length > 0) {
      if (!country || !targetCountries.includes(country)) return false;
    }
    if (country && excludedCountries.includes(country)) return false;

    // Topics
    const targetTopicIds = this.csvToArray(banner.target_topic_ids)
      .map(Number)
      .filter(Number.isInteger);
    const excludedTopicIds = this.csvToArray(banner.excluded_topic_ids)
      .map(Number)
      .filter(Number.isInteger);
    if (targetTopicIds.length > 0) {
      if (!userTopicIds.some((id) => targetTopicIds.includes(id))) return false;
    }
    if (excludedTopicIds.length > 0) {
      if (userTopicIds.some((id) => excludedTopicIds.includes(id)))
        return false;
    }

    // Subscriptions
    const targetSubIds = this.csvToArray(banner.target_subscription_ids)
      .map(Number)
      .filter(Number.isInteger);
    const excludedSubIds = this.csvToArray(banner.excluded_subscription_ids)
      .map(Number)
      .filter(Number.isInteger);
    if (targetSubIds.length > 0) {
      if (!userSubscriptionIds.some((id) => targetSubIds.includes(id)))
        return false;
    }
    if (excludedSubIds.length > 0) {
      if (userSubscriptionIds.some((id) => excludedSubIds.includes(id)))
        return false;
    }

    return true;
  }
}
