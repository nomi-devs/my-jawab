import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { DeviceType } from '../entities/user-device.entity';

export class RegisterDeviceDto {
  @IsNotEmpty()
  @IsString()
  device_id: string;

  @IsNotEmpty()
  @IsEnum(DeviceType)
  device_type: DeviceType;

  @IsOptional()
  @IsString()
  device_token?: string;
}

export class UpdateDeviceDto {
  @IsOptional()
  @IsString()
  device_token?: string;

  @IsOptional()
  @IsEnum(DeviceType)
  device_type?: DeviceType;
}

