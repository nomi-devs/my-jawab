import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePrivacyPolicyDto } from './dto/create-privacy-policy.dto';
import { UpdatePrivacyPolicyDto } from './dto/update-privacy-policy.dto';
import { ActiveStatus } from '../admin/dto/list-users-query.dto';

@Injectable()
export class PrivacyPolicyService {
  private readonly logger = new Logger(PrivacyPolicyService.name);

  constructor(private prisma: PrismaService) {}

  async create(createDto: CreatePrivacyPolicyDto, userId: number) {
    // Only one record should exist
    const existing = await this.prisma.privacyPolicy.findFirst({});
    if (existing) {
      throw new ConflictException(
        'Privacy policy already exists. Use update instead.',
      );
    }

    const isActive =
      createDto.is_active === undefined ||
      createDto.is_active === ActiveStatus.ACTIVE;

    const saved = await this.prisma.privacyPolicy.create({
      data: {
        slug: createDto.slug,
        title: createDto.title,
        content: createDto.content,
        is_active: isActive,
        created_by: userId,
      },
    });

    this.logger.log(`Privacy policy created by user ${userId}`);
    return saved;
  }

  async update(id: number, updateDto: UpdatePrivacyPolicyDto, userId: number) {
    const policy = await this.prisma.privacyPolicy.findUnique({
      where: { id },
    });

    if (!policy) {
      throw new NotFoundException('Privacy policy not found');
    }

    // Convert is_active enum to boolean if provided
    const updateData: any = { ...updateDto };
    if (updateData.is_active !== undefined) {
      updateData.is_active =
        updateData.is_active === 'active' ||
        updateData.is_active === ActiveStatus.ACTIVE;
    }

    const data: Record<string, any> = { updated_by: userId };
    if (updateData.slug !== undefined) data.slug = updateData.slug;
    if (updateData.title !== undefined) data.title = updateData.title;
    if (updateData.content !== undefined) data.content = updateData.content;
    if (updateData.is_active !== undefined)
      data.is_active = updateData.is_active;

    const saved = await this.prisma.privacyPolicy.update({
      where: { id },
      data,
    });

    this.logger.log(`Privacy policy ${id} updated by user ${userId}`);
    return saved;
  }

  async findActive() {
    const policy = await this.prisma.privacyPolicy.findFirst({
      where: { is_active: true },
    });

    if (!policy) {
      throw new NotFoundException('No active privacy policy found');
    }

    return policy;
  }

  async findOne() {
    return this.prisma.privacyPolicy.findFirst({
      orderBy: { id: 'desc' },
    });
  }
}
