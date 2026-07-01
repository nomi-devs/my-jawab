import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LikeStatus } from '../entities/poll-like.entity';

export class LikePollDto {
  @ApiProperty({ enum: ['like', 'dislike'], example: 'like' })
  @IsEnum(LikeStatus)
  like_status: LikeStatus;
}
