import { ApiProperty } from '@nestjs/swagger';

export class PointsSeriesPointDto {
  @ApiProperty({ example: '2026-07-01' })
  date: string;

  @ApiProperty({ example: 15 })
  points: number;
}

export class PointsHistoryDto {
  @ApiProperty({ example: 122, description: 'Questions asked (post_type = question)' })
  questions: number;

  @ApiProperty({ example: 56, description: 'Polls created' })
  polls: number;

  @ApiProperty({ example: 335, description: 'Answers given (comments on posts + polls)' })
  answers: number;
}

export class PointsSummaryDto {
  @ApiProperty({ example: 540, description: 'Lifetime total points' })
  total_points: number;

  @ApiProperty({ enum: ['week', 'month', 'all'] })
  range: string;

  @ApiProperty({ example: 45, description: 'Points earned within the selected range' })
  range_total: number;

  @ApiProperty({ type: () => [PointsSeriesPointDto] })
  series: PointsSeriesPointDto[];

  @ApiProperty({ type: () => PointsHistoryDto })
  history: PointsHistoryDto;
}
