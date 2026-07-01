import { IsOptional, IsInt, IsBoolean, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ListQueryDto } from '../../admin/dto/list-query.dto';
import { PollStatus } from '../entities/user-poll.entity';

export class ListPollsQueryDto extends ListQueryDto {
  @ApiPropertyOptional({ description: 'Filter polls by user ID', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  user_id?: number;

  @ApiPropertyOptional({
    description: 'Filter polls by community ID',
    example: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  community_id?: number;

  @ApiPropertyOptional({
    enum: PollStatus,
    description: 'Filter by poll status',
    example: 'published',
  })
  @IsOptional()
  @IsEnum(PollStatus)
  poll_status?: PollStatus;

  @ApiPropertyOptional({
    description: 'Filter to featured polls only',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_featured?: boolean;

  @ApiPropertyOptional({
    description: 'Include poll author user object in response',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  include_user?: boolean;

  @ApiPropertyOptional({
    description: 'Include poll options in response',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  include_options?: boolean;

  @ApiPropertyOptional({
    description: "Include the current user's vote in response",
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  include_user_vote?: boolean;
}
