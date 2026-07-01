import { IsOptional, IsInt, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ListQueryDto } from '../../admin/dto/list-query.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListCommunitiesQueryDto extends ListQueryDto {
  @ApiPropertyOptional({ example: 1, description: 'Page number', minimum: 1 })
  declare page?: number;

  @ApiPropertyOptional({
    example: 10,
    description: 'Items per page',
    minimum: 1,
    maximum: 100,
  })
  declare limit?: number;

  @ApiPropertyOptional({ example: 'tech', description: 'Search term' })
  declare search?: string;

  @ApiPropertyOptional({
    example: 'created_at',
    description: 'Field to sort by',
  })
  declare sort_by?: string;

  @ApiPropertyOptional({
    enum: ['ASC', 'DESC'],
    example: 'DESC',
    description: 'Sort direction',
  })
  declare sort_order?: 'ASC' | 'DESC';

  @ApiPropertyOptional({
    example: true,
    description: 'Filter by active status',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Include member count in response',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  include_member_count?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Include topic count in response',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  include_topic_count?: boolean;
}
