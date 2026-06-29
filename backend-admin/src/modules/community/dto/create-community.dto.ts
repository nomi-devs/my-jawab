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

export class CreateCommunityDto {
  @IsString()
  @MaxLength(255)
  community_slug: string;

  @IsString()
  @MaxLength(255)
  community_name: string;

  @IsOptional()
  @IsString()
  community_description?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  community_image?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'boolean') return value;
    // Handle "active"/"inactive" strings (from FormData)
    const stringValue = String(value).toLowerCase().trim();
    if (stringValue === 'active' || stringValue === 'true' || stringValue === '1') return true;
    if (stringValue === 'inactive' || stringValue === 'false' || stringValue === '0') return false;
    // Fallback for numeric values
    if (value === 1 || value === '1') return true;
    if (value === 0 || value === '0') return false;
    return undefined;
  })
  @ValidateIf((o) => o.is_active !== undefined && o.is_active !== null)
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @Transform(({ value }) => {
    // Handle both array and single value from FormData
    if (!value) return undefined;
    if (Array.isArray(value)) {
      return value.map(v => parseInt(v, 10)).filter(v => !isNaN(v));
    }
    // Single value case
    const num = parseInt(value, 10);
    return isNaN(num) ? undefined : [num];
  })
  @IsArray()
  @IsInt({ each: true })
  topic_ids?: number[];
}

