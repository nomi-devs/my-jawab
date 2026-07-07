import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PostModule } from '../post/post.module';
import { PollModule } from '../poll/poll.module';
import { CommentModule } from '../comment/comment.module';
import { NotificationModule } from '../notification/notification.module';
import { CommunityModule } from '../community/community.module';

@Module({
  imports: [
    PostModule,
    PollModule,
    CommentModule,
    NotificationModule,
    CommunityModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
