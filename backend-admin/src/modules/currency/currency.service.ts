import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Currency } from './entities/currency.entity';
import { CreateCurrencyDto } from './dto/create-currency.dto';
import { UpdateCurrencyDto } from './dto/update-currency.dto';

@Injectable()
export class CurrencyService {
    constructor(
        @InjectRepository(Currency)
        private currencyRepository: Repository<Currency>,
    ) { }

    async create(createCurrencyDto: CreateCurrencyDto, userId: number): Promise<Currency> {
        const existing = await this.currencyRepository.findOne({
            where: { currency_code: createCurrencyDto.currency_code },
        });

        if (existing) {
            throw new ConflictException('Currency with this code already exists');
        }

        const currency = this.currencyRepository.create({
            ...createCurrencyDto,
            created_by: userId,
        });

        return await this.currencyRepository.save(currency);
    }

    async findAll(): Promise<Currency[]> {
        return await this.currencyRepository.find();
    }

    async findOne(id: number): Promise<Currency> {
        const currency = await this.currencyRepository.findOne({ where: { id } });
        if (!currency) {
            throw new NotFoundException(`Currency with ID ${id} not found`);
        }
        return currency;
    }

    async update(id: number, updateCurrencyDto: UpdateCurrencyDto, userId: number): Promise<Currency> {
        const currency = await this.findOne(id);

        if (updateCurrencyDto.currency_code && updateCurrencyDto.currency_code !== currency.currency_code) {
            const existing = await this.currencyRepository.findOne({
                where: { currency_code: updateCurrencyDto.currency_code },
            });
            if (existing) {
                throw new ConflictException('Currency with this code already exists');
            }
        }

        Object.assign(currency, updateCurrencyDto);
        currency.updated_by = userId;

        return await this.currencyRepository.save(currency);
    }

    async remove(id: number): Promise<{ message: string }> {
        const currency = await this.findOne(id);
        await this.currencyRepository.remove(currency);
        return { message: 'Currency deleted successfully' };
    }
}
