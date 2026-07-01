import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdminLoginDto {
  @ApiProperty({ description: 'Email or username', example: 'admin@jawab.com' })
  @IsNotEmpty()
  @IsString()
  identifier: string; // Can be email or username

  @ApiProperty({ example: 'Admin@123' })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiPropertyOptional({ example: 'device-uuid-123' })
  @IsOptional()
  @IsString()
  device_id?: string;

  @ApiPropertyOptional({ example: 'android' })
  @IsOptional()
  @IsString()
  device_type?: string;

  @ApiPropertyOptional({ example: 'fcm-token-xyz' })
  @IsOptional()
  @IsString()
  device_token?: string;
}
