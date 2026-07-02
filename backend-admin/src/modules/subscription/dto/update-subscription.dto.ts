import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsObject,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SubscriptionType, SubscriptionDurationType } from '@prisma/client';

export class UpdateSubscriptionDto {
  @ApiPropertyOptional({ enum: SubscriptionType })
  @IsOptional()
  @IsEnum(SubscriptionType)
  subscription_type?: SubscriptionType;

  @ApiPropertyOptional({ example: 'Pro Plan' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  subscription_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subscription_description?: string;

  @ApiPropertyOptional({ example: 9.99 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  subscription_price?: number;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => parseInt(value, 10))
  subscription_duration?: number;

  @ApiPropertyOptional({ enum: SubscriptionDurationType, example: 'days' })
  @IsOptional()
  @IsEnum(SubscriptionDurationType)
  subscription_duration_type?: SubscriptionDurationType;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  subscription_currency?: string;

  /**
   * Feature flags and limits for this plan.
   * Use -1 for unlimited on numeric fields.
   */
  @ApiPropertyOptional({
    type: Object,
    example: { can_create_polls: true, daily_post_limit: 20 },
  })
  @IsOptional()
  @IsObject()
  features?: Record<string, any>;
}
