import { IsString, IsOptional, IsInt, Min, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiPropertyOptional({
    description: 'Post ID to comment on (required if no poll_id)',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ValidateIf((o) => !o.poll_id)
  post_id?: number;

  @ApiPropertyOptional({
    description: 'Poll ID to comment on (required if no post_id)',
    example: 2,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ValidateIf((o) => !o.post_id)
  poll_id?: number;

  @ApiPropertyOptional({
    description: 'Parent comment ID for replies',
    example: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  parent_comment_id?: number | null;

  @ApiProperty({ description: 'Comment text content', example: 'Great post!' })
  @IsString()
  comment_content: string;
}
