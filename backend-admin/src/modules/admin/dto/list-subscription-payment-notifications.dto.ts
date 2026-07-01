import { IsOptional, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum ReadStatus {
  READ = 'read',
  UNREAD = 'unread',
}

export class ListSubscriptionPaymentNotificationsDto {
  @ApiPropertyOptional({ default: 1, minimum: 1, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100, example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ enum: ReadStatus, example: 'unread' })
  @IsOptional()
  @IsEnum(ReadStatus)
  is_read?: ReadStatus;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  user_id?: number;

  @ApiPropertyOptional({ example: 'subscription' })
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ default: 'created_at', example: 'created_at' })
  @IsOptional()
  sort_by?: string = 'created_at';

  @ApiPropertyOptional({
    enum: ['ASC', 'DESC'],
    default: 'DESC',
    example: 'DESC',
  })
  @IsOptional()
  sort_order?: 'ASC' | 'DESC' = 'DESC';
}
