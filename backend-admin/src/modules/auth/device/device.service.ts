import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { DeviceType as PrismaDeviceType } from '@prisma/client';
import { RegisterDeviceDto, UpdateDeviceDto } from '../dto/device.dto';

@Injectable()
export class DeviceService {
  constructor(private prisma: PrismaService) {}

  async registerDevice(
    userId: number,
    registerDeviceDto: RegisterDeviceDto,
  ): Promise<any> {
    const deviceType =
      registerDeviceDto.device_type as unknown as PrismaDeviceType;
    return await this.prisma.userDevice.upsert({
      where: {
        user_id_device_id: {
          user_id: userId,
          device_id: registerDeviceDto.device_id,
        },
      },
      create: {
        user_id: userId,
        device_id: registerDeviceDto.device_id,
        device_type: deviceType,
        device_token: registerDeviceDto.device_token ?? null,
        is_active: true,
        last_active_at: new Date(),
      },
      update: {
        device_token: registerDeviceDto.device_token ?? undefined,
        device_type: deviceType,
        is_active: true,
        last_active_at: new Date(),
      },
    });
  }

  async getUserDevices(userId: number): Promise<any[]> {
    return await this.prisma.userDevice.findMany({
      where: { user_id: userId, is_active: true },
      orderBy: { last_active_at: 'desc' },
    });
  }

  async updateDevice(
    userId: number,
    deviceId: string,
    updateDeviceDto: UpdateDeviceDto,
  ): Promise<any> {
    const device = await this.prisma.userDevice.findUnique({
      where: {
        user_id_device_id: {
          user_id: userId,
          device_id: deviceId,
        },
      },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    const updateData: any = { last_active_at: new Date() };
    if (updateDeviceDto.device_token !== undefined) {
      updateData.device_token = updateDeviceDto.device_token;
    }
    if (updateDeviceDto.device_type !== undefined) {
      updateData.device_type =
        updateDeviceDto.device_type as unknown as PrismaDeviceType;
    }

    return await this.prisma.userDevice.update({
      where: {
        user_id_device_id: {
          user_id: userId,
          device_id: deviceId,
        },
      },
      data: updateData,
    });
  }

  async deactivateDevice(
    userId: number,
    deviceId: string,
  ): Promise<{ message: string }> {
    const device = await this.prisma.userDevice.findUnique({
      where: {
        user_id_device_id: {
          user_id: userId,
          device_id: deviceId,
        },
      },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    await this.prisma.userDevice.update({
      where: {
        user_id_device_id: {
          user_id: userId,
          device_id: deviceId,
        },
      },
      data: { is_active: false },
    });

    return { message: 'Device deactivated successfully' };
  }
}
