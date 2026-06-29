import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    ParseIntPipe,
} from '@nestjs/common';
import { CurrencyService } from './currency.service';
import { CreateCurrencyDto } from './dto/create-currency.dto';
import { UpdateCurrencyDto } from './dto/update-currency.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('admin/currencies')
export class CurrencyController {
    constructor(private readonly currencyService: CurrencyService) { }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
    create(@Body() createCurrencyDto: CreateCurrencyDto, @GetUser() user: any) {
        return this.currencyService.create(createCurrencyDto, user.userId);
    }

    @Get()
    findAll() {
        return this.currencyService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.currencyService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateCurrencyDto: UpdateCurrencyDto,
        @GetUser() user: any,
    ) {
        return this.currencyService.update(id, updateCurrencyDto, user.userId);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.currencyService.remove(id);
    }
}
