import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateAppSettingDto {
    @IsString()
    @IsNotEmpty()
    setting_key: string;

    @IsString()
    @IsOptional()
    setting_value?: string;

    @IsString()
    @IsOptional()
    setting_group?: string;
}
