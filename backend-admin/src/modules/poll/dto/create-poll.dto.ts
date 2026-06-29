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
import { PollStatus } from '../entities/user-poll.entity';

export class CreatePollOptionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  option_text: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  display_order?: number;
}

export class CreatePollDto {
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  community_ids?: number[];

  @IsString()
  @MaxLength(255)
  poll_slug: string;

  @IsString()
  @MaxLength(255)
  poll_title: string;

  @IsString()
  poll_description: string;

  @IsOptional()
  @IsDateString()
  poll_expires_at?: string;

  @IsOptional()
  poll_status?: PollStatus;

  @IsArray()
  @ArrayMinSize(2, { message: 'Poll must have at least 2 options' })
  @Type(() => CreatePollOptionDto)
  options: CreatePollOptionDto[];

  @IsOptional()
  @Transform(({ value }) => {
    if (value === true || value === 'true') return 'featured';
    if (value === false || value === 'false') return 'not_featured';
    return value;
  })
  @IsEnum(['featured', 'not_featured'])
  is_featured?: 'featured' | 'not_featured';
}

