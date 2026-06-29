import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class UpdateMediaDto {
  @IsOptional()
  @IsString()
  folder?: string;

  @IsOptional()
  @IsBoolean()
  is_public?: boolean;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

