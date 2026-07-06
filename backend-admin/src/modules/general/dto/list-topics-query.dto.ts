import {
  IsOptional,
  IsInt,
  IsBoolean,
  Min,
  IsString,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ListQueryDto } from '../../admin/dto/list-query.dto';

export class ListTopicsQueryDto extends ListQueryDto {
  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  parent_id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  include_children?: boolean;

  @ApiPropertyOptional({
    description: 'Filter to admin-curated trending topics only.',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_trending?: boolean;

  @ApiPropertyOptional({ enum: ['all'] })
  @IsOptional()
  @IsString()
  @IsIn(['all'])
  data?: string; // 'all' to get all fields, undefined for limited fields (id, parent_id, slug, name, image)
}
