import { IsOptional, IsString, IsEnum, Length } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BannerType } from '@prisma/client';

/**
 * Query DTO for the public banner endpoint.
 * Mobile client provides user context so backend can filter banners by targeting conditions.
 */
export class GetBannersQueryDto {
  @ApiPropertyOptional({ example: 'PK' })
  @IsOptional()
  @IsString()
  @Length(2, 5)
  country?: string; // ISO country code (e.g. "US", "PK")

  @ApiPropertyOptional({ enum: BannerType })
  @IsOptional()
  @IsEnum(BannerType)
  banner_type?: BannerType;
}
