import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ example: 'OldPass@123' })
  @IsNotEmpty()
  @IsString()
  old_password: string;

  @ApiProperty({ minLength: 6, example: 'NewPass@123' })
  @IsNotEmpty()
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  new_password: string;
}
