import {
  IsOptional,
  IsInt,
  IsBoolean,
  Min,
  IsString,
  IsIn,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ListQueryDto } from '../../admin/dto/list-query.dto';

const toBoolean = ({ value }: { value: unknown }) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
};

export class ListTopicsQueryDto extends ListQueryDto {
  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  parent_id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toBoolean)
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
  @Transform(toBoolean)
  @IsBoolean()
  is_trending?: boolean;

  @ApiPropertyOptional({ enum: ['all'] })
  @IsOptional()
  @IsString()
  @IsIn(['all'])
  data?: string; // 'all' to get all fields, undefined for limited fields (id, parent_id, slug, name, image)
}
