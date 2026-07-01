import {
  IsString,
  IsOptional,
  IsUrl,
  MaxLength,
  IsBoolean,
  IsArray,
  IsInt,
  IsEnum,
  ValidateIf,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommunityDto {
  @ApiProperty({ maxLength: 255, example: 'tech-lovers' })
  @IsString()
  @MaxLength(255)
  community_slug: string;

  @ApiProperty({ maxLength: 255, example: 'Tech Lovers' })
  @IsString()
  @MaxLength(255)
  community_name: string;

  @ApiPropertyOptional({ example: 'A community for tech enthusiasts' })
  @IsOptional()
  @IsString()
  community_description?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/community.jpg' })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  community_image?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'boolean') return value;
    // Handle "active"/"inactive" strings (from FormData)
    const stringValue = String(value).toLowerCase().trim();
    if (
      stringValue === 'active' ||
      stringValue === 'true' ||
      stringValue === '1'
    )
      return true;
    if (
      stringValue === 'inactive' ||
      stringValue === 'false' ||
      stringValue === '0'
    )
      return false;
    // Fallback for numeric values
    if (value === 1 || value === '1') return true;
    if (value === 0 || value === '0') return false;
    return undefined;
  })
  @ValidateIf((o) => o.is_active !== undefined && o.is_active !== null)
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ type: [Number], example: [1, 3] })
  @IsOptional()
  @Transform(({ value }) => {
    // Handle both array and single value from FormData
    if (!value) return undefined;
    if (Array.isArray(value)) {
      return value.map((v) => parseInt(v, 10)).filter((v) => !isNaN(v));
    }
    // Single value case
    const num = parseInt(value, 10);
    return isNaN(num) ? undefined : [num];
  })
  @IsArray()
  @IsInt({ each: true })
  topic_ids?: number[];
}
