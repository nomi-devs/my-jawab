import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';
import {
  Community,
  CommunityTopic,
  CommunityUser,
} from './entities';
import { Topic } from '../general/entities/topic.entity';
import { UserTopic } from '../user/entities/user-topic.entity';
import { EntitlementsModule } from '../entitlements/entitlements.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Community, CommunityTopic, CommunityUser, Topic, UserTopic]),
    EntitlementsModule,
  ],
  controllers: [CommunityController],
  providers: [CommunityService],
  exports: [CommunityService],
})
export class CommunityModule {}

