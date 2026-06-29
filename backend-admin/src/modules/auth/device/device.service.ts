import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserDevice, DeviceType } from '../entities/user-device.entity';
import { RegisterDeviceDto, UpdateDeviceDto } from '../dto/device.dto';

@Injectable()
export class DeviceService {
  constructor(
    @InjectRepository(UserDevice)
    private deviceRepository: Repository<UserDevice>,
  ) {}

  async registerDevice(
    userId: number,
    registerDeviceDto: RegisterDeviceDto,
  ): Promise<UserDevice> {
    let device = await this.deviceRepository.findOne({
      where: {
        user_id: userId,
        device_id: registerDeviceDto.device_id,
      },
    });

    if (device) {
      device.device_token = registerDeviceDto.device_token || device.device_token;
      device.device_type = registerDeviceDto.device_type;
      device.is_active = true;
      device.last_active_at = new Date();
      return await this.deviceRepository.save(device);
    }

    device = this.deviceRepository.create({
      user_id: userId,
      device_id: registerDeviceDto.device_id,
      device_type: registerDeviceDto.device_type,
      device_token: registerDeviceDto.device_token,
      is_active: true,
      last_active_at: new Date(),
    });

    return await this.deviceRepository.save(device);
  }

  async getUserDevices(userId: number): Promise<UserDevice[]> {
    return await this.deviceRepository.find({
      where: { user_id: userId, is_active: true },
      order: { last_active_at: 'DESC' },
    });
  }

  async updateDevice(
    userId: number,
    deviceId: string,
    updateDeviceDto: UpdateDeviceDto,
  ): Promise<UserDevice> {
    const device = await this.deviceRepository.findOne({
      where: {
        user_id: userId,
        device_id: deviceId,
      },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    if (updateDeviceDto.device_token !== undefined) {
      device.device_token = updateDeviceDto.device_token;
    }
    if (updateDeviceDto.device_type !== undefined) {
      device.device_type = updateDeviceDto.device_type;
    }
    device.last_active_at = new Date();

    return await this.deviceRepository.save(device);
  }

  async deactivateDevice(userId: number, deviceId: string): Promise<{ message: string }> {
    const device = await this.deviceRepository.findOne({
      where: {
        user_id: userId,
        device_id: deviceId,
      },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    device.is_active = false;
    await this.deviceRepository.save(device);

    return { message: 'Device deactivated successfully' };
  }
}

