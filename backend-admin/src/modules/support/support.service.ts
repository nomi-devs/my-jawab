import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Support } from './entities/support.entity';
import { CreateSupportDto } from './dto/create-support.dto';
import { UpdateSupportDto } from './dto/update-support.dto';
import { ActiveStatus } from '../admin/dto/list-users-query.dto';

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(
    @InjectRepository(Support)
    private readonly supportRepository: Repository<Support>,
  ) {}

  async create(
    createDto: CreateSupportDto,
    userId: number,
  ): Promise<Support> {
    const existing = await this.supportRepository.findOne({ where: {} });
    if (existing) {
      throw new ConflictException(
        'Support record already exists. Use update instead.',
      );
    }

    const isActive =
      createDto.is_active === undefined ||
      createDto.is_active === ActiveStatus.ACTIVE;

    const support = this.supportRepository.create({
      email: createDto.email,
      phone: createDto.phone,
      whatsapp: createDto.whatsapp,
      website: createDto.website,
      address: createDto.address,
      is_active: isActive,
      created_by: userId,
    });

    const saved = await this.supportRepository.save(support);
    this.logger.log(`Support record created by user ${userId}`);
    return saved;
  }

  async update(
    id: number,
    updateDto: UpdateSupportDto,
    userId: number,
  ): Promise<Support> {
    const support = await this.supportRepository.findOne({ where: { id } });

    if (!support) {
      throw new NotFoundException('Support record not found');
    }

    const updateData: any = { ...updateDto };
    if (updateData.is_active !== undefined) {
      updateData.is_active =
        updateData.is_active === 'active' ||
        updateData.is_active === ActiveStatus.ACTIVE;
    }

    if (updateData.email !== undefined) support.email = updateData.email;
    if (updateData.phone !== undefined) support.phone = updateData.phone;
    if (updateData.whatsapp !== undefined) support.whatsapp = updateData.whatsapp;
    if (updateData.website !== undefined) support.website = updateData.website;
    if (updateData.address !== undefined) support.address = updateData.address;
    if (updateData.is_active !== undefined) support.is_active = updateData.is_active;
    support.updated_by = userId;

    const saved = await this.supportRepository.save(support);
    this.logger.log(`Support record ${id} updated by user ${userId}`);
    return saved;
  }

  async findActive(): Promise<Support> {
    const support = await this.supportRepository.findOne({
      where: { is_active: true },
    });

    if (!support) {
      throw new NotFoundException('No active support record found');
    }

    return support;
  }

  async findOne(): Promise<Support | null> {
    return this.supportRepository.findOne({
      where: {},
      order: { id: 'DESC' },
    });
  }
}
