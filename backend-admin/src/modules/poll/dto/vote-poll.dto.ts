import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class VotePollDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  vote_option_id: number;
}

