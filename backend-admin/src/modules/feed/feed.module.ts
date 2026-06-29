import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';
import { UserPost } from '../post/entities/user-post.entity';
import { UserPoll } from '../poll/entities/user-poll.entity';
import { UserFollower } from '../user/entities/user-follower.entity';
import { UserTopic } from '../user/entities/user-topic.entity';
import { CommunityUser } from '../community/entities/community-user.entity';
import { UserProfile } from '../user/entities/user-profile.entity';
import { Topic } from '../general/entities/topic.entity';
import { Community } from '../community/entities/community.entity';
import { CommunityTopic } from '../community/entities/community-topic.entity';
import { PostModule } from '../post/post.module';
import { PollModule } from '../poll/poll.module';
import { SharedModule } from '../shared/shared.module';
import { BannerModule } from '../banner/banner.module';
import { EntitlementsModule } from '../entitlements/entitlements.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserPost,
      UserPoll,
      UserFollower,
      UserTopic,
      CommunityUser,
      UserProfile,
      Topic,
      Community,
      CommunityTopic,
    ]),
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
export class FeedModule { }

