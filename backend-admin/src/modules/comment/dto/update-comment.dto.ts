import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateCommentDto {
  @IsOptional()
  @IsString()
  comment_content?: string;

  @IsOptional()
  @IsBoolean()
  is_approved?: boolean;
}

