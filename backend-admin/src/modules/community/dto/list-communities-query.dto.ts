import { IsOptional, IsInt, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ListQueryDto } from '../../admin/dto/list-query.dto';

export class ListCommunitiesQueryDto extends ListQueryDto {
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  include_member_count?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  include_topic_count?: boolean;
}

