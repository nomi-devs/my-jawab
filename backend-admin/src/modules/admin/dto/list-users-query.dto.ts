import { IsOptional, IsEnum, IsInt, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiPropertyOptional({
    enum: [...Object.values(UserRole), 'all'],
    example: 'user',
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole | 'all';

  @ApiPropertyOptional({ enum: ActiveStatus, example: 'active' })
  @IsOptional()
  @IsEnum(ActiveStatus)
  is_active?: ActiveStatus;

  @ApiPropertyOptional({ enum: VerifiedStatus, example: 'verified' })
  @IsOptional()
  @IsEnum(VerifiedStatus)
  is_verified?: VerifiedStatus;

  @ApiPropertyOptional({ example: '2025-01-01' })
  @IsOptional()
  @IsDateString()
  created_from?: string;

  @ApiPropertyOptional({ example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  created_to?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  user_id?: number;
}
