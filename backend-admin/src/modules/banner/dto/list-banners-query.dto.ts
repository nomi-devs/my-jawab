import { IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ListQueryDto } from '../../admin/dto/list-query.dto';
import { BannerType } from '../entities/banner.entity';

export class ListBannersQueryDto extends ListQueryDto {
  @IsOptional()
  @IsEnum(BannerType)
  banner_type?: BannerType;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_active?: boolean;
}
