import { IsString, IsNotEmpty, IsBoolean, IsOptional, MaxLength } from 'class-validator';

export class CreateCurrencyDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    currency_name: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(10)
    currency_code: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(10)
    currency_symbol: string;

    @IsBoolean()
    @IsOptional()
    is_active?: boolean;
}
