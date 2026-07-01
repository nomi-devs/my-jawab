import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSupportDto } from './dto/create-support.dto';
import { UpdateSupportDto } from './dto/update-support.dto';
import { ActiveStatus } from '../admin/dto/list-users-query.dto';

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateSupportDto, userId: number) {
    const existing = await this.prisma.support.findFirst({});
    if (existing) {
      throw new ConflictException(
        'Support record already exists. Use update instead.',
      );
    }

    const isActive =
      createDto.is_active === undefined ||
      createDto.is_active === ActiveStatus.ACTIVE;

    const saved = await this.prisma.support.create({
      data: {
        email: createDto.email,
        phone: createDto.phone,
        whatsapp: createDto.whatsapp,
        website: createDto.website,
        address: createDto.address,
        is_active: isActive,
        created_by: userId,
      },
    });

    this.logger.log(`Support record created by user ${userId}`);
    return saved;
  }

  async update(id: number, updateDto: UpdateSupportDto, userId: number) {
    const support = await this.prisma.support.findUnique({ where: { id } });

    if (!support) {
      throw new NotFoundException('Support record not found');
    }

    const updateData: any = { ...updateDto };
    if (updateData.is_active !== undefined) {
      updateData.is_active =
        updateData.is_active === 'active' ||
        updateData.is_active === ActiveStatus.ACTIVE;
    }

    const data: Record<string, any> = { updated_by: userId };
    if (updateData.email !== undefined) data.email = updateData.email;
    if (updateData.phone !== undefined) data.phone = updateData.phone;
    if (updateData.whatsapp !== undefined) data.whatsapp = updateData.whatsapp;
    if (updateData.website !== undefined) data.website = updateData.website;
    if (updateData.address !== undefined) data.address = updateData.address;
    if (updateData.is_active !== undefined)
      data.is_active = updateData.is_active;

    const saved = await this.prisma.support.update({
      where: { id },
      data,
    });

    this.logger.log(`Support record ${id} updated by user ${userId}`);
    return saved;
  }

  async findActive() {
    const support = await this.prisma.support.findFirst({
      where: { is_active: true },
    });

    if (!support) {
      throw new NotFoundException('No active support record found');
    }

    return support;
  }

  async findOne() {
    return this.prisma.support.findFirst({
      orderBy: { id: 'desc' },
    });
  }
}
