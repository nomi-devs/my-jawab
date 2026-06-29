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
import { SubscriptionType, SubscriptionDurationType } from '../entities/subscription.entity';

export class CreateSubscriptionDto {
  @IsEnum(SubscriptionType)
  subscription_type: SubscriptionType;

  @IsString()
  @MaxLength(255)
  subscription_name: string;

  @IsOptional()
  @IsString()
  subscription_description?: string;

  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  subscription_price: number;

  @IsNumber()
  @Min(1)
  @Transform(({ value }) => parseInt(value, 10))
  subscription_duration: number;

  @IsEnum(SubscriptionDurationType)
  subscription_duration_type: SubscriptionDurationType;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  is_active?: boolean;

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
  @IsOptional()
  @IsObject()
  features?: Record<string, any>;
}

