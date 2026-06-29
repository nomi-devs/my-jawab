import { IsEmail, IsNotEmpty, MinLength, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';

export class AdminResetPasswordDto {
  @Transform(({ value }) => {
    if (value == null) return value;
    return typeof value === 'string' ? value.trim() : String(value).trim();
  })
  @IsNotEmpty({ message: 'email should not be empty' })
  @IsEmail({}, { message: 'email must be an email' })
  email: string;

  @Transform(({ value }) => {
    if (value == null) return value;
    return String(value);
  })
  @IsNotEmpty({ message: 'reset_code should not be empty' })
  reset_code: string;

  @Transform(({ value }) => {
    if (value == null) return value;
    return String(value);
  })
  @IsNotEmpty({ message: 'new_password should not be empty' })
  @MinLength(6, { message: 'new_password must be longer than or equal to 6 characters' })
  new_password: string;
}

