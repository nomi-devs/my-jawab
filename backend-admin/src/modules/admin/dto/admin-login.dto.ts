import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class AdminLoginDto {
  @IsNotEmpty()
  @IsString()
  identifier: string; // Can be email or username

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  device_id?: string;

  @IsOptional()
  @IsString()
  device_type?: string;

  @IsOptional()
  @IsString()
  device_token?: string;
}

