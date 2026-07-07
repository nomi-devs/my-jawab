import { Module } from '@nestjs/common';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { NotificationModule } from '../notification/notification.module';
import { EntitlementsModule } from '../entitlements/entitlements.module';
import { PointsModule } from '../points/points.module';

@Module({
  imports: [NotificationModule, EntitlementsModule, PointsModule],
  controllers: [PostController],
  providers: [PostService],
  exports: [PostService],
})
export class PostModule {}
