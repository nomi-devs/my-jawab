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
import { SubscriptionType, SubscriptionDurationType } from '../entities/subscription.entity';

export class UpdateSubscriptionDto {
  @IsOptional()
  @IsEnum(SubscriptionType)
  subscription_type?: SubscriptionType;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  subscription_name?: string;

  @IsOptional()
  @IsString()
  subscription_description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  subscription_price?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => parseInt(value, 10))
  subscription_duration?: number;

  @IsOptional()
  @IsEnum(SubscriptionDurationType)
  subscription_duration_type?: SubscriptionDurationType;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  subscription_currency?: string;

  /**
   * Feature flags and limits for this plan.
   * Use -1 for unlimited on numeric fields.
   */
  @IsOptional()
  @IsObject()
  features?: Record<string, any>;
}

