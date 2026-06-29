import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { JobService } from './job.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';

@Controller('jobs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Get(':id')
  async getJob(@Param('id') id: string) {
    const job = await this.jobService.findById(parseInt(id));

    if (!job) {
      return {
        success: false,
        message: 'Job not found',
      };
    }

    return {
      success: true,
      data: job,
    };
  }

  @Get('pending/list')
  async getPendingJobs(@Request() req: any) {
    const jobs = await this.jobService.findPendingJobs(50);

    return {
      success: true,
      data: jobs,
    };
  }
}

