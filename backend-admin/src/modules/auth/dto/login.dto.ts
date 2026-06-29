import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { AuthType } from '../entities/user.entity';

export class LoginDto {
  @IsNotEmpty()
  @IsString()
  identifier: string; // Can be email, username, or phone

  @ValidateIf((o) => o.auth_type === 'email' || o.auth_type === 'phone')
  @IsNotEmpty()
  @IsString()
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
  @IsOptional()
  @IsString()
  oauth_token?: string;
}

