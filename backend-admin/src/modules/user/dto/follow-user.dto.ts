import { IsNotEmpty, IsInt } from 'class-validator';

export class FollowUserDto {
  @IsNotEmpty()
  @IsInt()
  user_id: number;
}

