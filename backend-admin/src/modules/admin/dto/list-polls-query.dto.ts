import { IsOptional, IsEnum, IsIn, IsBoolean, IsInt, IsDateString, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ListQueryDto } from './list-query.dto';
import { PollStatus } from '../../poll/entities/user-poll.entity';

export class ListPollsQueryDto extends ListQueryDto {
  @IsOptional()
  @IsIn([PollStatus.DRAFT, PollStatus.PUBLISHED, PollStatus.ENDED, 'all', 'active'], {
    message: 'poll_status must be one of the following values: draft, published, ended'
  })
  poll_status?: PollStatus | 'all' | 'active';

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @Type(() => Boolean)
  @IsBoolean()
  is_featured?: boolean;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @Type(() => Boolean)
  @IsBoolean()
  is_expired?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  user_id?: number;

  @IsOptional()
  @IsDateString()
  expires_from?: string;

  @IsOptional()
  @IsDateString()
  expires_to?: string;

  @IsOptional()
  @IsDateString()
  created_from?: string;

  @IsOptional()
  @IsDateString()
  created_to?: string;
}

