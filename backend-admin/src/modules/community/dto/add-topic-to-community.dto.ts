import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AddTopicToCommunityDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  topic_id: number;
}

