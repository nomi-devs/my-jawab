import { Module } from '@nestjs/common';
import { JobService } from './job.service';
import { JobController } from './job.controller';

@Module({
  imports: [],
  controllers: [JobController],
  providers: [JobService],
  exports: [JobService],
})
export class JobModule {}
