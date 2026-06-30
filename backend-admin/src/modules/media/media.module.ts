import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { StorageService } from './services/storage.service';
import { MediaProcessingService } from './services/media-processing.service';
import { Media } from './entities';

@Module({
  imports: [TypeOrmModule.forFeature([Media]), ConfigModule],
  controllers: [MediaController],
  providers: [MediaService, StorageService, MediaProcessingService],
  exports: [MediaService, StorageService, MediaProcessingService],
})
export class MediaModule {}
