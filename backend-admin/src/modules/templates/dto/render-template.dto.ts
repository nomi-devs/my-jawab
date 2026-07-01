import { IsString, IsObject, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RenderTemplateDto {
  @ApiProperty({ example: 'welcome-email' })
  @IsString()
  slug: string;

  @ApiPropertyOptional({ type: Object, example: { name: 'John' } })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;
}

export class RenderTemplateByIdDto {
  @ApiPropertyOptional({ type: Object, example: { name: 'John' } })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;
}
