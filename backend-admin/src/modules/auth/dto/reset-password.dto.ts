import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ResetPasswordDto {
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

  @ApiProperty({
    description: 'Reset code received via email/SMS',
    example: '123456',
  })
  @Transform(({ value }) => {
    if (value == null) return value;
    return String(value);
  })
  @IsNotEmpty({ message: 'reset_code should not be empty' })
  reset_code: string;

  @ApiProperty({
    description: 'New password, min 6 chars',
    example: 'newSecret123',
  })
  @Transform(({ value }) => {
    if (value == null) return value;
    return String(value);
  })
  @IsNotEmpty({ message: 'new_password should not be empty' })
  @MinLength(6, {
    message: 'new_password must be longer than or equal to 6 characters',
  })
  new_password: string;
}
