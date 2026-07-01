import { Module } from '@nestjs/common';
import { BannerService } from './banner.service';
import { BannerController, AdminBannerController } from './banner.controller';

@Module({
  imports: [],
  controllers: [BannerController, AdminBannerController],
  providers: [BannerService],
  exports: [BannerService],
})
export class BannerModule {}
