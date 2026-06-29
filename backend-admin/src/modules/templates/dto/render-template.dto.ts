import { IsString, IsObject, IsOptional } from 'class-validator';

export class RenderTemplateDto {
  @IsString()
  slug: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, any>;
}

export class RenderTemplateByIdDto {
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;
}
