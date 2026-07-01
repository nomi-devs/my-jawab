import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JobType, JobStatus } from './entities/job.entity';

@Injectable()
export class JobService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    job_type: JobType;
    payload: Record<string, any>;
    notification_id?: number;
    email_id?: number;
    priority?: number;
    scheduled_at?: Date;
    created_by?: number;
  }) {
    return await this.prisma.job.create({
      data: {
        job_type: data.job_type as any,
        payload: data.payload,
        notification_id: data.notification_id ?? null,
        email_id: data.email_id ?? null,
        priority: data.priority ?? 5,
        scheduled_at: data.scheduled_at ?? null,
        created_by: data.created_by ?? null,
        job_status: 'pending',
      },
    });
  }

  async findById(id: number) {
    return await this.prisma.job.findUnique({ where: { id } });
  }

  async findPendingJobs(limit: number = 10) {
    return await this.prisma.job.findMany({
      where: { job_status: 'pending' },
      orderBy: [{ priority: 'asc' }, { created_at: 'asc' }],
      take: limit,
    });
  }

  async findScheduledJobs() {
    const now = new Date();
    return await this.prisma.job.findMany({
      where: {
        job_status: 'pending',
        scheduled_at: { not: null, lte: now },
      },
      orderBy: [{ priority: 'asc' }, { scheduled_at: 'asc' }],
    });
  }

  async updateStatus(
    id: number,
    status: JobStatus,
    data?: {
      error_message?: string;
      error_details?: Record<string, any>;
      started_at?: Date;
      completed_at?: Date;
    },
  ) {
    const job = await this.prisma.job.findUnique({ where: { id } });

    if (!job) {
      throw new Error('Job not found');
    }

    return await this.prisma.job.update({
      where: { id },
      data: {
        job_status: status as any,
        attempts: { increment: 1 },
        ...(data ?? {}),
      },
    });
  }

  async addLog(
    id: number,
    log: { level: string; message: string; details?: Record<string, any> },
  ) {
    const job = await this.prisma.job.findUnique({ where: { id } });

    if (!job) {
      throw new Error('Job not found');
    }

    const existingLogs: Array<any> = Array.isArray(job.logs)
      ? (job.logs as Array<any>)
      : [];

    const updatedLogs = [...existingLogs, { ...log, timestamp: new Date() }];

    return await this.prisma.job.update({
      where: { id },
      data: { logs: updatedLogs },
    });
  }

  async cancel(id: number) {
    return await this.updateStatus(id, JobStatus.CANCELLED);
  }
}
