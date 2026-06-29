import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ActiveStatus } from '../../admin/dto/list-users-query.dto';

export class UpdatePrivacyPolicyDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'active' || value === ActiveStatus.ACTIVE) return ActiveStatus.ACTIVE;
    if (value === 'inactive' || value === ActiveStatus.INACTIVE) return ActiveStatus.INACTIVE;
    return value;
  })
  @IsEnum(ActiveStatus)
  is_active?: ActiveStatus;
}
