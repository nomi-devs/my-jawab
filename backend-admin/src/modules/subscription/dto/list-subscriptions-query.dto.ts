import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ListQueryDto } from '../../admin/dto/list-query.dto';
import { SubscriptionType } from '../entities/subscription.entity';
import { ActiveStatus } from '../../admin/dto/list-users-query.dto';

export class ListSubscriptionsQueryDto extends ListQueryDto {
  @ApiPropertyOptional({ enum: SubscriptionType })
  @IsOptional()
  @IsEnum(SubscriptionType)
  subscription_type?: SubscriptionType;

  @ApiPropertyOptional({ enum: ActiveStatus })
  @IsOptional()
  @IsEnum(ActiveStatus)
  is_active?: ActiveStatus;
}
