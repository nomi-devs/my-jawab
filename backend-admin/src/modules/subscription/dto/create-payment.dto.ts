import {
  IsInt,
  IsEnum,
  IsNumber,
  IsString,
  Min,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentStatus, PaymentMethod } from '@prisma/client';

export class CreatePaymentDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value, 10))
  users_subscriptions_id: number;

  @ApiProperty({ example: 9.99 })
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  payment_amount: number;

  @ApiProperty({ enum: PaymentStatus })
  @IsEnum(PaymentStatus)
  payment_status: PaymentStatus;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  payment_method: PaymentMethod;

  @ApiProperty({ example: 'USD' })
  @IsString()
  @MaxLength(10)
  payment_currency: string;

  @ApiProperty({ example: 'stripe' })
  @IsString()
  @MaxLength(255)
  payment_gateway: string;

  @ApiProperty({ example: 'txn_abc123' })
  @IsString()
  @MaxLength(255)
  payment_transaction_id: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  currency_id?: number;
}
