import {
  IsString,
  IsObject,
  IsOptional,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GeneratePdfDto {
  @ApiProperty({ example: 'welcome-email' })
  @IsString()
  templateSlug: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  filename?: string;

  @ApiPropertyOptional({ enum: ['A4', 'Letter', 'Legal'] })
  @IsOptional()
  @IsEnum(['A4', 'Letter', 'Legal'])
  format?: 'A4' | 'Letter' | 'Legal';

  @ApiPropertyOptional({ enum: ['portrait', 'landscape'] })
  @IsOptional()
  @IsEnum(['portrait', 'landscape'])
  orientation?: 'portrait' | 'landscape';

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  displayHeaderFooter?: boolean;
}
