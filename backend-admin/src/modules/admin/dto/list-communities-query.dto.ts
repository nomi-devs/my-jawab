import { IsOptional, IsEnum, IsInt, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ListQueryDto } from './list-query.dto';
import { ActiveStatus } from './list-users-query.dto';

export class ListCommunitiesQueryDto extends ListQueryDto {
  @IsOptional()
  @IsEnum(ActiveStatus)
  is_active?: ActiveStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  category_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  min_members?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  max_members?: number;

  @IsOptional()
  @IsDateString()
  created_from?: string;

  @IsOptional()
  @IsDateString()
  created_to?: string;
}

