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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubscriptionRenewalType } from '@prisma/client';

export class CreateUserSubscriptionDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value, 10))
  subscription_id: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  subscription_start_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  subscription_end_date?: string;

  @ApiProperty({ enum: SubscriptionRenewalType })
  @IsEnum(SubscriptionRenewalType)
  subscription_renewal_type: SubscriptionRenewalType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  subscription_renewal_date?: string;

  @ApiProperty({ example: 9.99 })
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  subscription_renewal_amount: number;

  @ApiProperty({ example: 'USD' })
  @IsString()
  @MaxLength(10)
  subscription_renewal_currency: string;

  @ApiProperty({ example: 'stripe' })
  @IsString()
  @MaxLength(255)
  subscription_renewal_gateway: string;
}
