import { IsEmail, IsNotEmpty } from 'class-validator';

export class AdminForgotPasswordDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

