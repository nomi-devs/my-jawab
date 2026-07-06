import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ActiveStatus } from './list-users-query.dto';

export class UpdateTopicStatusDto {
  @ApiProperty({ enum: ['active', 'inactive'], example: 'active' })
  @Transform(({ value }) => {
    // Handle both string and enum values
    if (value === 'active' || value === ActiveStatus.ACTIVE)
      return ActiveStatus.ACTIVE;
    if (value === 'inactive' || value === ActiveStatus.INACTIVE)
      return ActiveStatus.INACTIVE;
    return value;
  })
  @IsEnum(ActiveStatus)
  is_active: ActiveStatus; // 'active' or 'inactive'

  @ApiPropertyOptional({
    example: true,
    description: 'Admin-curated trending flag — not algorithmic. Filterable via GET ma/topics?is_trending=true.',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @Type(() => Boolean)
  @IsBoolean()
  is_trending?: boolean;
}
