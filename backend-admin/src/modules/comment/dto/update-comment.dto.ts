import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCommentDto {
  @ApiPropertyOptional({ example: 'Updated comment text' })
  @IsOptional()
  @IsString()
  comment_content?: string;

  @ApiPropertyOptional({
    description: 'Approval status (admin use)',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  is_approved?: boolean;
}
