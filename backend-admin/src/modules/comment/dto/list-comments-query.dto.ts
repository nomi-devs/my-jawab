import { IsOptional, IsInt, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ListQueryDto } from '../../admin/dto/list-query.dto';

export class ListCommentsQueryDto extends ListQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  post_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  poll_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  user_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  parent_comment_id?: number | null;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_approved?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  include_user?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  include_post?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  include_poll?: boolean;
}

