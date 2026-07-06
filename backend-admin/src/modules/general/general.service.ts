import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { TopicResponseDto } from './dto/topic-response.dto';
import { TopicSelectListDto } from './dto/topic-select-list.dto';
import { ListTopicsQueryDto } from './dto/list-topics-query.dto';
import { MediaClientService } from '../shared/services/media-client.service';
import { ActiveStatus } from '../admin/dto/list-users-query.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class GeneralService {
  private readonly logger = new Logger(GeneralService.name);

  constructor(
    private prisma: PrismaService,
    private mediaClientService: MediaClientService,
  ) { }

  // Create Topic
  async createTopic(
    createTopicDto: CreateTopicDto,
    userId: number,
    file?: Express.Multer.File,
  ): Promise<TopicResponseDto> {
    try {
      // Validate required fields
      if (!createTopicDto.topic_slug) {
        throw new BadRequestException('Topic slug is required');
      }
      if (!createTopicDto.topic_name) {
        throw new BadRequestException('Topic name is required');
      }

      // Check if topic slug already exists
      const existingTopic = await this.prisma.topic.findFirst({
        where: { topic_slug: createTopicDto.topic_slug },
        select: { id: true },
      });

      if (existingTopic) {
        throw new ConflictException('Topic with this slug already exists');
      }

      // Validate parent_id if provided
      if (createTopicDto.parent_id && createTopicDto.parent_id > 0) {
        const parentTopic = await this.prisma.topic.findUnique({
          where: { id: createTopicDto.parent_id },
          select: { id: true },
        });

        if (!parentTopic) {
          throw new NotFoundException('Parent topic not found');
        }
      }

      let topicImage = createTopicDto.topic_image;

      // Only allow image upload for parent topics (parent_id === 0)
      const isParentTopic =
        !createTopicDto.parent_id || createTopicDto.parent_id === 0;
      if (file && !isParentTopic) {
        throw new BadRequestException(
          'Only parent topics can have images. Child topics cannot have images.',
        );
      }

      // Upload topic image if provided (file takes precedence over URL)
      if (file && isParentTopic) {
        try {
          const mediaResponse = await this.mediaClientService.uploadFile(file, {
            folder: 'topics',
            userId,
            optimize: true,
            is_public: true,
          });
          topicImage = this.mediaClientService.buildFileUrl(
            mediaResponse.file_path,
          );
        } catch (error: any) {
          this.logger.error(
            `Failed to upload topic image: ${error.message}`,
            error.stack,
          );
          throw new BadRequestException(
            `Failed to upload topic image: ${error.message}`,
          );
        }
      }

      // Clear image if trying to set image for child topic
      if (!isParentTopic && (file || topicImage)) {
        topicImage = undefined;
        this.logger.warn(
          'Image upload ignored for child topic. Only parent topics can have images.',
        );
      }

      // Convert ActiveStatus string/enum to boolean if provided
      let isActive = true; // Default to true if not provided
      if (createTopicDto.is_active !== undefined) {
        const isActiveValue: any = createTopicDto.is_active;
        if (
          isActiveValue === 'active' ||
          isActiveValue === ActiveStatus.ACTIVE ||
          isActiveValue === true
        ) {
          isActive = true;
        } else if (
          isActiveValue === 'inactive' ||
          isActiveValue === ActiveStatus.INACTIVE ||
          isActiveValue === false
        ) {
          isActive = false;
        } else {
          // Default to true if value is not recognized
          isActive = true;
        }
      }

      const savedTopic = await this.prisma.topic.create({
        data: {
          topic_slug: createTopicDto.topic_slug,
          topic_name: createTopicDto.topic_name,
          topic_description: createTopicDto.topic_description,
          topic_image: topicImage,
          parent_id: createTopicDto.parent_id || 0,
          is_active: isActive,
          created_by: userId,
        },
      });

      return this.mapToResponseDto(savedTopic);
    } catch (error: any) {
      // Re-throw known exceptions
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      // Log and wrap unknown errors
      this.logger.error(`Error creating topic: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to create topic: ${error.message}`);
    }
  }

  // Get All Topics with pagination and filters
  async getTopics(listQueryDto: ListTopicsQueryDto): Promise<{
    data: TopicResponseDto[];
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
      parent_id,
      is_active,
      include_children = false,
      is_trending,
      data,
    } = listQueryDto;

    const includeAllData = data === 'all';

    // If parent_id is explicitly set, return flat list (for backward compatibility)
    if (parent_id !== undefined) {
      const skip = (page - 1) * limit;

      const where: any = { parent_id };
      if (is_active !== undefined) where.is_active = is_active;
      if (is_trending !== undefined) where.is_trending = is_trending;
      if (search) {
        where.OR = [
          { topic_name: { contains: search } },
          { topic_slug: { contains: search } },
          { topic_description: { contains: search } },
        ];
      }

      const orderBy: any = { [sort_by]: sort_order.toLowerCase() as any };

      const total = await this.prisma.topic.count({ where });

      let topics = await this.prisma.topic.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      });

      // If fetching child topics (parent_id > 0), fetch their parent separately
      if (parent_id !== undefined && parent_id > 0 && topics.length > 0) {
        const parentTopic = await this.prisma.topic.findUnique({
          where: { id: parent_id },
          select: { id: true, topic_name: true, topic_slug: true },
        });
        topics = topics.map((topic) => ({ ...topic, parent: parentTopic }));
      }

      // If fetching parent topics (parent_id = 0), also load their children
      if (parent_id === 0 && topics.length > 0) {
        const parentIds = topics.map((topic) => topic.id);

        const childWhere: any = { parent_id: { in: parentIds } };
        if (is_active !== undefined) {
          childWhere.is_active = is_active;
        } else {
          childWhere.is_active = true;
        }
        if (search) {
          childWhere.OR = [
            { topic_name: { contains: search } },
            { topic_slug: { contains: search } },
            { topic_description: { contains: search } },
          ];
        }

        const childTopics = await this.prisma.topic.findMany({
          where: childWhere,
          orderBy: [{ parent_id: 'asc' }, { created_at: 'asc' }],
        });

        // Group children by parent_id
        const childrenByParent = new Map<number, any[]>();
        childTopics.forEach((child) => {
          if (!childrenByParent.has(child.parent_id)) {
            childrenByParent.set(child.parent_id, []);
          }
          childrenByParent.get(child.parent_id)!.push(child);
        });

        // Attach children to their parents
        topics = topics.map((topic) => ({
          ...topic,
          children: childrenByParent.get(topic.id) || [],
        }));
      }

      return {
        data: topics.map((topic) =>
          includeAllData
            ? this.mapToResponseDto(topic)
            : this.mapToLimitedResponseDto(topic),
        ),
        meta: {
          total,
          page,
          limit,
          total_pages: Math.ceil(total / limit),
        },
      };
    }

    // Default behavior: Return hierarchical structure (parents with children)
    const parentWhere: any = { parent_id: 0 };
    if (is_active !== undefined) parentWhere.is_active = is_active;
    if (is_trending !== undefined) parentWhere.is_trending = is_trending;
    if (search) {
      parentWhere.OR = [
        { topic_name: { contains: search } },
        { topic_slug: { contains: search } },
        { topic_description: { contains: search } },
      ];
    }

    const orderBy: any = { [sort_by]: sort_order.toLowerCase() as any };

    const total = await this.prisma.topic.count({ where: parentWhere });

    const skip = (page - 1) * limit;
    const parentTopics = await this.prisma.topic.findMany({
      where: parentWhere,
      orderBy,
      skip,
      take: limit,
    });

    // Get all child topics for the parent topics
    const parentIds = parentTopics.map((topic) => topic.id);
    let childTopics: any[] = [];

    if (parentIds.length > 0) {
      const childWhere: any = { parent_id: { in: parentIds } };
      if (is_active !== undefined) {
        childWhere.is_active = is_active;
      } else {
        childWhere.is_active = true;
      }
      if (search) {
        childWhere.OR = [
          { topic_name: { contains: search } },
          { topic_slug: { contains: search } },
          { topic_description: { contains: search } },
        ];
      }

      childTopics = await this.prisma.topic.findMany({
        where: childWhere,
        orderBy: [{ parent_id: 'asc' }, { created_at: 'asc' }],
      });
    }

    // Group children by parent_id
    const childrenByParent = new Map<number, any[]>();
    childTopics.forEach((child) => {
      if (!childrenByParent.has(child.parent_id)) {
        childrenByParent.set(child.parent_id, []);
      }
      childrenByParent.get(child.parent_id)!.push(child);
    });

    // Build hierarchical structure
    const topicsWithChildren = parentTopics.map((parent) => {
      const children = childrenByParent.get(parent.id) || [];
      return {
        ...parent,
        children: children,
      };
    });

    return {
      data: topicsWithChildren.map((topic) => {
        if (includeAllData) {
          return this.mapToResponseDto(topic);
        } else {
          const mappedTopic = this.mapToLimitedResponseDto(topic);
          if (topic.children && topic.children.length > 0) {
            mappedTopic.children = topic.children.map((child) =>
              this.mapToLimitedResponseDto(child),
            );
          }
          return mappedTopic;
        }
      }),
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  // Get Topic by ID
  async getTopicById(topicId: number): Promise<TopicResponseDto> {
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
    });

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    const parent =
      topic.parent_id > 0
        ? await this.prisma.topic.findUnique({
          where: { id: topic.parent_id },
          select: { id: true, topic_name: true, topic_slug: true },
        })
        : null;
    const children = await this.prisma.topic.findMany({
      where: { parent_id: topicId, is_active: true },
      orderBy: { created_at: 'asc' },
    });

    return this.mapToResponseDto({ ...topic, parent, children });
  }

  // Get Topic by Slug
  async getTopicBySlug(slug: string): Promise<TopicResponseDto> {
    const topic = await this.prisma.topic.findFirst({
      where: { topic_slug: slug },
    });

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    const parent =
      topic.parent_id > 0
        ? await this.prisma.topic.findUnique({
          where: { id: topic.parent_id },
          select: { id: true, topic_name: true, topic_slug: true },
        })
        : null;
    const children = await this.prisma.topic.findMany({
      where: { parent_id: topic.id, is_active: true },
      orderBy: { created_at: 'asc' },
    });

    return this.mapToResponseDto({ ...topic, parent, children });
  }

  // Update Topic
  async updateTopic(
    topicId: number,
    updateTopicDto: UpdateTopicDto,
    userId: number,
    file?: Express.Multer.File,
  ): Promise<TopicResponseDto> {
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
    });

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    // Only allow image upload for parent topics (parent_id === 0)
    const currentParentId =
      updateTopicDto.parent_id !== undefined
        ? updateTopicDto.parent_id
        : topic.parent_id;
    const isParentTopic = !currentParentId || currentParentId === 0;

    if (file && !isParentTopic) {
      throw new BadRequestException(
        'Only parent topics can have images. Child topics cannot have images.',
      );
    }

    // Upload topic image if provided
    if (file && isParentTopic) {
      try {
        const mediaResponse = await this.mediaClientService.uploadFile(file, {
          folder: 'topics',
          userId,
          optimize: true,
          is_public: true,
        });
        updateTopicDto.topic_image = this.mediaClientService.buildFileUrl(
          mediaResponse.file_path,
        );
      } catch (error: any) {
        this.logger.error(`Failed to upload topic image: ${error.message}`);
        throw new BadRequestException('Failed to upload topic image');
      }
    }

    // Clear image if trying to set image for child topic or if converting parent to child
    if (!isParentTopic && (file || updateTopicDto.topic_image)) {
      updateTopicDto.topic_image = undefined;
      this.logger.warn(
        'Image upload ignored for child topic. Only parent topics can have images.',
      );
    }

    // Check if slug is being updated and if it already exists
    if (
      updateTopicDto.topic_slug &&
      updateTopicDto.topic_slug !== topic.topic_slug
    ) {
      const existingTopic = await this.prisma.topic.findFirst({
        where: { topic_slug: updateTopicDto.topic_slug },
        select: { id: true },
      });

      if (existingTopic) {
        throw new ConflictException('Topic with this slug already exists');
      }
    }

    // Validate parent_id if provided
    if (updateTopicDto.parent_id !== undefined) {
      if (updateTopicDto.parent_id > 0) {
        const parentTopic = await this.prisma.topic.findUnique({
          where: { id: updateTopicDto.parent_id },
          select: { id: true },
        });

        if (!parentTopic) {
          throw new NotFoundException('Parent topic not found');
        }

        // Prevent circular reference (topic cannot be its own parent)
        if (updateTopicDto.parent_id === topicId) {
          throw new BadRequestException('Topic cannot be its own parent');
        }

        // Check if parent is not a child of this topic (prevent deep circular references)
        const isDescendant = await this.isDescendant(
          updateTopicDto.parent_id,
          topicId,
        );
        if (isDescendant) {
          throw new BadRequestException(
            'Cannot set parent: would create circular reference',
          );
        }
      }
    }

    // Convert ActiveStatus string/enum to boolean if provided
    const updateData: any = { ...updateTopicDto };
    this.logger.log(
      `[UPDATE TOPIC ${topicId}] Received updateTopicDto: ${JSON.stringify(updateTopicDto)}`,
    );
    this.logger.log(
      `[UPDATE TOPIC ${topicId}] Current topic.is_active before update: ${topic.is_active}`,
    );

    if (updateData.is_active !== undefined && updateData.is_active !== null) {
      const isActiveValue: any = updateData.is_active;
      this.logger.log(
        `[UPDATE TOPIC ${topicId}] is_active field provided: value = ${isActiveValue}, type = ${typeof isActiveValue}`,
      );

      if (
        isActiveValue === 'active' ||
        isActiveValue === ActiveStatus.ACTIVE ||
        isActiveValue === true ||
        isActiveValue === 1 ||
        String(isActiveValue).toLowerCase() === 'active'
      ) {
        updateData.is_active = true;
        this.logger.log(
          `[UPDATE TOPIC ${topicId}] Converted is_active to: true`,
        );
      } else if (
        isActiveValue === 'inactive' ||
        isActiveValue === ActiveStatus.INACTIVE ||
        isActiveValue === false ||
        isActiveValue === 0 ||
        String(isActiveValue).toLowerCase() === 'inactive'
      ) {
        updateData.is_active = false;
        this.logger.log(
          `[UPDATE TOPIC ${topicId}] Converted is_active to: false`,
        );
      } else {
        this.logger.warn(
          `[UPDATE TOPIC ${topicId}] Unrecognized is_active value: ${isActiveValue}, defaulting to false`,
        );
        updateData.is_active = false;
      }
    } else {
      this.logger.log(
        `[UPDATE TOPIC ${topicId}] is_active not provided in update, keeping current value: ${topic.is_active}`,
      );
      delete updateData.is_active;
    }

    // Build update data object only update fields that are provided
    this.logger.log(
      `[UPDATE TOPIC ${topicId}] Fields to update: ${JSON.stringify(Object.keys(updateData))}`,
    );
    const updateFields: any = { updated_by: userId };
    if (updateData.parent_id !== undefined)
      updateFields.parent_id = updateData.parent_id;
    if (updateData.topic_slug !== undefined)
      updateFields.topic_slug = updateData.topic_slug;
    if (updateData.topic_name !== undefined)
      updateFields.topic_name = updateData.topic_name;
    if (updateData.topic_description !== undefined)
      updateFields.topic_description = updateData.topic_description;
    if (updateData.topic_image !== undefined)
      updateFields.topic_image = updateData.topic_image;
    if (updateData.is_active !== undefined) {
      updateFields.is_active = updateData.is_active;
      this.logger.log(
        `[UPDATE TOPIC ${topicId}] Setting topic.is_active to: ${updateData.is_active}`,
      );
    }
    if (updateData.is_trending !== undefined) {
      updateFields.is_trending = updateData.is_trending;
    }

    this.logger.log(
      `[UPDATE TOPIC ${topicId}] Topic entity before save: is_active = ${updateFields.is_active ?? topic.is_active}`,
    );

    const updatedTopic = await this.prisma.topic.update({
      where: { id: topicId },
      data: updateFields,
    });

    return this.mapToResponseDto(updatedTopic);
  }

  // Delete Topic (soft delete by setting is_active to false)
  async deleteTopic(
    topicId: number,
    userId: number,
  ): Promise<{ message: string }> {
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
    });

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    // Check if topic has children
    const childrenCount = await this.prisma.topic.count({
      where: { parent_id: topicId, is_active: true },
    });

    if (childrenCount > 0) {
      throw new BadRequestException(
        'Cannot delete topic with active children. Please delete or deactivate children first.',
      );
    }

    // Soft delete
    await this.prisma.topic.update({
      where: { id: topicId },
      data: { is_active: false, updated_by: userId },
    });

    return { message: 'Topic deleted successfully' };
  }

  // Get Topic Children
  async getTopicChildren(topicId: number): Promise<TopicResponseDto[]> {
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
      select: { id: true },
    });

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    const children = await this.prisma.topic.findMany({
      where: { parent_id: topicId, is_active: true },
      orderBy: { created_at: 'asc' },
    });

    // Fetch the parent topic once and attach to each child
    const parentTopic =
      children.length > 0
        ? await this.prisma.topic.findUnique({
          where: { id: topicId },
          select: { id: true, topic_name: true, topic_slug: true },
        })
        : null;

    return children.map((child) =>
      this.mapToResponseDto({ ...child, parent: parentTopic }),
    );
  }

  // Get Active Topics Only
  async getActiveTopics(): Promise<TopicResponseDto[]> {
    const topics = await this.prisma.topic.findMany({
      where: { is_active: true },
      orderBy: { created_at: 'desc' },
    });

    // Collect unique parent_ids (> 0) and fetch them in one query
    const parentIds = [
      ...new Set(topics.filter((t) => t.parent_id > 0).map((t) => t.parent_id)),
    ];
    const parentMap = new Map<number, any>();
    if (parentIds.length > 0) {
      const parents = await this.prisma.topic.findMany({
        where: { id: { in: parentIds } },
        select: { id: true, topic_name: true, topic_slug: true },
      });
      parents.forEach((p) => parentMap.set(p.id, p));
    }

    return topics.map((topic) =>
      this.mapToResponseDto({
        ...topic,
        parent:
          topic.parent_id > 0 ? (parentMap.get(topic.parent_id) ?? null) : null,
      }),
    );
  }

  // Get Topics for Select List (Parent-Child format for dropdowns)
  async getTopicsForSelectList(): Promise<TopicSelectListDto[]> {
    // Get all parent topics (parent_id = 0) that are active
    const parentTopics = await this.prisma.topic.findMany({
      where: { parent_id: 0, is_active: true },
      orderBy: { topic_name: 'asc' },
    });

    // Get all child topics (parent_id > 0) that are active
    const allTopics = await this.prisma.topic.findMany({
      where: { is_active: true },
      orderBy: [{ parent_id: 'asc' }, { topic_name: 'asc' }],
    });

    // Filter to get only children (parent_id > 0)
    const children = allTopics.filter((topic) => topic.parent_id > 0);

    // Group children by parent_id
    const childrenByParent = new Map<number, any[]>();
    children.forEach((child) => {
      if (!childrenByParent.has(child.parent_id)) {
        childrenByParent.set(child.parent_id, []);
      }
      childrenByParent.get(child.parent_id)!.push(child);
    });

    // Build hierarchical structure
    return parentTopics.map((parent) => {
      const parentChildren = childrenByParent.get(parent.id) || [];
      return {
        id: parent.id,
        parent_id: parent.parent_id,
        name: parent.topic_name,
        slug: parent.topic_slug,
        image: parent.topic_image,
        children: parentChildren.map((child) => ({
          id: child.id,
          parent_id: child.parent_id,
          name: child.topic_name,
          slug: child.topic_slug,
        })),
      };
    });
  }

  // Helper: Check if a topic is a descendant of another
  private async isDescendant(
    potentialDescendantId: number,
    ancestorId: number,
  ): Promise<boolean> {
    let currentId = potentialDescendantId;
    const visited = new Set<number>();

    while (currentId > 0) {
      if (visited.has(currentId)) {
        break; // Prevent infinite loop
      }
      visited.add(currentId);

      if (currentId === ancestorId) {
        return true;
      }

      const topic = await this.prisma.topic.findUnique({
        where: { id: currentId },
        select: { parent_id: true },
      });

      if (!topic || !topic.parent_id) {
        break;
      }

      currentId = topic.parent_id;
    }

    return false;
  }

  // Helper: Map entity to response DTO (full data)
  private mapToResponseDto(topic: any): TopicResponseDto {
    const isCategory = topic.parent_id === 0;
    return {
      id: topic.id,
      parent_id: topic.parent_id,
      topic_slug: topic.topic_slug,
      topic_name: topic.topic_name,
      topic_description: topic.topic_description,
      topic_image: topic.topic_image,
      is_active: topic.is_active,
      is_trending: topic.is_trending,
      created_by: topic.created_by,
      updated_by: topic.updated_by,
      created_at: topic.created_at,
      updated_at: topic.updated_at,
      category: isCategory,
      ...(topic.parent && { parent_name: topic.parent.topic_name }),
      ...(topic.children && {
        children: topic.children.map((child) => this.mapToResponseDto(child)),
      }),
      ...(topic.parent && { parent: this.mapToResponseDto(topic.parent) }),
    };
  }

  // Helper: Map entity to limited response DTO (only id, parent_id, slug, name, image)
  private mapToLimitedResponseDto(topic: any): any {
    const isCategory = topic.parent_id === 0;
    return {
      id: topic.id,
      parent_id: topic.parent_id,
      topic_slug: topic.topic_slug,
      topic_name: topic.topic_name,
      topic_image: topic.topic_image,
      category: isCategory,
      ...(topic.parent && { parent_name: topic.parent.topic_name }),
      // Include children names for parent topics (only basic info)
      ...(topic.children &&
        topic.children.length > 0 && {
        children: topic.children.map((child) => ({
          id: child.id,
          topic_name: child.topic_name,
          topic_slug: child.topic_slug,
        })),
      }),
    };
  }
}
