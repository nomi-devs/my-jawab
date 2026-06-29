import { IsEmail, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class ForgotPasswordDto {
  @Transform(({ value }) => {
    if (value == null) return value;
    return typeof value === 'string' ? value.trim() : String(value).trim();
  })
  @IsOptional()
  @IsEmail({}, { message: 'email must be an email' })
  email?: string;

  @Transform(({ value }) => {
    if (value == null) return value;
    return typeof value === 'string' ? value.trim() : String(value).trim();
  })
  @IsOptional()
  @IsString({ message: 'phone_number must be a string' })
  phone_number?: string;
}
