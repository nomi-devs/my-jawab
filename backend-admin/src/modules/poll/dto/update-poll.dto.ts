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
import { PollStatus } from '../entities/user-poll.entity';

export class UpdatePollDto {
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  community_ids?: number[];

  @IsOptional()
  @IsString()
  @MaxLength(255)
  poll_slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  poll_title?: string;

  @IsOptional()
  @IsString()
  poll_description?: string;

  @IsOptional()
  @ValidateIf((o) => o.poll_expires_at !== null && o.poll_expires_at !== '')
  @IsDateString({}, { message: 'poll_expires_at must be a valid date string or empty to clear expiration' })
  @Transform(({ value }) => {
    // Allow null or empty string to clear expiration
    if (value === null || value === '' || value === undefined) {
      return null;
    }
    return value;
  })
  poll_expires_at?: string | null;

  @IsOptional()
  @IsEnum(PollStatus)
  poll_status?: PollStatus;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === true || value === 'true') return 'featured';
    if (value === false || value === 'false') return 'not_featured';
    return value;
  })
  @IsEnum(['featured', 'not_featured'])
  is_featured?: 'featured' | 'not_featured';

  @IsOptional()
  @Type(() => Number)
  poll_winner_option_id?: number | null;

  @IsOptional()
  @IsArray()
  @Type(() => UpdatePollOptionDto)
  options?: UpdatePollOptionDto[];
}

export class UpdatePollOptionDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  id?: number;

  @IsString()
  @MaxLength(255)
  option_text: string;

  @IsOptional()
  @IsInt()
  display_order?: number;
}

