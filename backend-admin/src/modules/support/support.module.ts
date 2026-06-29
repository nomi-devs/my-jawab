import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Support } from './entities/support.entity';
import {
  SupportController,
  AdminSupportController,
} from './support.controller';
import { SupportService } from './support.service';

@Module({
  imports: [TypeOrmModule.forFeature([Support])],
  controllers: [SupportController, AdminSupportController],
  providers: [SupportService],
  exports: [SupportService],
})
export class SupportModule {}
