import { IsEmail, IsNotEmpty, MinLength, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class AdminResetPasswordDto {
  @ApiProperty({ example: 'admin@jawab.com' })
  @Transform(({ value }) => {
    if (value == null) return value;
    return typeof value === 'string' ? value.trim() : String(value).trim();
  })
  @IsNotEmpty({ message: 'email should not be empty' })
  @IsEmail({}, { message: 'email must be an email' })
  email: string;

  @ApiProperty({ example: '123456' })
  @Transform(({ value }) => {
    if (value == null) return value;
    return String(value);
  })
  @IsNotEmpty({ message: 'reset_code should not be empty' })
  reset_code: string;

  @ApiProperty({ minLength: 6, example: 'NewAdmin@123' })
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
