import { IsOptional, IsEnum, IsDateString } from 'class-validator';

export class UserGrowthQueryDto {
  @IsOptional()
  @IsEnum(['week', 'month', 'year', 'all'])
  time_range?: 'week' | 'month' | 'year' | 'all';

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;
}
