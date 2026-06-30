import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MediaModule } from '../media/media.module';
import { MediaClientService } from './services/media-client.service';
import { RedisService } from './services/redis.service';

@Global()
@Module({
  imports: [ConfigModule, MediaModule],
  providers: [MediaClientService, RedisService],
  exports: [MediaClientService, RedisService],
})
export class SharedModule {}
