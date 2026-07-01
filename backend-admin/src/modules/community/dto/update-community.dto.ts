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
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCommunityDto {
  @ApiPropertyOptional({ maxLength: 255, example: 'tech-lovers' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  community_slug?: string;

  @ApiPropertyOptional({ maxLength: 255, example: 'Tech Lovers' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  community_name?: string;

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
  @Transform(({ value, obj }) => {
    // Handle both 'is_active' and 'active' fields
    let val = value;
    if (
      (val === undefined || val === null || val === '') &&
      obj &&
      obj.active !== undefined &&
      obj.active !== null &&
      obj.active !== ''
    ) {
      val = obj.active;
    }
    if (val === undefined || val === null || val === '') return undefined;
    if (typeof val === 'boolean') return val;
    // Handle "active"/"inactive" strings (from FormData)
    const stringValue = String(val).toLowerCase().trim();
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
    if (val === 1 || val === '1') return true;
    if (val === 0 || val === '0') return false;
    return undefined;
  })
  @ValidateIf(
    (o) =>
      (o.is_active !== undefined && o.is_active !== null) ||
      (o.active !== undefined && o.active !== null),
  )
  @IsBoolean()
  is_active?: boolean;

  // Support for 'active' field as alias (will be handled in service)
  @ApiPropertyOptional({ description: 'Alias for is_active' })
  @IsOptional()
  active?: boolean | string;

  @ApiPropertyOptional({ type: [Number], example: [1, 3] })
  @IsOptional()
  @Transform(({ value }) => {
    // Handle both array and single value from FormData
    // Also handle empty string/array (to clear topics)
    if (
      !value ||
      (Array.isArray(value) && value.length === 0) ||
      (Array.isArray(value) && value[0] === '')
    ) {
      return [];
    }
    if (Array.isArray(value)) {
      const nums = value.map((v) => parseInt(v, 10)).filter((v) => !isNaN(v));
      return nums.length > 0 ? nums : [];
    }
    // Single value case
    const num = parseInt(value, 10);
    return isNaN(num) ? [] : [num];
  })
  @IsArray()
  @IsInt({ each: true })
  topic_ids?: number[];
}
