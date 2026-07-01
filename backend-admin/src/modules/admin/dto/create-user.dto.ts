import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
  MaxLength,
  IsBoolean,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuthType, UserRole } from '../../auth/entities/user.entity';
import { RequireEmailOrPhone } from '../../auth/dto/validators/class-validators';

export class CreateUserDto {
  @ApiProperty({ example: 'johndoe' })
  @IsString()
  @MaxLength(255)
  username: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @RequireEmailOrPhone()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+923001234567' })
  @RequireEmailOrPhone()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  phone_number?: string;

  @ApiPropertyOptional({ example: 'Secret@123' })
  @ValidateIf(
    (o) => o.auth_type === AuthType.EMAIL || o.auth_type === AuthType.PHONE,
  )
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({ enum: AuthType, example: 'email' })
  @IsOptional()
  @IsEnum(AuthType)
  auth_type?: AuthType;

  @ApiPropertyOptional({ enum: UserRole, example: 'user' })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @Type(() => Boolean)
  @IsBoolean()
  is_active?: boolean;

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
