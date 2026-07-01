import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job, JobType, JobStatus } from './entities/job.entity';

@Injectable()
export class JobService {
  constructor(
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
  ) {}

  async create(data: {
    job_type: JobType;
    payload: Record<string, any>;
    notification_id?: number;
    email_id?: number;
    priority?: number;
    scheduled_at?: Date;
    created_by?: number;
  }): Promise<Job> {
    const job = this.jobRepository.create({
      ...data,
      job_status: JobStatus.PENDING,
      priority: data.priority || 5,
    });

    return await this.jobRepository.save(job);
  }

  async findById(id: number): Promise<Job | null> {
    return await this.jobRepository.findOne({ where: { id } });
  }

  async findPendingJobs(limit: number = 10): Promise<Job[]> {
    return await this.jobRepository.find({
      where: { job_status: JobStatus.PENDING },
      order: { priority: 'ASC', created_at: 'ASC' },
      take: limit,
    });
  }

  async findScheduledJobs(): Promise<Job[]> {
    const now = new Date();
    return await this.jobRepository
      .createQueryBuilder('job')
      .where('job.job_status = :status', { status: JobStatus.PENDING })
      .andWhere('job.scheduled_at IS NOT NULL')
      .andWhere('job.scheduled_at <= :now', { now })
      .orderBy('job.priority', 'ASC')
      .addOrderBy('job.scheduled_at', 'ASC')
      .getMany();
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
  ): Promise<Job> {
    const job = await this.jobRepository.findOne({ where: { id } });

    if (!job) {
      throw new Error('Job not found');
    }

    job.job_status = status;
    job.attempts += 1;

    if (data) {
      Object.assign(job, data);
    }

    return await this.jobRepository.save(job);
  }

  async addLog(id: number, log: { level: string; message: string; details?: Record<string, any> }): Promise<Job> {
    const job = await this.jobRepository.findOne({ where: { id } });

    if (!job) {
      throw new Error('Job not found');
    }

    if (!job.logs) {
      job.logs = [];
    }

    job.logs.push({
      ...log,
      timestamp: new Date(),
    });

    return await this.jobRepository.save(job);
  }

  async cancel(id: number): Promise<Job> {
    return await this.updateStatus(id, JobStatus.CANCELLED);
  }
}

