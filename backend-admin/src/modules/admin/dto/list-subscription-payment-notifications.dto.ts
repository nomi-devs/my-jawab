import { IsOptional, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum ReadStatus {
  READ = 'read',
  UNREAD = 'unread',
}

export class ListSubscriptionPaymentNotificationsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsEnum(ReadStatus)
  is_read?: ReadStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  user_id?: number;

  @IsOptional()
  search?: string;

  @IsOptional()
  sort_by?: string = 'created_at';

  @IsOptional()
  sort_order?: 'ASC' | 'DESC' = 'DESC';
}
