import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LikeStatus } from '@prisma/client';

export class LikePostDto {
  @ApiProperty({ enum: LikeStatus, example: LikeStatus.like })
  @IsEnum(LikeStatus)
  like_status: LikeStatus;
}
