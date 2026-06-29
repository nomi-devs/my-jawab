import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { PostComment, CommentLike } from './entities';
import { PollComment } from '../poll/entities/poll-comment.entity';
import { UserPost } from '../post/entities/user-post.entity';
import { UserPoll } from '../poll/entities/user-poll.entity';
import { UserProfile } from '../user/entities/user-profile.entity';
import { User } from '../auth/entities/user.entity';
import { NotificationModule } from '../notification/notification.module';
import { EntitlementsModule } from '../entitlements/entitlements.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PostComment,
      PollComment,
      CommentLike,
      UserPost,
      UserPoll,
      UserProfile,
      User,
    ]),
    NotificationModule,
    EntitlementsModule,
  ],
  controllers: [CommentController],
  providers: [CommentService],
  exports: [CommentService],
})
export class CommentModule {}

