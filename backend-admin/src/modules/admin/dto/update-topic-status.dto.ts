import { IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
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
}
