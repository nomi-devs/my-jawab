import {
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PollStatus } from '@prisma/client';

export class UpdatePollOptionDto {
  @ApiPropertyOptional({
    description: 'ID of the existing option to update',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  id?: number;

  @ApiPropertyOptional({ maxLength: 255, example: 'Option A' })
  @IsString()
  @MaxLength(255)
  option_text: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  display_order?: number;
}

export class UpdatePollDto {
  @ApiPropertyOptional({ type: [Number], example: [1, 2] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  community_ids?: number[];

  @ApiPropertyOptional({ maxLength: 255, example: 'favorite-color-poll' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  poll_slug?: string;

  @ApiPropertyOptional({
    maxLength: 255,
    example: 'What is your favorite color?',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  poll_title?: string;

  @ApiPropertyOptional({
    example: 'Choose your favorite color from the options below.',
  })
  @IsOptional()
  @IsString()
  poll_description?: string;

  @ApiPropertyOptional({
    description:
      'ISO date string for poll expiry. Send null or empty string to clear expiration.',
    example: '2025-12-31T23:59:59Z',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((o) => o.poll_expires_at !== null && o.poll_expires_at !== '')
  @IsDateString(
    {},
    {
      message:
        'poll_expires_at must be a valid date string or empty to clear expiration',
    },
  )
  @Transform(({ value }) => {
    // Allow null or empty string to clear expiration
    if (value === null || value === '' || value === undefined) {
      return null;
    }
    return value;
  })
  poll_expires_at?: string | null;

  @ApiPropertyOptional({ enum: PollStatus, example: 'published' })
  @IsOptional()
  @IsEnum(PollStatus)
  poll_status?: PollStatus;

  @ApiPropertyOptional({
    enum: ['featured', 'not_featured'],
    example: 'not_featured',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === true || value === 'true') return 'featured';
    if (value === false || value === 'false') return 'not_featured';
    return value;
  })
  @IsEnum(['featured', 'not_featured'])
  is_featured?: 'featured' | 'not_featured';

  @ApiPropertyOptional({
    description: 'ID of the winning option, or null to clear',
    example: 2,
    nullable: true,
  })
  @IsOptional()
  @Type(() => Number)
  poll_winner_option_id?: number | null;

  @ApiPropertyOptional({
    type: [UpdatePollOptionDto],
    description: 'Options to update or add',
  })
  @IsOptional()
  @IsArray()
  @Type(() => UpdatePollOptionDto)
  options?: UpdatePollOptionDto[];
}
