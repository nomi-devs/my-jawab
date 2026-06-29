import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
  MaxLength,
  IsBoolean,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { AuthType, UserRole } from '../../auth/entities/user.entity';
import { RequireEmailOrPhone } from '../../auth/dto/validators/class-validators';

export class CreateUserDto {
  @IsString()
  @MaxLength(255)
  username: string;

  @RequireEmailOrPhone()
  @IsOptional()
  @IsEmail()
  email?: string;

  @RequireEmailOrPhone()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  phone_number?: string;

  @ValidateIf((o) => o.auth_type === AuthType.EMAIL || o.auth_type === AuthType.PHONE)
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsEnum(AuthType)
  auth_type?: AuthType;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @Type(() => Boolean)
  @IsBoolean()
  is_active?: boolean;

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

