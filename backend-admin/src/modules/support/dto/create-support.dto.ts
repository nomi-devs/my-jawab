import {
  IsString,
  IsOptional,
  IsEnum,
  IsEmail,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ActiveStatus } from '../../admin/dto/list-users-query.dto';

export class CreateSupportDto {
  @ApiProperty({ example: 'support@jawab.com' })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({ example: '+923001234567' })
  @IsString()
  @MaxLength(20)
  phone: string;

  @ApiProperty({ example: '+923001234567' })
  @IsString()
  @MaxLength(20)
  whatsapp: string;

  @ApiProperty({ example: 'https://jawab.com' })
  @IsString()
  @MaxLength(255)
  website: string;

  @ApiProperty({ example: '123 Main St, Karachi' })
  @IsString()
  address: string;

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
