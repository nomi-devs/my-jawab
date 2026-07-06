import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RequireEmailOrPhone } from './validators/class-validators';

export class VerifyDto {
  @ApiPropertyOptional({
    description: 'User email address (required if phone_number not provided)',
    example: 'john@example.com',
  })
  @RequireEmailOrPhone()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'User phone number (required if email not provided)',
    example: '+923001234567',
  })
  @RequireEmailOrPhone()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone_number?: string;

  @ApiProperty({ description: 'Code sent to email or phone', example: '123456' })
  @IsNotEmpty()
  @IsString()
  verification_code: string;
}
