import { IsNotEmpty, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FollowUserDto {
  @ApiProperty({ description: 'ID of the user to follow', example: 42 })
  @IsNotEmpty()
  @IsInt()
  user_id: number;
}
