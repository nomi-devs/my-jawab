import { IsNotEmpty, IsInt, IsArray, ValidateIf, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class SubscribeTopicDto {
  // Support single topic_id for backward compatibility
  @ValidateIf((o) => !o.topic_ids || o.topic_ids.length === 0)
  @IsNotEmpty({ message: 'Either topic_id or topic_ids must be provided' })
  @IsInt({ message: 'topic_id must be an integer' })
  @Type(() => Number)
  topic_id?: number;

  // Support multiple topic_ids
  @ValidateIf((o) => !o.topic_id)
  @IsNotEmpty({ message: 'Either topic_id or topic_ids must be provided' })
  @IsArray({ message: 'topic_ids must be an array' })
  @ArrayMinSize(1, { message: 'topic_ids must contain at least one topic ID' })
  @IsInt({ each: true, message: 'Each topic_id in topic_ids must be an integer' })
  @Type(() => Number)
  topic_ids?: number[];
}

