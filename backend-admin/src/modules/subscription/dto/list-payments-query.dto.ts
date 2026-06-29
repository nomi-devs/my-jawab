import { IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ListQueryDto } from '../../admin/dto/list-query.dto';
import { PaymentStatus, PaymentMethod } from '../entities/payment.entity';

export class ListPaymentsQueryDto extends ListQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  user_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  users_subscriptions_id?: number;

  @IsOptional()
  @IsEnum(PaymentStatus)
  payment_status?: PaymentStatus;

  @IsOptional()
  @IsEnum(PaymentMethod)
  payment_method?: PaymentMethod;
}

