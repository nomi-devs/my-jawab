import { IsEnum } from 'class-validator';
import { LikeStatus } from '../entities/comment-like.entity';

export class LikeCommentDto {
  @IsEnum(LikeStatus)
  like_status: LikeStatus;
}

