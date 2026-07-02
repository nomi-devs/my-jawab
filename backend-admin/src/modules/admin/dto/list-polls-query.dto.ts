import {
  IsOptional,
  IsEnum,
  IsIn,
  IsBoolean,
  IsInt,
  IsDateString,
  Min,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ListQueryDto } from './list-query.dto';
import { PollStatus } from '@prisma/client';

export class ListPollsQueryDto extends ListQueryDto {
  @ApiPropertyOptional({
    enum: [...Object.values(PollStatus), 'all', 'active'],
    example: 'published',
  })
  @IsOptional()
  @IsIn(
    [PollStatus.draft, PollStatus.published, PollStatus.ended, 'all', 'active'],
    {
      message:
        'poll_status must be one of the following values: draft, published, ended',
    },
  )
  poll_status?: PollStatus | 'all' | 'active';

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @Type(() => Boolean)
  @IsBoolean()
  is_featured?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @Type(() => Boolean)
  @IsBoolean()
  is_expired?: boolean;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  user_id?: number;

  @ApiPropertyOptional({ example: '2025-01-01' })
  @IsOptional()
  @IsDateString()
  expires_from?: string;

  @ApiPropertyOptional({ example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  expires_to?: string;

  @ApiPropertyOptional({ example: '2025-01-01' })
  @IsOptional()
  @IsDateString()
  created_from?: string;

  @ApiPropertyOptional({ example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  created_to?: string;
}
