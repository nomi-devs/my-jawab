import { IsString, IsObject, IsOptional, IsEnum, IsBoolean } from 'class-validator';

export class GeneratePdfDto {
  @IsString()
  templateSlug: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @IsOptional()
  @IsString()
  filename?: string;

  @IsOptional()
  @IsEnum(['A4', 'Letter', 'Legal'])
  format?: 'A4' | 'Letter' | 'Legal';

  @IsOptional()
  @IsEnum(['portrait', 'landscape'])
  orientation?: 'portrait' | 'landscape';

  @IsOptional()
  @IsBoolean()
  displayHeaderFooter?: boolean;
}
