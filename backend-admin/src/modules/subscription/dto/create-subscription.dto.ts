import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsObject,
  MaxLength,
  Min,
  IsDecimal,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  SubscriptionType,
  SubscriptionDurationType,
} from '../entities/subscription.entity';

export class CreateSubscriptionDto {
  @ApiProperty({ enum: SubscriptionType })
  @IsEnum(SubscriptionType)
  subscription_type: SubscriptionType;

  @ApiProperty({ example: 'Pro Plan' })
  @IsString()
  @MaxLength(255)
  subscription_name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subscription_description?: string;

  @ApiProperty({ example: 9.99 })
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  subscription_price: number;

  @ApiProperty({ example: 30 })
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => parseInt(value, 10))
  subscription_duration: number;

  @ApiProperty({ enum: SubscriptionDurationType, example: 'days' })
  @IsEnum(SubscriptionDurationType)
  subscription_duration_type: SubscriptionDurationType;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  subscription_currency?: string;

  /**
   * Feature flags and limits for this plan.
   * Example:
   * {
   *   "can_create_polls": true,
   *   "daily_post_limit": 20,
   *   "ads_enabled": false
   * }
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
