import { IsEmail, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiPropertyOptional({
    description: 'User email address',
    example: 'john@example.com',
  })
  @Transform(({ value }) => {
    if (value == null) return value;
    return typeof value === 'string' ? value.trim() : String(value).trim();
  })
  @IsOptional()
  @IsEmail({}, { message: 'email must be an email' })
  email?: string;

  @ApiPropertyOptional({
    description: 'User phone number',
    example: '+1234567890',
  })
  @Transform(({ value }) => {
    if (value == null) return value;
    return typeof value === 'string' ? value.trim() : String(value).trim();
  })
  @IsOptional()
  @IsString({ message: 'phone_number must be a string' })
  phone_number?: string;
}
