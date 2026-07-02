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
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BannerType } from '@prisma/client';
import { ActiveStatus } from '../../admin/dto/list-users-query.dto';

export class UpdateBannerDto {
  @ApiPropertyOptional({ example: 'Summer Sale' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  banner_title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  banner_description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/banner.png' })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  banner_image?: string;

  @ApiPropertyOptional({ example: 'https://example.com' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  banner_link?: string;

  @ApiPropertyOptional({ enum: BannerType })
  @IsOptional()
  @IsEnum(BannerType)
  banner_type?: BannerType;

  @ApiPropertyOptional({ example: 'PK,US' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  target_countries?: string;

  @ApiPropertyOptional({ example: '1,2,3' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  target_topic_ids?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  target_subscription_ids?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  excluded_countries?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  excluded_topic_ids?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  excluded_subscription_ids?: string;

  @ApiPropertyOptional({ example: '2025-01-01' })
  @IsOptional()
  @IsDateString()
  valid_from?: string;

  @ApiPropertyOptional({ example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  valid_until?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  display_order?: number;

  @ApiPropertyOptional({ enum: ['active', 'inactive'] })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'active' || value === ActiveStatus.ACTIVE)
      return ActiveStatus.ACTIVE;
    if (value === 'inactive' || value === ActiveStatus.INACTIVE)
      return ActiveStatus.INACTIVE;
    return value;
  })
  @IsEnum(ActiveStatus)
  is_active?: ActiveStatus;
}
