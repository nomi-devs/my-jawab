import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PollController } from './poll.controller';
import { PollService } from './poll.service';
import {
  UserPoll,
  PollOption,
  PollVote,
  PollComment,
  PollLike,
} from './entities';
import { User } from '../auth/entities/user.entity';
import { NotificationModule } from '../notification/notification.module';
import { EntitlementsModule } from '../entitlements/entitlements.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserPoll,
      PollOption,
      PollVote,
      PollComment,
      PollLike,
      User,
    ]),
    NotificationModule,
    EntitlementsModule,
  ],
  controllers: [PollController],
  providers: [PollService],
  exports: [PollService],
})
export class PollModule { }

