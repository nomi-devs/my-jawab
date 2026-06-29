import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Banner } from './entities/banner.entity';
import { UserTopic } from '../user/entities/user-topic.entity';
import { UserSubscription } from '../subscription/entities/user-subscription.entity';
import { BannerService } from './banner.service';
import { BannerController, AdminBannerController } from './banner.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Banner, UserTopic, UserSubscription])],
  controllers: [BannerController, AdminBannerController],
  providers: [BannerService],
  exports: [BannerService],
})
export class BannerModule {}
