import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAppSettingDto {
  @ApiPropertyOptional({ example: 'site_name' })
  @IsString()
  @IsOptional()
  setting_key?: string;

  @ApiPropertyOptional({ example: 'Jawab' })
  @IsString()
  @IsOptional()
  setting_value?: string;

  @ApiPropertyOptional({ example: 'general' })
  @IsString()
  @IsOptional()
  setting_group?: string;
}
