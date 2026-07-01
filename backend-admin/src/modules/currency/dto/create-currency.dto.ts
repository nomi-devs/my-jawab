import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCurrencyDto {
  @ApiProperty({ example: 'US Dollar' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  currency_name: string;

  @ApiProperty({ example: 'USD' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  currency_code: string;

  @ApiProperty({ example: '$' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  currency_symbol: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
