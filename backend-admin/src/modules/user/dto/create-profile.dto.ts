import {
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  IsUrl,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ProfileGender } from '../entities/user-profile.entity';

export class CreateProfileDto {
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

  // Note: Files are handled via multipart/form-data, not in JSON body
  // Use 'files' field in form-data for file uploads (profile_picture, profile_background)

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

  // Internal flag to identify which file type is being uploaded when only one file is sent
  @IsOptional()
  upload_profile_background?: string | boolean;
}

