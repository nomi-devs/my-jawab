import { IsOptional, IsInt, IsDateString, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ListQueryDto } from './list-query.dto';
import { ActiveStatus } from './list-users-query.dto';

export enum ChildrenStatus {
  WITH_CHILDREN = 'with_children',
  WITHOUT_CHILDREN = 'without_children',
}

export class ListTopicsQueryDto extends ListQueryDto {
  @IsOptional()
  @IsEnum(ActiveStatus)
  is_active?: ActiveStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  parent_id?: number;

  @IsOptional()
  @IsEnum(['categories', 'subtopics', 'all'])
  type?: 'categories' | 'subtopics' | 'all';

  @IsOptional()
  @IsEnum(ChildrenStatus)
  has_children?: ChildrenStatus;

  @IsOptional()
  @IsDateString()
  created_from?: string;

  @IsOptional()
  @IsDateString()
  created_to?: string;
}

