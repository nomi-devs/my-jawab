import { IsArray, IsInt, IsObject, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class BulkUpdateDto {
  @ApiProperty({ type: [Number], example: [1, 2, 3] })
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  ids: number[];

  @ApiProperty({
    description: 'Key-value pairs to update',
    example: { is_active: true },
  })
  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  updates: Record<string, any>;
}
