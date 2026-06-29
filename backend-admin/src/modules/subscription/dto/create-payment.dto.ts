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
import { PaymentStatus, PaymentMethod } from '../entities/payment.entity';

export class CreatePaymentDto {
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value, 10))
  users_subscriptions_id: number;

  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  payment_amount: number;

  @IsEnum(PaymentStatus)
  payment_status: PaymentStatus;

  @IsEnum(PaymentMethod)
  payment_method: PaymentMethod;

  @IsString()
  @MaxLength(10)
  payment_currency: string;

  @IsString()
  @MaxLength(255)
  payment_gateway: string;

  @IsString()
  @MaxLength(255)
  payment_transaction_id: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  currency_id?: number;
}

