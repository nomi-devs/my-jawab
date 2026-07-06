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
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProfileGender } from '@prisma/client';

export class UpdateProfileDto {
  @ApiPropertyOptional({ maxLength: 255, example: 'John Doe' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  full_name?: string;

  @ApiPropertyOptional({
    description: 'URL or uploaded via multipart',
    example: 'https://cdn.example.com/pic.jpg',
  })
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

  @ApiPropertyOptional({ example: 'https://cdn.example.com/bg.jpg' })
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

  @ApiPropertyOptional({
    maxLength: 255,
    example: 'Software Engineer | Tech Enthusiast',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  tagline?: string;

  @ApiPropertyOptional({ example: 'A passionate developer from Karachi.' })
  @IsOptional()
  @IsString()
  profile_bio?: string;

  @ApiPropertyOptional({ enum: ProfileGender, example: 'male' })
  @IsOptional()
  @IsEnum(ProfileGender)
  profile_gender?: ProfileGender;

  @ApiPropertyOptional({
    description: 'ISO date string',
    example: '1995-06-15',
  })
  @IsOptional()
  @IsDateString()
  profile_birthday?: string;

  @ApiPropertyOptional({ maxLength: 500, example: 'https://johndoe.dev' })
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

  @ApiPropertyOptional({ maxLength: 255, example: 'Karachi, Pakistan' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  profile_location?: string;

  // Internal flag to identify which file type is being uploaded when only one file is sent
  @ApiPropertyOptional({
    description:
      'Internal flag set to "true" when uploading background via multipart',
  })
  @IsOptional()
  upload_profile_background?: string | boolean;
}
