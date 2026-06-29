import { IsOptional, IsInt, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export enum FeedType {
  PERSONALIZED = 'personalized',
  TOPIC = 'topic',
  COMMUNITY = 'community',
  USER = 'user',
  TRENDING = 'trending',
}

export class GetFeedQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsEnum(FeedType)
  feed_type?: FeedType = FeedType.PERSONALIZED;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  topic_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  community_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  user_id?: number;
}

