import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  ValidateIf,
  IsUrl,
  IsDateString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AuthType, UserRole } from '../../auth/entities/user.entity';
import { ActiveStatus, VerifiedStatus } from './list-users-query.dto';
import { ProfileGender } from '../../user/entities/user-profile.entity';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'johndoe' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  username?: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+923001234567' })
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

  @ApiPropertyOptional({ enum: ActiveStatus, example: 'active' })
  @IsOptional()
  @IsEnum(ActiveStatus)
  is_active?: ActiveStatus;

  @ApiPropertyOptional({ enum: VerifiedStatus, example: 'verified' })
  @IsOptional()
  @IsEnum(VerifiedStatus)
  is_verified?: VerifiedStatus;

  // Profile fields
  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  full_name?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @ValidateIf(
    (o) =>
      o.profile_picture !== '' &&
      o.profile_picture !== null &&
      o.profile_picture !== undefined,
  )
  @IsUrl()
  @MaxLength(500)
  profile_picture?: string;

  @ApiPropertyOptional({ example: 'https://example.com/background.jpg' })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @ValidateIf(
    (o) =>
      o.profile_background !== '' &&
      o.profile_background !== null &&
      o.profile_background !== undefined,
  )
  @IsUrl()
  @MaxLength(500)
  profile_background?: string;

  @ApiPropertyOptional({ example: 'Software Engineer' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  tagline?: string;

  @ApiPropertyOptional({ example: 'Passionate developer and tech enthusiast.' })
  @IsOptional()
  @IsString()
  profile_bio?: string;

  @ApiPropertyOptional({ enum: ProfileGender, example: 'male' })
  @IsOptional()
  @IsEnum(ProfileGender)
  profile_gender?: ProfileGender;

  @ApiPropertyOptional({ example: '1990-06-15' })
  @IsOptional()
  @IsDateString()
  profile_birthday?: string;

  @ApiPropertyOptional({ example: 'https://johndoe.dev' })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @ValidateIf(
    (o) =>
      o.profile_website !== '' &&
      o.profile_website !== null &&
      o.profile_website !== undefined,
  )
  @IsUrl()
  @MaxLength(500)
  profile_website?: string;

  @ApiPropertyOptional({ example: 'Karachi, Pakistan' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  profile_location?: string;
}
