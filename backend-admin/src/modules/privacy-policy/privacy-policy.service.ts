import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PrivacyPolicy } from './entities/privacy-policy.entity';
import { CreatePrivacyPolicyDto } from './dto/create-privacy-policy.dto';
import { UpdatePrivacyPolicyDto } from './dto/update-privacy-policy.dto';
import { ActiveStatus } from '../admin/dto/list-users-query.dto';

@Injectable()
export class PrivacyPolicyService {
  private readonly logger = new Logger(PrivacyPolicyService.name);

  constructor(
    @InjectRepository(PrivacyPolicy)
    private readonly privacyPolicyRepository: Repository<PrivacyPolicy>,
  ) {}

  async create(
    createDto: CreatePrivacyPolicyDto,
    userId: number,
  ): Promise<PrivacyPolicy> {
    // Only one record should exist
    const existing = await this.privacyPolicyRepository.findOne({ where: {} });
    if (existing) {
      throw new ConflictException(
        'Privacy policy already exists. Use update instead.',
      );
    }

    const isActive =
      createDto.is_active === undefined ||
      createDto.is_active === ActiveStatus.ACTIVE;

    const policy = this.privacyPolicyRepository.create({
      slug: createDto.slug,
      title: createDto.title,
      content: createDto.content,
      is_active: isActive,
      created_by: userId,
    });

    const saved = await this.privacyPolicyRepository.save(policy);
    this.logger.log(`Privacy policy created by user ${userId}`);
    return saved;
  }

  async update(
    id: number,
    updateDto: UpdatePrivacyPolicyDto,
    userId: number,
  ): Promise<PrivacyPolicy> {
    const policy = await this.privacyPolicyRepository.findOne({
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

    if (updateData.slug !== undefined) policy.slug = updateData.slug;
    if (updateData.title !== undefined) policy.title = updateData.title;
    if (updateData.content !== undefined) policy.content = updateData.content;
    if (updateData.is_active !== undefined)
      policy.is_active = updateData.is_active;
    policy.updated_by = userId;

    const saved = await this.privacyPolicyRepository.save(policy);
    this.logger.log(`Privacy policy ${id} updated by user ${userId}`);
    return saved;
  }

  async findActive(): Promise<PrivacyPolicy> {
    const policy = await this.privacyPolicyRepository.findOne({
      where: { is_active: true },
    });

    if (!policy) {
      throw new NotFoundException('No active privacy policy found');
    }

    return policy;
  }

  async findOne(): Promise<PrivacyPolicy | null> {
    return this.privacyPolicyRepository.findOne({
      where: {},
      order: { id: 'DESC' },
    });
  }
}
