import { IsOptional, IsInt, IsBoolean, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ListQueryDto } from '../../admin/dto/list-query.dto';
import { PollStatus } from '../entities/user-poll.entity';

export class ListPollsQueryDto extends ListQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  user_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  community_id?: number;

  @IsOptional()
  @IsEnum(PollStatus)
  poll_status?: PollStatus;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_featured?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  include_user?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  include_options?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  include_user_vote?: boolean;
}

