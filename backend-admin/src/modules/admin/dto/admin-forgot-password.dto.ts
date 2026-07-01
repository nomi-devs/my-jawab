import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdminForgotPasswordDto {
  @ApiProperty({ example: 'admin@jawab.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
