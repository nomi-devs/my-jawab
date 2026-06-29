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
import { AuthType, UserRole } from '../../auth/entities/user.entity';
import { ActiveStatus, VerifiedStatus } from './list-users-query.dto';
import { ProfileGender } from '../../user/entities/user-profile.entity';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  username?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  phone_number?: string;

  @ValidateIf((o) => o.auth_type === AuthType.EMAIL || o.auth_type === AuthType.PHONE)
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsEnum(AuthType)
  auth_type?: AuthType;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(ActiveStatus)
  is_active?: ActiveStatus;

  @IsOptional()
  @IsEnum(VerifiedStatus)
  is_verified?: VerifiedStatus;

  // Profile fields
  @IsOptional()
  @IsString()
  @MaxLength(255)
  full_name?: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @ValidateIf((o) => o.profile_picture !== '' && o.profile_picture !== null && o.profile_picture !== undefined)
  @IsUrl()
  @MaxLength(500)
  profile_picture?: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @ValidateIf((o) => o.profile_background !== '' && o.profile_background !== null && o.profile_background !== undefined)
  @IsUrl()
  @MaxLength(500)
  profile_background?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  tagline?: string;

  @IsOptional()
  @IsString()
  profile_bio?: string;

  @IsOptional()
  @IsEnum(ProfileGender)
  profile_gender?: ProfileGender;

  @IsOptional()
  @IsDateString()
  profile_birthday?: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @ValidateIf((o) => o.profile_website !== '' && o.profile_website !== null && o.profile_website !== undefined)
  @IsUrl()
  @MaxLength(500)
  profile_website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  profile_location?: string;
}

