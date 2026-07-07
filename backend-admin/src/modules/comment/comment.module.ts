import { Module } from '@nestjs/common';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { NotificationModule } from '../notification/notification.module';
import { EntitlementsModule } from '../entitlements/entitlements.module';
import { PointsModule } from '../points/points.module';

@Module({
  imports: [NotificationModule, EntitlementsModule, PointsModule],
  controllers: [CommentController],
  providers: [CommentService],
  exports: [CommentService],
})
export class CommentModule {}
