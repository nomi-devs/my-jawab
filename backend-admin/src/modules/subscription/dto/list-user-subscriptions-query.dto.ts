import { IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ListQueryDto } from '../../admin/dto/list-query.dto';
import { SubscriptionStatus } from '../entities/user-subscription.entity';
import { ActiveStatus } from '../../admin/dto/list-users-query.dto';

export class ListUserSubscriptionsQueryDto extends ListQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  user_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  subscription_id?: number;

  @IsOptional()
  @IsEnum(SubscriptionStatus)
  subscription_status?: SubscriptionStatus;

  @IsOptional()
  @IsEnum(ActiveStatus)
  is_active?: ActiveStatus;
}

