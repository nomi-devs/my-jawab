import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LikeStatus } from '../entities/post-like.entity';

export class LikePostDto {
  @ApiProperty({ enum: LikeStatus, example: LikeStatus.LIKE })
  @IsEnum(LikeStatus)
  like_status: LikeStatus;
}
