import { IsOptional, IsEnum, IsInt, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';
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
  @IsOptional()
  @IsEnum(ApprovedStatus)
  is_approved?: ApprovedStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  post_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  user_id?: number;

  @IsOptional()
  @IsEnum(RepliesStatus)
  has_replies?: RepliesStatus;

  @IsOptional()
  @IsDateString()
  created_from?: string;

  @IsOptional()
  @IsDateString()
  created_to?: string;
}

