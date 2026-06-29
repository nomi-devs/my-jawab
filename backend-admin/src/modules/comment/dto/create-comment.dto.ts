import { IsString, IsOptional, IsInt, Min, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCommentDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ValidateIf((o) => !o.poll_id)
  post_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ValidateIf((o) => !o.post_id)
  poll_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  parent_comment_id?: number | null;

  @IsString()
  comment_content: string;
}

