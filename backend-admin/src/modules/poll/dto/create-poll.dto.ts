import {
  IsString,
  IsOptional,
  IsInt,
  IsArray,
  IsBoolean,
  IsDateString,
  MaxLength,
  MinLength,
  ArrayMinSize,
  IsEnum,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PollStatus } from '@prisma/client';

export class CreatePollOptionDto {
  @ApiProperty({ minLength: 1, maxLength: 255, example: 'Option A' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  option_text: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  display_order?: number;
}

export class CreatePollDto {
  @ApiPropertyOptional({ type: [Number], example: [1, 2] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  community_ids?: number[];

  @ApiProperty({ maxLength: 255, example: 'favorite-color-poll' })
  @IsString()
  @MaxLength(255)
  poll_slug: string;

  @ApiProperty({ maxLength: 255, example: 'What is your favorite color?' })
  @IsString()
  @MaxLength(255)
  poll_title: string;

  @ApiProperty({
    example: 'Choose your favorite color from the options below.',
  })
  @IsString()
  poll_description: string;

  @ApiPropertyOptional({
    description: 'ISO date string for poll expiry',
    example: '2025-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  poll_expires_at?: string;

  @ApiPropertyOptional({ enum: PollStatus, example: 'published' })
  @IsOptional()
  poll_status?: PollStatus;

  @ApiProperty({
    type: [CreatePollOptionDto],
    description: 'At least 2 options required',
  })
  @IsArray()
  @ArrayMinSize(2, { message: 'Poll must have at least 2 options' })
  @Type(() => CreatePollOptionDto)
  options: CreatePollOptionDto[];

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
}
