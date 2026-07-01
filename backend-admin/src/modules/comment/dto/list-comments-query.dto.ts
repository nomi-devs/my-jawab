import { IsOptional, IsInt, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ListQueryDto } from '../../admin/dto/list-query.dto';

export class ListCommentsQueryDto extends ListQueryDto {
  @ApiPropertyOptional({ description: 'Filter by post ID', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  post_id?: number;

  @ApiPropertyOptional({ description: 'Filter by poll ID', example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  poll_id?: number;

  @ApiPropertyOptional({ description: 'Filter by user ID', example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  user_id?: number;

  @ApiPropertyOptional({
    description: 'Filter by parent comment ID (replies)',
    example: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  parent_comment_id?: number | null;

  @ApiPropertyOptional({
    description: 'Filter by approval status',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_approved?: boolean;

  @ApiPropertyOptional({
    description: 'Include user details in response',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  include_user?: boolean;

  @ApiPropertyOptional({
    description: 'Include post details in response',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  include_post?: boolean;

  @ApiPropertyOptional({
    description: 'Include poll details in response',
    example: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  include_poll?: boolean;
}
