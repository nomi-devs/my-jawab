import { IsString, IsOptional, IsEnum, IsEmail, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ActiveStatus } from '../../admin/dto/list-users-query.dto';

export class UpdateSupportDto {
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  whatsapp?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  website?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'active' || value === ActiveStatus.ACTIVE) return ActiveStatus.ACTIVE;
    if (value === 'inactive' || value === ActiveStatus.INACTIVE) return ActiveStatus.INACTIVE;
    return value;
  })
  @IsEnum(ActiveStatus)
  is_active?: ActiveStatus;
}
