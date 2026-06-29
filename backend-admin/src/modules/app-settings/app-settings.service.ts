import {
    Injectable,
    NotFoundException,
    ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppSetting } from './entities/app-setting.entity';
import { CreateAppSettingDto } from './dto/create-app-setting.dto';
import { UpdateAppSettingDto } from './dto/update-app-setting.dto';

@Injectable()
export class AppSettingsService {
    constructor(
        @InjectRepository(AppSetting)
        private appSettingRepository: Repository<AppSetting>,
    ) { }

    async create(createAppSettingDto: CreateAppSettingDto, userId: number): Promise<AppSetting> {
        const existing = await this.appSettingRepository.findOne({
            where: { setting_key: createAppSettingDto.setting_key },
        });

        if (existing) {
            throw new ConflictException('Setting with this key already exists');
        }

        const setting = this.appSettingRepository.create({
            ...createAppSettingDto,
            created_by: userId,
        });

        return await this.appSettingRepository.save(setting);
    }

    async findAll(group?: string): Promise<AppSetting[]> {
        if (group) {
            return await this.appSettingRepository.find({ where: { setting_group: group } });
        }
        return await this.appSettingRepository.find();
    }

    async findByKey(key: string): Promise<AppSetting> {
        const setting = await this.appSettingRepository.findOne({ where: { setting_key: key } });
        if (!setting) {
            throw new NotFoundException(`Setting with key ${key} not found`);
        }
        return setting;
    }

    async update(key: string, updateAppSettingDto: UpdateAppSettingDto, userId: number): Promise<AppSetting> {
        const setting = await this.findByKey(key);
        Object.assign(setting, updateAppSettingDto);
        setting.updated_by = userId;
        return await this.appSettingRepository.save(setting);
    }

    async remove(key: string): Promise<{ message: string }> {
        const setting = await this.findByKey(key);
        await this.appSettingRepository.remove(setting);
        return { message: 'Setting deleted successfully' };
    }
}
