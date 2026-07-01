import {
  IsString,
  IsOptional,
  IsInt,
  IsUrl,
  MaxLength,
  Min,
  IsEnum,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ActiveStatus } from '../../admin/dto/list-users-query.dto';

export class UpdateTopicDto {
  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : parseInt(value, 10)))
  @IsInt()
  @Min(0)
  parent_id?: number;

  @ApiPropertyOptional({ example: 'javascript' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  topic_slug?: string;

  @ApiPropertyOptional({ example: 'JavaScript' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  topic_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  topic_description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/image.png' })
  @IsOptional()
  @ValidateIf((o) => o.topic_image !== '' && o.topic_image !== undefined)
  @IsUrl()
  @MaxLength(500)
  topic_image?: string;

  @ApiPropertyOptional({ enum: ['active', 'inactive'] })
  @IsOptional()
  @Transform(({ value }) => {
    // Handle both string and enum values from FormData
    if (value === 'active' || value === ActiveStatus.ACTIVE)
      return ActiveStatus.ACTIVE;
    if (value === 'inactive' || value === ActiveStatus.INACTIVE)
      return ActiveStatus.INACTIVE;
    return value;
  })
  @IsEnum(ActiveStatus)
  is_active?: ActiveStatus; // 'active' or 'inactive'
}
