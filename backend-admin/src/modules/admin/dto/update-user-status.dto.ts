import { IsBoolean, IsOptional, IsEnum } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { UserRole } from '../../auth/entities/user.entity';

export class UpdateUserStatusDto {
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
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @Type(() => Boolean)
  @IsBoolean()
  is_verified?: boolean;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

