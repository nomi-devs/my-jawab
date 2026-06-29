import {
  IsInt,
  IsEnum,
  IsNumber,
  IsString,
  IsOptional,
  IsDateString,
  Min,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { SubscriptionRenewalType } from '../entities/user-subscription.entity';

export class CreateUserSubscriptionDto {
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value, 10))
  subscription_id: number;

  @IsOptional()
  @IsDateString()
  subscription_start_date?: string;

  @IsOptional()
  @IsDateString()
  subscription_end_date?: string;

  @IsEnum(SubscriptionRenewalType)
  subscription_renewal_type: SubscriptionRenewalType;

  @IsOptional()
  @IsDateString()
  subscription_renewal_date?: string;

  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  subscription_renewal_amount: number;

  @IsString()
  @MaxLength(10)
  subscription_renewal_currency: string;

  @IsString()
  @MaxLength(255)
  subscription_renewal_gateway: string;
}

