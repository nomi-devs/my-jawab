import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DeviceType } from '../entities/user-device.entity';

export class RegisterDeviceDto {
  @ApiProperty({
    description: 'Unique device identifier',
    example: 'device-uuid-123',
  })
  @IsNotEmpty()
  @IsString()
  device_id: string;

  @ApiProperty({
    description: 'Type of device',
    enum: DeviceType,
    example: DeviceType.IOS,
  })
  @IsNotEmpty()
  @IsEnum(DeviceType)
  device_type: DeviceType;

  @ApiPropertyOptional({
    description: 'Push notification token',
    example: 'fcm-token-abc',
  })
  @IsOptional()
  @IsString()
  device_token?: string;
}

export class UpdateDeviceDto {
  @ApiPropertyOptional({
    description: 'Push notification token',
    example: 'fcm-token-abc',
  })
  @IsOptional()
  @IsString()
  device_token?: string;

  @ApiPropertyOptional({
    description: 'Type of device',
    enum: DeviceType,
    example: DeviceType.ANDROID,
  })
  @IsOptional()
  @IsEnum(DeviceType)
  device_type?: DeviceType;
}
