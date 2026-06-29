import { IsArray, IsInt, IsObject, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class BulkUpdateDto {
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  ids: number[];

  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  updates: Record<string, any>;
}

