import { Module } from '@nestjs/common';
import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';
import { PostModule } from '../post/post.module';
import { PollModule } from '../poll/poll.module';
import { SharedModule } from '../shared/shared.module';
import { BannerModule } from '../banner/banner.module';
import { EntitlementsModule } from '../entitlements/entitlements.module';

@Module({
  imports: [
    PostModule,
    PollModule,
    SharedModule,
    BannerModule,
    EntitlementsModule,
  ],
  controllers: [FeedController],
  providers: [FeedService],
  exports: [FeedService],
})
export class FeedModule {}
