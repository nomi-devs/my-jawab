import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsUrl,
  MaxLength,
  IsDateString,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { BannerType } from '../entities/banner.entity';
import { ActiveStatus } from '../../admin/dto/list-users-query.dto';

export class UpdateBannerDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  banner_title?: string;

  @IsOptional()
  @IsString()
  banner_description?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  banner_image?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  banner_link?: string;

  @IsOptional()
  @IsEnum(BannerType)
  banner_type?: BannerType;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  target_countries?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  target_topic_ids?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  target_subscription_ids?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  excluded_countries?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  excluded_topic_ids?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  excluded_subscription_ids?: string;

  @IsOptional()
  @IsDateString()
  valid_from?: string;

  @IsOptional()
  @IsDateString()
  valid_until?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  display_order?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'active' || value === ActiveStatus.ACTIVE) return ActiveStatus.ACTIVE;
    if (value === 'inactive' || value === ActiveStatus.INACTIVE) return ActiveStatus.INACTIVE;
    return value;
  })
  @IsEnum(ActiveStatus)
  is_active?: ActiveStatus;
}
