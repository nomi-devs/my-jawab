import { IsString, IsOptional, MaxLength, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCurrencyDto {
  @ApiPropertyOptional({ example: 'US Dollar' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  currency_name?: string;

  @ApiPropertyOptional({ example: 'USD' })
  @IsString()
  @IsOptional()
  @MaxLength(10)
  currency_code?: string;

  @ApiPropertyOptional({ example: '$' })
  @IsString()
  @IsOptional()
  @MaxLength(10)
  currency_symbol?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
