import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { User } from '../auth/entities/user.entity';
import { UserProfile } from '../user/entities/user-profile.entity';
import { UserPost } from '../post/entities/user-post.entity';
import { Community } from '../community/entities/community.entity';
import { CommunityUser } from '../community/entities/community-user.entity';
import { Topic } from '../general/entities/topic.entity';
import { UserPoll } from '../poll/entities/user-poll.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserProfile,
      UserPost,
      Community,
      CommunityUser,
      Topic,
      UserPoll,
    ]),
  ],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
