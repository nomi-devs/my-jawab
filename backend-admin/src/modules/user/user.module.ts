import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserProfile, UserFollower, UserTopic } from './entities';
import { Topic } from '../general/entities/topic.entity';
import { User } from '../auth/entities/user.entity';
import { CommunityUser } from '../community/entities/community-user.entity';
import { UserPost } from '../post/entities/user-post.entity';
import { UserPoll } from '../poll/entities/user-poll.entity';
import { PostComment } from '../comment/entities/post-comment.entity';
import { PollComment } from '../poll/entities/poll-comment.entity';
import { PostModule } from '../post/post.module';
import { PollModule } from '../poll/poll.module';
import { CommentModule } from '../comment/comment.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserProfile,
      UserFollower,
      UserTopic,
      Topic,
      CommunityUser,
      UserPost,
      UserPoll,
      PostComment,
      PollComment,
    ]),
    PostModule,
    PollModule,
    CommentModule,
    NotificationModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}

