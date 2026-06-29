import { IsString, IsOptional, MaxLength, IsBoolean } from 'class-validator';

export class UpdateCurrencyDto {
    @IsString()
    @IsOptional()
    @MaxLength(255)
    currency_name?: string;

    @IsString()
    @IsOptional()
    @MaxLength(10)
    currency_code?: string;

    @IsString()
    @IsOptional()
    @MaxLength(10)
    currency_symbol?: string;

    @IsBoolean()
    @IsOptional()
    is_active?: boolean;
}
