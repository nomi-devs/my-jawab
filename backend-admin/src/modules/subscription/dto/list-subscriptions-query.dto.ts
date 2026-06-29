import { IsOptional, IsEnum } from 'class-validator';
import { ListQueryDto } from '../../admin/dto/list-query.dto';
import { SubscriptionType } from '../entities/subscription.entity';
import { ActiveStatus } from '../../admin/dto/list-users-query.dto';

export class ListSubscriptionsQueryDto extends ListQueryDto {
  @IsOptional()
  @IsEnum(SubscriptionType)
  subscription_type?: SubscriptionType;

  @IsOptional()
  @IsEnum(ActiveStatus)
  is_active?: ActiveStatus;
}

