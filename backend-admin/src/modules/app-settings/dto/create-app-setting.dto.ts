import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAppSettingDto {
  @ApiProperty({ example: 'site_name' })
  @IsString()
  @IsNotEmpty()
  setting_key: string;

  @ApiPropertyOptional({ example: 'Jawab' })
  @IsString()
  @IsOptional()
  setting_value?: string;

  @ApiPropertyOptional({ example: 'general' })
  @IsString()
  @IsOptional()
  setting_group?: string;
}
