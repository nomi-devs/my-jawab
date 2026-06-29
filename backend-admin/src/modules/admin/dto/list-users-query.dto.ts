import { IsOptional, IsEnum, IsInt, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ListQueryDto } from './list-query.dto';
import { UserRole } from '../../auth/entities/user.entity';

export enum ActiveStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum VerifiedStatus {
  VERIFIED = 'verified',
  UNVERIFIED = 'unverified',
}

export class ListUsersQueryDto extends ListQueryDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole | 'all';

  @IsOptional()
  @IsEnum(ActiveStatus)
  is_active?: ActiveStatus;

  @IsOptional()
  @IsEnum(VerifiedStatus)
  is_verified?: VerifiedStatus;

  @IsOptional()
  @IsDateString()
  created_from?: string;

  @IsOptional()
  @IsDateString()
  created_to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  user_id?: number;
}

