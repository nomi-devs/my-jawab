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

export class UpdateCommunityDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  community_slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  community_name?: string;

  @IsOptional()
  @IsString()
  community_description?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  community_image?: string;

  @IsOptional()
  @Transform(({ value, obj }) => {
    // Handle both 'is_active' and 'active' fields
    let val = value;
    if ((val === undefined || val === null || val === '') && obj && obj.active !== undefined && obj.active !== null && obj.active !== '') {
      val = obj.active;
    }
    if (val === undefined || val === null || val === '') return undefined;
    if (typeof val === 'boolean') return val;
    // Handle "active"/"inactive" strings (from FormData)
    const stringValue = String(val).toLowerCase().trim();
    if (stringValue === 'active' || stringValue === 'true' || stringValue === '1') return true;
    if (stringValue === 'inactive' || stringValue === 'false' || stringValue === '0') return false;
    // Fallback for numeric values
    if (val === 1 || val === '1') return true;
    if (val === 0 || val === '0') return false;
    return undefined;
  })
  @ValidateIf((o) => (o.is_active !== undefined && o.is_active !== null) || (o.active !== undefined && o.active !== null))
  @IsBoolean()
  is_active?: boolean;

  // Support for 'active' field as alias (will be handled in service)
  @IsOptional()
  active?: boolean | string;

  @IsOptional()
  @Transform(({ value }) => {
    // Handle both array and single value from FormData
    // Also handle empty string/array (to clear topics)
    if (!value || (Array.isArray(value) && value.length === 0) || (Array.isArray(value) && value[0] === '')) {
      return [];
    }
    if (Array.isArray(value)) {
      const nums = value.map(v => parseInt(v, 10)).filter(v => !isNaN(v));
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

