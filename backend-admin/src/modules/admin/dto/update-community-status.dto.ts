import { IsBoolean, IsOptional } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const toBoolean = ({ value }: { value: unknown }) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
};

export class UpdateCommunityStatusDto {
  @ApiProperty({ example: true })
  @Transform(toBoolean)
  @Type(() => Boolean)
  @IsBoolean()
  is_active: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Admin-curated trending flag — not algorithmic. Shown via GET ma/communities/trending, ranked by member_count.',
  })
  @IsOptional()
  @Transform(toBoolean)
  @Type(() => Boolean)
  @IsBoolean()
  is_trending?: boolean;
}
