import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ActiveStatus } from '../../admin/dto/list-users-query.dto';

export class CreatePrivacyPolicyDto {
  @ApiProperty({ example: 'privacy-policy-v1' })
  @IsString()
  @MaxLength(255)
  slug: string;

  @ApiProperty({ example: 'Privacy Policy' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({ example: 'We collect your data...' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ enum: ['active', 'inactive'] })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'active' || value === ActiveStatus.ACTIVE)
      return ActiveStatus.ACTIVE;
    if (value === 'inactive' || value === ActiveStatus.INACTIVE)
      return ActiveStatus.INACTIVE;
    return value;
  })
  @IsEnum(ActiveStatus)
  is_active?: ActiveStatus;
}
