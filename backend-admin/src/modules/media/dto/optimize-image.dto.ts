import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class OptimizeImageDto {
  @ApiPropertyOptional({ example: 800 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5000)
  width?: number;

  @ApiPropertyOptional({ example: 800 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5000)
  height?: number;

  @ApiPropertyOptional({ default: 80, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  quality?: number = 80;

  @ApiPropertyOptional({ enum: ['jpeg', 'png', 'webp', 'avif'] })
  @IsOptional()
  format?: 'jpeg' | 'png' | 'webp' | 'avif';
}
