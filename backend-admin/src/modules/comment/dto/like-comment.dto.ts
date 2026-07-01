import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LikeStatus } from '../entities/comment-like.entity';

export class LikeCommentDto {
  @ApiProperty({ enum: LikeStatus, example: 'like' })
  @IsEnum(LikeStatus)
  like_status: LikeStatus;
}
