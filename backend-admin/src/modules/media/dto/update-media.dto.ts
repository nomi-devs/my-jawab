import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMediaDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  folder?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_public?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
