import { IsOptional, IsInt, IsBoolean, Min, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ListQueryDto } from '../../admin/dto/list-query.dto';

export class ListTopicsQueryDto extends ListQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  parent_id?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  include_children?: boolean;

  @IsOptional()
  @IsString()
  @IsIn(['all'])
  data?: string; // 'all' to get all fields, undefined for limited fields (id, parent_id, slug, name, image)
}

