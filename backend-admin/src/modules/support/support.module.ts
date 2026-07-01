import { Module } from '@nestjs/common';
import {
  SupportController,
  AdminSupportController,
} from './support.controller';
import { SupportService } from './support.service';

@Module({
  imports: [],
  controllers: [SupportController, AdminSupportController],
  providers: [SupportService],
  exports: [SupportService],
})
export class SupportModule {}
