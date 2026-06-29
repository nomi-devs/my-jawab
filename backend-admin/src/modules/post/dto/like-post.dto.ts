import { IsEnum } from 'class-validator';
import { LikeStatus } from '../entities/post-like.entity';

export class LikePostDto {
  @IsEnum(LikeStatus)
  like_status: LikeStatus;
}

