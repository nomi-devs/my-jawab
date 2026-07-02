import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { JobService } from './job.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Jobs')
@ApiBearerAuth('JWT-auth')
@Controller('jobs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.admin)
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @ApiOperation({ summary: 'Get job by ID' })
  @ApiParam({ name: 'id', type: String })
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

  @ApiOperation({ summary: 'List pending jobs' })
  @Get('pending/list')
  async getPendingJobs(@Request() req: any) {
    const jobs = await this.jobService.findPendingJobs(50);

    return {
      success: true,
      data: jobs,
    };
  }
}
