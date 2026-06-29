import { IsString, IsOptional } from 'class-validator';

export class UpdateAppSettingDto {
    @IsString()
    @IsOptional()
    setting_key?: string;

    @IsString()
    @IsOptional()
    setting_value?: string;

    @IsString()
    @IsOptional()
    setting_group?: string;
}
