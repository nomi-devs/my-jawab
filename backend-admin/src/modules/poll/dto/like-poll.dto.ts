import { IsEnum } from 'class-validator';
import { LikeStatus } from '../entities/poll-like.entity';

export class LikePollDto {
  @IsEnum(LikeStatus)
  like_status: LikeStatus;
}

