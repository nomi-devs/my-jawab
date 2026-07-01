import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class VotePollDto {
  @ApiProperty({ description: 'ID of the poll option to vote for', example: 3 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  vote_option_id: number;
}
