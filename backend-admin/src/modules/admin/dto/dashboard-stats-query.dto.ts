import { IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DashboardStatsQueryDto {
  @ApiPropertyOptional({
    enum: ['week', 'month', 'year', 'all'],
    example: 'month',
  })
  @IsOptional()
  @IsEnum(['week', 'month', 'year', 'all'])
  time_range?: 'week' | 'month' | 'year' | 'all';

  @ApiPropertyOptional({ example: '2025-01-01' })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({ example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  end_date?: string;
}
