import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Topic } from './entities/topic.entity';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { TopicResponseDto } from './dto/topic-response.dto';
import { TopicSelectListDto } from './dto/topic-select-list.dto';
import { ListTopicsQueryDto } from './dto/list-topics-query.dto';
import { MediaClientService } from '../shared/services/media-client.service';
import { ActiveStatus } from '../admin/dto/list-users-query.dto';

@Injectable()
export class GeneralService {
  private readonly logger = new Logger(GeneralService.name);

  constructor(
    @InjectRepository(Topic)
    private topicRepository: Repository<Topic>,
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
      const existingTopic = await this.topicRepository.findOne({
        where: { topic_slug: createTopicDto.topic_slug },
        select: ['id'],
      });

      if (existingTopic) {
        throw new ConflictException('Topic with this slug already exists');
      }

      // Validate parent_id if provided
      if (createTopicDto.parent_id && createTopicDto.parent_id > 0) {
        const parentTopic = await this.topicRepository.findOne({
          where: { id: createTopicDto.parent_id },
          select: ['id'],
        });

        if (!parentTopic) {
          throw new NotFoundException('Parent topic not found');
        }
      }

      let topicImage = createTopicDto.topic_image;

      // Only allow image upload for parent topics (parent_id === 0)
      const isParentTopic = !createTopicDto.parent_id || createTopicDto.parent_id === 0;
      if (file && !isParentTopic) {
        throw new BadRequestException('Only parent topics can have images. Child topics cannot have images.');
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
        } catch (error) {
          this.logger.error(`Failed to upload topic image: ${error.message}`, error.stack);
          throw new BadRequestException(`Failed to upload topic image: ${error.message}`);
        }
      }

      // Clear image if trying to set image for child topic
      if (!isParentTopic && (file || topicImage)) {
        topicImage = undefined;
        this.logger.warn('Image upload ignored for child topic. Only parent topics can have images.');
      }

      // Convert ActiveStatus string/enum to boolean if provided
      let isActive = true; // Default to true if not provided
      if (createTopicDto.is_active !== undefined) {
        const isActiveValue: any = createTopicDto.is_active;
        if (isActiveValue === 'active' || isActiveValue === ActiveStatus.ACTIVE || isActiveValue === true) {
          isActive = true;
        } else if (isActiveValue === 'inactive' || isActiveValue === ActiveStatus.INACTIVE || isActiveValue === false) {
          isActive = false;
        } else {
          // Default to true if value is not recognized
          isActive = true;
        }
      }

      const topic = this.topicRepository.create({
        topic_slug: createTopicDto.topic_slug,
        topic_name: createTopicDto.topic_name,
        topic_description: createTopicDto.topic_description,
        topic_image: topicImage,
        parent_id: createTopicDto.parent_id || 0,
        is_active: isActive,
        created_by: userId,
      });

      const savedTopic = await this.topicRepository.save(topic);
      return this.mapToResponseDto(savedTopic);
    } catch (error) {
      // Re-throw known exceptions
      if (error instanceof BadRequestException ||
        error instanceof ConflictException ||
        error instanceof NotFoundException) {
        throw error;
      }
      // Log and wrap unknown errors
      this.logger.error(`Error creating topic: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to create topic: ${error.message}`);
    }
  }

  // Get All Topics with pagination and filters
  async getTopics(
    listQueryDto: ListTopicsQueryDto,
  ): Promise<{
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
      data,
    } = listQueryDto;

    const includeAllData = data === 'all';

    // If parent_id is explicitly set, return flat list (for backward compatibility)
    if (parent_id !== undefined) {
      const skip = (page - 1) * limit;

      // Build query
      const queryBuilder = this.topicRepository.createQueryBuilder('topic');

      queryBuilder.where('topic.parent_id = :parent_id', { parent_id });

      if (is_active !== undefined) {
        queryBuilder.andWhere('topic.is_active = :is_active', { is_active });
      }

      if (search) {
        queryBuilder.andWhere(
          '(topic.topic_name LIKE :search OR topic.topic_slug LIKE :search OR topic.topic_description LIKE :search)',
          { search: `%${search}%` },
        );
      }

      // Add sorting
      queryBuilder.orderBy(`topic.${sort_by}`, sort_order);

      // Get total count
      const total = await queryBuilder.getCount();

      // Get paginated results
      queryBuilder.skip(skip).take(limit);

      // Load parent relation for child topics
      queryBuilder.leftJoinAndSelect('topic.parent', 'parent');

      const topics = await queryBuilder.getMany();

      // If fetching parent topics (parent_id = 0), also load their children
      if (parent_id === 0 && topics.length > 0) {
        const parentIds = topics.map((topic) => topic.id);
        const childQueryBuilder = this.topicRepository.createQueryBuilder('topic');
        childQueryBuilder.where('topic.parent_id IN (:...parentIds)', { parentIds });

        if (is_active !== undefined) {
          childQueryBuilder.andWhere('topic.is_active = :is_active', { is_active });
        } else {
          // If is_active filter not specified, only get active children
          childQueryBuilder.andWhere('topic.is_active = :is_active', { is_active: true });
        }

        if (search) {
          childQueryBuilder.andWhere(
            '(topic.topic_name LIKE :search OR topic.topic_slug LIKE :search OR topic.topic_description LIKE :search)',
            { search: `%${search}%` },
          );
        }

        childQueryBuilder.orderBy('topic.parent_id', 'ASC');
        childQueryBuilder.addOrderBy('topic.created_at', 'ASC');
        const childTopics = await childQueryBuilder.getMany();

        // Group children by parent_id
        const childrenByParent = new Map<number, Topic[]>();
        childTopics.forEach((child) => {
          if (!childrenByParent.has(child.parent_id)) {
            childrenByParent.set(child.parent_id, []);
          }
          childrenByParent.get(child.parent_id)!.push(child);
        });

        // Attach children to their parents
        topics.forEach((topic) => {
          topic.children = childrenByParent.get(topic.id) || [];
        });
      }

      return {
        data: topics.map((topic) =>
          includeAllData
            ? this.mapToResponseDto(topic)
            : this.mapToLimitedResponseDto(topic)
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
    // Get all parent topics (parent_id = 0) - these are categories
    const parentQueryBuilder = this.topicRepository.createQueryBuilder('topic');

    parentQueryBuilder.where('topic.parent_id = :parent_id', { parent_id: 0 });

    if (is_active !== undefined) {
      parentQueryBuilder.andWhere('topic.is_active = :is_active', { is_active });
    }

    if (search) {
      parentQueryBuilder.andWhere(
        '(topic.topic_name LIKE :search OR topic.topic_slug LIKE :search OR topic.topic_description LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Add sorting
    parentQueryBuilder.orderBy(`topic.${sort_by}`, sort_order);

    // Get total count of parent topics
    const total = await parentQueryBuilder.getCount();

    // Get paginated parent topics
    const skip = (page - 1) * limit;
    parentQueryBuilder.skip(skip).take(limit);
    const parentTopics = await parentQueryBuilder.getMany();

    // Get all child topics for the parent topics
    const parentIds = parentTopics.map((topic) => topic.id);
    let childTopics: Topic[] = [];

    if (parentIds.length > 0) {
      const childQueryBuilder = this.topicRepository.createQueryBuilder('topic');
      childQueryBuilder.where('topic.parent_id IN (:...parentIds)', { parentIds });

      if (is_active !== undefined) {
        childQueryBuilder.andWhere('topic.is_active = :is_active', { is_active });
      } else {
        // If is_active filter not specified, only get active children
        childQueryBuilder.andWhere('topic.is_active = :is_active', { is_active: true });
      }

      if (search) {
        childQueryBuilder.andWhere(
          '(topic.topic_name LIKE :search OR topic.topic_slug LIKE :search OR topic.topic_description LIKE :search)',
          { search: `%${search}%` },
        );
      }

      childQueryBuilder.orderBy('topic.parent_id', 'ASC');
      childQueryBuilder.addOrderBy('topic.created_at', 'ASC');
      // Load parent relation for child topics
      childQueryBuilder.leftJoinAndSelect('topic.parent', 'parent');
      childTopics = await childQueryBuilder.getMany();
    }

    // Group children by parent_id
    const childrenByParent = new Map<number, Topic[]>();
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
          // Full data: mapToResponseDto already handles children
          return this.mapToResponseDto(topic);
        } else {
          // Limited data: map topic and manually add children
          const mappedTopic = this.mapToLimitedResponseDto(topic);
          if (topic.children && topic.children.length > 0) {
            mappedTopic.children = topic.children.map((child) =>
              this.mapToLimitedResponseDto(child)
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
    const topic = await this.topicRepository.findOne({
      where: { id: topicId },
      relations: ['parent', 'children'],
    });

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    return this.mapToResponseDto(topic);
  }

  // Get Topic by Slug
  async getTopicBySlug(slug: string): Promise<TopicResponseDto> {
    const topic = await this.topicRepository.findOne({
      where: { topic_slug: slug },
      relations: ['parent', 'children'],
    });

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    return this.mapToResponseDto(topic);
  }

  // Update Topic
  async updateTopic(
    topicId: number,
    updateTopicDto: UpdateTopicDto,
    userId: number,
    file?: Express.Multer.File,
  ): Promise<TopicResponseDto> {
    const topic = await this.topicRepository.findOne({
      where: { id: topicId },
    });

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    // Only allow image upload for parent topics (parent_id === 0)
    const currentParentId = updateTopicDto.parent_id !== undefined ? updateTopicDto.parent_id : topic.parent_id;
    const isParentTopic = !currentParentId || currentParentId === 0;

    if (file && !isParentTopic) {
      throw new BadRequestException('Only parent topics can have images. Child topics cannot have images.');
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
      } catch (error) {
        this.logger.error(`Failed to upload topic image: ${error.message}`);
        throw new BadRequestException('Failed to upload topic image');
      }
    }

    // Clear image if trying to set image for child topic or if converting parent to child
    if (!isParentTopic && (file || updateTopicDto.topic_image)) {
      updateTopicDto.topic_image = undefined;
      this.logger.warn('Image upload ignored for child topic. Only parent topics can have images.');
    }

    // Check if slug is being updated and if it already exists
    if (updateTopicDto.topic_slug && updateTopicDto.topic_slug !== topic.topic_slug) {
      const existingTopic = await this.topicRepository.findOne({
        where: { topic_slug: updateTopicDto.topic_slug },
        select: ['id'],
      });

      if (existingTopic) {
        throw new ConflictException('Topic with this slug already exists');
      }
    }

    // Validate parent_id if provided
    if (updateTopicDto.parent_id !== undefined) {
      if (updateTopicDto.parent_id > 0) {
        const parentTopic = await this.topicRepository.findOne({
          where: { id: updateTopicDto.parent_id },
          select: ['id'],
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
    this.logger.log(`[UPDATE TOPIC ${topicId}] Received updateTopicDto: ${JSON.stringify(updateTopicDto)}`);
    this.logger.log(`[UPDATE TOPIC ${topicId}] Current topic.is_active before update: ${topic.is_active}`);

    if (updateData.is_active !== undefined && updateData.is_active !== null) {
      // Convert 'active'/'inactive' string or enum to boolean
      const isActiveValue: any = updateData.is_active;
      this.logger.log(`[UPDATE TOPIC ${topicId}] is_active field provided: value = ${isActiveValue}, type = ${typeof isActiveValue}`);

      // Handle string, enum, or boolean values
      if (
        isActiveValue === 'active' ||
        isActiveValue === ActiveStatus.ACTIVE ||
        isActiveValue === true ||
        isActiveValue === 1 ||
        String(isActiveValue).toLowerCase() === 'active'
      ) {
        updateData.is_active = true;
        this.logger.log(`[UPDATE TOPIC ${topicId}] Converted is_active to: true`);
      } else if (
        isActiveValue === 'inactive' ||
        isActiveValue === ActiveStatus.INACTIVE ||
        isActiveValue === false ||
        isActiveValue === 0 ||
        String(isActiveValue).toLowerCase() === 'inactive'
      ) {
        updateData.is_active = false;
        this.logger.log(`[UPDATE TOPIC ${topicId}] Converted is_active to: false`);
      } else {
        // Default to false if value is not recognized
        this.logger.warn(`[UPDATE TOPIC ${topicId}] Unrecognized is_active value: ${isActiveValue}, defaulting to false`);
        updateData.is_active = false;
      }
    } else {
      // If is_active is undefined or null, don't update it
      this.logger.log(`[UPDATE TOPIC ${topicId}] is_active not provided in update, keeping current value: ${topic.is_active}`);
      delete updateData.is_active;
    }

    // Update topic fields - only update fields that are provided
    this.logger.log(`[UPDATE TOPIC ${topicId}] Fields to update: ${JSON.stringify(Object.keys(updateData))}`);
    if (updateData.parent_id !== undefined) topic.parent_id = updateData.parent_id;
    if (updateData.topic_slug !== undefined) topic.topic_slug = updateData.topic_slug;
    if (updateData.topic_name !== undefined) topic.topic_name = updateData.topic_name;
    if (updateData.topic_description !== undefined) topic.topic_description = updateData.topic_description;
    if (updateData.topic_image !== undefined) topic.topic_image = updateData.topic_image;
    if (updateData.is_active !== undefined) {
      topic.is_active = updateData.is_active;
      this.logger.log(`[UPDATE TOPIC ${topicId}] Setting topic.is_active to: ${topic.is_active}`);
    }
    topic.updated_by = userId;

    this.logger.log(`[UPDATE TOPIC ${topicId}] Topic entity before save: is_active = ${topic.is_active}`);

    const updatedTopic = await this.topicRepository.save(topic);
    return this.mapToResponseDto(updatedTopic);
  }

  // Delete Topic (soft delete by setting is_active to false)
  async deleteTopic(topicId: number, userId: number): Promise<{ message: string }> {
    const topic = await this.topicRepository.findOne({
      where: { id: topicId },
    });

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    // Check if topic has children
    const childrenCount = await this.topicRepository.count({
      where: { parent_id: topicId, is_active: true },
    });

    if (childrenCount > 0) {
      throw new BadRequestException(
        'Cannot delete topic with active children. Please delete or deactivate children first.',
      );
    }

    // Soft delete
    topic.is_active = false;
    topic.updated_by = userId;
    await this.topicRepository.save(topic);

    return { message: 'Topic deleted successfully' };
  }

  // Get Topic Children
  async getTopicChildren(topicId: number): Promise<TopicResponseDto[]> {
    const topic = await this.topicRepository.findOne({
      where: { id: topicId },
      select: ['id'],
    });

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    const children = await this.topicRepository.find({
      where: { parent_id: topicId, is_active: true },
      relations: ['parent'],
      order: { created_at: 'ASC' },
    });

    return children.map((child) => this.mapToResponseDto(child));
  }

  // Get Active Topics Only
  async getActiveTopics(): Promise<TopicResponseDto[]> {
    const topics = await this.topicRepository.find({
      where: { is_active: true },
      relations: ['parent'],
      order: { created_at: 'DESC' },
    });

    return topics.map((topic) => this.mapToResponseDto(topic));
  }

  // Get Topics for Select List (Parent-Child format for dropdowns)
  async getTopicsForSelectList(): Promise<TopicSelectListDto[]> {
    // Get all parent topics (parent_id = 0) that are active
    const parentTopics = await this.topicRepository.find({
      where: { parent_id: 0, is_active: true },
      order: { topic_name: 'ASC' },
    });

    // Get all child topics (parent_id > 0) that are active
    const allTopics = await this.topicRepository.find({
      where: { is_active: true },
      order: { parent_id: 'ASC', topic_name: 'ASC' },
    });

    // Filter to get only children (parent_id > 0)
    const children = allTopics.filter((topic) => topic.parent_id > 0);

    // Group children by parent_id
    const childrenByParent = new Map<number, Topic[]>();
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

      const topic = await this.topicRepository.findOne({
        where: { id: currentId },
        select: ['parent_id'],
      });

      if (!topic || !topic.parent_id) {
        break;
      }

      currentId = topic.parent_id;
    }

    return false;
  }

  // Helper: Map entity to response DTO (full data)
  private mapToResponseDto(topic: Topic): TopicResponseDto {
    const isCategory = topic.parent_id === 0;
    return {
      id: topic.id,
      parent_id: topic.parent_id,
      topic_slug: topic.topic_slug,
      topic_name: topic.topic_name,
      topic_description: topic.topic_description,
      topic_image: topic.topic_image,
      is_active: topic.is_active,
      created_by: topic.created_by,
      updated_by: topic.updated_by,
      created_at: topic.created_at,
      updated_at: topic.updated_at,
      category: isCategory, // Mark parent topics (parent_id = 0) as categories
      ...(topic.parent && { parent_name: topic.parent.topic_name }),
      ...(topic.children && {
        children: topic.children.map((child) => this.mapToResponseDto(child)),
      }),
      ...(topic.parent && { parent: this.mapToResponseDto(topic.parent) }),
    };
  }

  // Helper: Map entity to limited response DTO (only id, parent_id, slug, name, image)
  private mapToLimitedResponseDto(topic: Topic): any {
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
      ...(topic.children && topic.children.length > 0 && {
        children: topic.children.map((child) => ({
          id: child.id,
          topic_name: child.topic_name,
          topic_slug: child.topic_slug,
        })),
      }),
    };
  }
}

