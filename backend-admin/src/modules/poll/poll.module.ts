import { Module } from '@nestjs/common';
import { PollController } from './poll.controller';
import { PollService } from './poll.service';
import { NotificationModule } from '../notification/notification.module';
import { EntitlementsModule } from '../entitlements/entitlements.module';

@Module({
  imports: [NotificationModule, EntitlementsModule],
  controllers: [PollController],
  providers: [PollService],
  exports: [PollService],
})
export class PollModule {}
