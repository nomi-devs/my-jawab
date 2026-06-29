import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { Email } from './entities/email.entity';
import { EmailService } from './email.service';
import { EmailController, MailTestController, TestMailController } from './email.controller';
import { EmailSenderService } from './services/email-sender.service';
import { EmailTemplatesService } from './services/email-templates.service';
import { EmailQueueService } from './services/email-queue.service';
import { EmailProcessor } from './processors/email.processor';
import emailConfig from './config/email.config';
import { TemplatesModule } from '../templates/templates.module';
import { getRedisConfig } from '../../config/services.config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Email], 'notification'),
    ConfigModule.forFeature(emailConfig),
    TemplatesModule, // Import templates module for template rendering
    // BullMQ Queue Configuration
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: getRedisConfig(configService)!,
      }),
    }),
    // Register email queue
    BullModule.registerQueue({
      name: 'email',
    }),
  ],
  controllers: [EmailController, MailTestController, TestMailController],
  providers: [
    EmailService,
    EmailSenderService,
    EmailTemplatesService,
    EmailQueueService,
    EmailProcessor, // Queue processor
  ],
  exports: [
    EmailService,
    EmailSenderService,
    EmailTemplatesService,
    EmailQueueService,
  ],
})
export class EmailModule { }

