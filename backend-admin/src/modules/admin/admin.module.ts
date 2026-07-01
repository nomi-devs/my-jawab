import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PostModule } from '../post/post.module';
import { CommentModule } from '../comment/comment.module';
import { CommunityModule } from '../community/community.module';
import { PollModule } from '../poll/poll.module';
import { GeneralModule } from '../general/general.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { NotificationModule } from '../notification/notification.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
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
    PostModule,
    CommentModule,
    CommunityModule,
    PollModule,
    GeneralModule,
    SubscriptionModule,
    NotificationModule,
    EmailModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
