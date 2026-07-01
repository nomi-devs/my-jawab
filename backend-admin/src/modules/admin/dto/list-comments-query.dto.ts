import { IsOptional, IsEnum, IsInt, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ListQueryDto } from './list-query.dto';

export enum ApprovedStatus {
  APPROVED = 'approved',
  NOT_APPROVED = 'not_approved',
}

export enum RepliesStatus {
  WITH_REPLIES = 'with_replies',
  WITHOUT_REPLIES = 'without_replies',
}

export class ListCommentsQueryDto extends ListQueryDto {
  @ApiPropertyOptional({ enum: ApprovedStatus, example: 'approved' })
  @IsOptional()
  @IsEnum(ApprovedStatus)
  is_approved?: ApprovedStatus;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  post_id?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  user_id?: number;

  @ApiPropertyOptional({ enum: RepliesStatus, example: 'with_replies' })
  @IsOptional()
  @IsEnum(RepliesStatus)
  has_replies?: RepliesStatus;

  @ApiPropertyOptional({ example: '2025-01-01' })
  @IsOptional()
  @IsDateString()
  created_from?: string;

  @ApiPropertyOptional({ example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  created_to?: string;
}
