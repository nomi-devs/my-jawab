import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuthType } from '@prisma/client';
import { RequireEmailOrPhone } from './validators/class-validators';

export class RegisterDto {
  @ApiProperty({ description: 'Unique username', example: 'john_doe' })
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiPropertyOptional({
    description: 'User email address (required if phone_number not provided)',
    example: 'john@example.com',
  })
  @RequireEmailOrPhone()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'User phone number (required if email not provided)',
    example: '+923001234567',
  })
  @RequireEmailOrPhone()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone_number?: string;

  @ApiPropertyOptional({
    description: 'Password (required for email/phone auth, min 6 chars)',
    example: 'secret123',
  })
  @ValidateIf((o) => o.auth_type === 'email' || o.auth_type === 'phone')
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
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
  @IsNotEmpty()
  @IsString()
  oauth_token?: string;
}
