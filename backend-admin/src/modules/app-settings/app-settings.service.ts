import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAppSettingDto } from './dto/create-app-setting.dto';
import { UpdateAppSettingDto } from './dto/update-app-setting.dto';

@Injectable()
export class AppSettingsService {
  constructor(private prisma: PrismaService) {}

  async create(createAppSettingDto: CreateAppSettingDto, userId: number) {
    const existing = await this.prisma.appSetting.findFirst({
      where: { setting_key: createAppSettingDto.setting_key },
    });

    if (existing) {
      throw new ConflictException('Setting with this key already exists');
    }

    return await this.prisma.appSetting.create({
      data: {
        ...createAppSettingDto,
        created_by: userId,
      },
    });
  }

  async findAll(group?: string) {
    if (group) {
      return await this.prisma.appSetting.findMany({
        where: { setting_group: group },
      });
    }
    return await this.prisma.appSetting.findMany();
  }

  async findByKey(key: string) {
    const setting = await this.prisma.appSetting.findFirst({
      where: { setting_key: key },
    });
    if (!setting) {
      throw new NotFoundException(`Setting with key ${key} not found`);
    }
    return setting;
  }

  async update(
    key: string,
    updateAppSettingDto: UpdateAppSettingDto,
    userId: number,
  ) {
    const setting = await this.findByKey(key);
    return await this.prisma.appSetting.update({
      where: { id: setting.id },
      data: {
        ...updateAppSettingDto,
        updated_by: userId,
      },
    });
  }

  async remove(key: string): Promise<{ message: string }> {
    const setting = await this.findByKey(key);
    await this.prisma.appSetting.delete({ where: { id: setting.id } });
    return { message: 'Setting deleted successfully' };
  }
}
