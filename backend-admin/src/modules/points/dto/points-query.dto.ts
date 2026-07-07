import { IsIn, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PointsQueryDto {
  @ApiPropertyOptional({
    enum: ['week', 'month', 'all'],
    default: 'week',
    description: 'Date range for the points graph. The total_points figure is always lifetime, regardless of range.',
  })
  @IsOptional()
  @IsIn(['week', 'month', 'all'])
  range?: 'week' | 'month' | 'all';
}
