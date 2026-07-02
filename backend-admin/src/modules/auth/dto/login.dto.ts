import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuthType } from '@prisma/client';

export class LoginDto {
  @ApiProperty({
    description: 'Email, username, or phone number',
    example: 'john@example.com',
  })
  @IsNotEmpty()
  @IsString()
  identifier: string; // Can be email, username, or phone

  @ApiPropertyOptional({
    description: 'Password (required for email/phone auth)',
    example: 'secret123',
  })
  @ValidateIf((o) => o.auth_type === 'email' || o.auth_type === 'phone')
  @IsNotEmpty()
  @IsString()
  password?: string;

  @ApiProperty({
    description: 'Authentication method',
    enum: AuthType,
    example: AuthType.email,
  })
  @IsNotEmpty()
  @IsEnum(AuthType)
  auth_type: AuthType;

  @ApiPropertyOptional({
    description: 'Device identifier',
    example: 'device-uuid-123',
  })
  @IsOptional()
  @IsString()
  device_id?: string;

  @ApiPropertyOptional({ description: 'Device type', example: 'ios' })
  @IsOptional()
  @IsString()
  device_type?: string;

  @ApiPropertyOptional({
    description: 'Push notification token',
    example: 'fcm-token-abc',
  })
  @IsOptional()
  @IsString()
  device_token?: string;

  // For OAuth (Google/Apple)
  @ApiPropertyOptional({
    description: 'OAuth token (required for google/apple auth)',
    example: 'ya29.oauth-token',
  })
  @ValidateIf((o) => o.auth_type === 'google' || o.auth_type === 'apple')
  @IsOptional()
  @IsString()
  oauth_token?: string;
}
