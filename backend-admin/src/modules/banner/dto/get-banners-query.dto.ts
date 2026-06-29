import { IsOptional, IsString, IsEnum, Length } from 'class-validator';
import { Type } from 'class-transformer';
import { BannerType } from '../entities/banner.entity';

/**
 * Query DTO for the public banner endpoint.
 * Mobile client provides user context so backend can filter banners by targeting conditions.
 */
export class GetBannersQueryDto {
  @IsOptional()
  @IsString()
  @Length(2, 5)
  country?: string; // ISO country code (e.g. "US", "PK")

  @IsOptional()
  @IsEnum(BannerType)
  banner_type?: BannerType;
}
