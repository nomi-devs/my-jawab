import { IsString, IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SearchType {
  ALL = 'all',
  USERS = 'users',
  POSTS = 'posts',
  COMMUNITIES = 'communities',
  TOPICS = 'topics',
  POLLS = 'polls',
}

export class SearchQueryDto {
  @ApiProperty({ example: 'javascript', description: 'Search query string' })
  @IsString()
  q: string;

  @ApiPropertyOptional({ enum: SearchType, example: 'all' })
  @IsOptional()
  @IsEnum(SearchType)
  type?: SearchType = SearchType.ALL;

  @ApiPropertyOptional({ minimum: 1, maximum: 50, example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @ApiPropertyOptional({ minimum: 1, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;
}
