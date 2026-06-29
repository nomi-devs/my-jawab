import {
  IsString,
  IsEnum,
  IsOptional,
  IsObject,
  IsBoolean,
  IsInt,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { TemplateType, TemplateCategory } from '../entities/template.entity';

export class CreateTemplateDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must contain only lowercase letters, numbers, and hyphens',
  })
  slug: string;

  @IsEnum(TemplateType)
  type: TemplateType;

  @IsOptional()
  @IsEnum(TemplateCategory)
  category?: TemplateCategory;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  subject?: string;

  @IsString()
  @MinLength(1)
  content: string;

  @IsOptional()
  @IsString()
  text_content?: string;

  @IsOptional()
  @IsObject()
  variables?: Record<string, any>;

  @IsOptional()
  @IsObject()
  default_data?: Record<string, any>;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsOptional()
  @IsInt()
  created_by?: number;
}
