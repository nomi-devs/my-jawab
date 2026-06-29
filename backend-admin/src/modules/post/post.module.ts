import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { UserPost, PostLike } from './entities';
import { Topic } from '../general/entities/topic.entity';
import { User } from '../auth/entities/user.entity';
import { NotificationModule } from '../notification/notification.module';
import { EntitlementsModule } from '../entitlements/entitlements.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserPost, PostLike, Topic, User]),
    NotificationModule,
    EntitlementsModule,
  ],
  controllers: [PostController],
  providers: [PostService],
  exports: [PostService],
})
export class PostModule {}

