import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../auth/entities/user.entity';
import { UserDevice } from '../auth/entities/user-device.entity';
import { UserPasswordReset } from '../auth/entities/user-password-reset.entity';
import { UserProfile } from '../user/entities/user-profile.entity';
import { UserFollower } from '../user/entities/user-follower.entity';
import { UserTopic } from '../user/entities/user-topic.entity';
// Import other modules to reuse their services
import { PostModule } from '../post/post.module';
import { CommentModule } from '../comment/comment.module';
import { CommunityModule } from '../community/community.module';
import { PollModule } from '../poll/poll.module';
import { GeneralModule } from '../general/general.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { NotificationModule } from '../notification/notification.module';
import { EmailModule } from '../email/email.module';
// Import entities for direct repository access when needed
import { UserPost } from '../post/entities/user-post.entity';
import { PostLike } from '../post/entities/post-like.entity';
import { PostComment } from '../comment/entities/post-comment.entity';
import { CommentLike } from '../comment/entities/comment-like.entity';
import { Community } from '../community/entities/community.entity';
import { CommunityTopic } from '../community/entities/community-topic.entity';
import { CommunityUser } from '../community/entities/community-user.entity';
import { UserPoll } from '../poll/entities/user-poll.entity';
import { PollOption } from '../poll/entities/poll-option.entity';
import { PollVote } from '../poll/entities/poll-vote.entity';
import { PollLike } from '../poll/entities/poll-like.entity';
import { PollComment } from '../poll/entities/poll-comment.entity';
import { Topic } from '../general/entities/topic.entity';
import { Subscription, UserSubscription, Payment } from '../subscription/entities';
import { Notification } from '../notification/entities/notification.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserDevice,
      UserPasswordReset,
      UserProfile,
      UserFollower,
      UserTopic,
      UserPost,
      PostLike,
      PostComment,
      CommentLike,
      Community,
      CommunityTopic,
      CommunityUser,
      UserPoll,
      PollOption,
      PollVote,
      PollLike,
      PollComment,
      Topic,
      Subscription,
      UserSubscription,
      Payment,
    ]),
    // Notification entity from separate database (required for direct repository injection)
    TypeOrmModule.forFeature([Notification], 'notification'),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): JwtModuleOptions => {
        const expiresIn = configService.get<string>('JWT_EXPIRES_IN', '1h');
        return {
          secret: configService.get<string>('JWT_SECRET', 'your-secret-key'),
          signOptions: {
            expiresIn: (expiresIn || '1h') as any,
          },
        };
      },
      inject: [ConfigService],
    }),
    // Import other modules to use their services
    PostModule,
    CommentModule,
    CommunityModule,
    PollModule,
    GeneralModule,
    SubscriptionModule,
    NotificationModule,
    EmailModule, // Import EmailModule to use EmailTemplatesService for password reset emails
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}

