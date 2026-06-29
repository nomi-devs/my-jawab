import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { AuthType } from '../entities/user.entity';

export class RegisterDto {
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ValidateIf((o) => o.auth_type === 'email' || o.auth_type === 'phone')
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsNotEmpty()
  @IsEnum(AuthType)
  auth_type: AuthType;

  @IsOptional()
  @IsString()
  device_id?: string;

  @IsOptional()
  @IsString()
  device_type?: string;

  @IsOptional()
  @IsString()
  device_token?: string;

  // For OAuth (Google/Apple)
  @ValidateIf((o) => o.auth_type === 'google' || o.auth_type === 'apple')
  @IsNotEmpty()
  @IsString()
  oauth_token?: string;
}

