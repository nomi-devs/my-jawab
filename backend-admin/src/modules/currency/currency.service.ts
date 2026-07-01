import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCurrencyDto } from './dto/create-currency.dto';
import { UpdateCurrencyDto } from './dto/update-currency.dto';

@Injectable()
export class CurrencyService {
  constructor(private prisma: PrismaService) {}

  async create(createCurrencyDto: CreateCurrencyDto, userId: number) {
    const existing = await this.prisma.currency.findFirst({
      where: { currency_code: createCurrencyDto.currency_code },
    });

    if (existing) {
      throw new ConflictException('Currency with this code already exists');
    }

    return await this.prisma.currency.create({
      data: {
        ...createCurrencyDto,
        created_by: userId,
      },
    });
  }

  async findAll() {
    return await this.prisma.currency.findMany();
  }

  async findOne(id: number) {
    const currency = await this.prisma.currency.findUnique({ where: { id } });
    if (!currency) {
      throw new NotFoundException(`Currency with ID ${id} not found`);
    }
    return currency;
  }

  async update(
    id: number,
    updateCurrencyDto: UpdateCurrencyDto,
    userId: number,
  ) {
    const currency = await this.findOne(id);

    if (
      updateCurrencyDto.currency_code &&
      updateCurrencyDto.currency_code !== currency.currency_code
    ) {
      const existing = await this.prisma.currency.findFirst({
        where: { currency_code: updateCurrencyDto.currency_code },
      });
      if (existing) {
        throw new ConflictException('Currency with this code already exists');
      }
    }

    return await this.prisma.currency.update({
      where: { id },
      data: {
        ...updateCurrencyDto,
        updated_by: userId,
      },
    });
  }

  async remove(id: number): Promise<{ message: string }> {
    await this.findOne(id);
    await this.prisma.currency.delete({ where: { id } });
    return { message: 'Currency deleted successfully' };
  }
}
