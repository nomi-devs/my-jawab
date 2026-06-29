import { IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class UpdateCommunityStatusDto {
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @Type(() => Boolean)
  @IsBoolean()
  is_active: boolean;
}

