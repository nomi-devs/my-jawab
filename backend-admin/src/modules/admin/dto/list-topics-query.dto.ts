import { IsOptional, IsInt, IsDateString, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ListQueryDto } from './list-query.dto';
import { ActiveStatus } from './list-users-query.dto';

export enum ChildrenStatus {
  WITH_CHILDREN = 'with_children',
  WITHOUT_CHILDREN = 'without_children',
}

export class ListTopicsQueryDto extends ListQueryDto {
  @ApiPropertyOptional({ enum: ActiveStatus, example: 'active' })
  @IsOptional()
  @IsEnum(ActiveStatus)
  is_active?: ActiveStatus;

  @ApiPropertyOptional({
    example: 0,
    description: 'Parent topic ID (0 for root topics)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  parent_id?: number;

  @ApiPropertyOptional({
    enum: ['categories', 'subtopics', 'all'],
    example: 'all',
  })
  @IsOptional()
  @IsEnum(['categories', 'subtopics', 'all'])
  type?: 'categories' | 'subtopics' | 'all';

  @ApiPropertyOptional({ enum: ChildrenStatus, example: 'with_children' })
  @IsOptional()
  @IsEnum(ChildrenStatus)
  has_children?: ChildrenStatus;

  @ApiPropertyOptional({ example: '2025-01-01' })
  @IsOptional()
  @IsDateString()
  created_from?: string;

  @ApiPropertyOptional({ example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  created_to?: string;
}
