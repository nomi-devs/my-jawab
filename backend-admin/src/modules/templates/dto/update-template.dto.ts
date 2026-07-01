import { CreateTemplateDto } from './create-template.dto';
import {
  IsOptional,
  IsBoolean,
  IsString,
  IsEnum,
  IsObject,
  IsInt,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TemplateType, TemplateCategory } from '../entities/template.entity';

export class UpdateTemplateDto {
  @ApiPropertyOptional({ example: 'Welcome Email' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ example: 'welcome-email' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must contain only lowercase letters, numbers, and hyphens',
  })
  slug?: string;

  @ApiPropertyOptional({ enum: TemplateType })
  @IsOptional()
  @IsEnum(TemplateType)
  type?: TemplateType;

  @ApiPropertyOptional({ enum: TemplateCategory })
  @IsOptional()
  @IsEnum(TemplateCategory)
  category?: TemplateCategory;

  @ApiPropertyOptional({ example: 'Welcome to Jawab!' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  subject?: string;

  @ApiPropertyOptional({ example: 'Hello {{name}}...' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  content?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  text_content?: string;

  @ApiPropertyOptional({ type: Object, example: { name: 'John' } })
  @IsOptional()
  @IsObject()
  variables?: Record<string, any>;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  default_data?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  updated_by?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
