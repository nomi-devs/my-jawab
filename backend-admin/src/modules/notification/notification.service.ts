import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationType, NotificationPriority } from '@prisma/client';

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    user_id: number;
    notification_type: NotificationType;
    title: string;
    body: string;
    data?: Record<string, any>;
    action_url?: string;
    priority?: NotificationPriority;
    in_app_enabled?: boolean;
    push_enabled?: boolean;
    email_enabled?: boolean;
    created_by?: number;
  }) {
    return await this.prisma.notification.create({
      data: {
        user_id: data.user_id,
        notification_type: data.notification_type as any,
        title: data.title,
        body: data.body,
        data: data.data ?? undefined,
        action_url: data.action_url ?? null,
        priority: (data.priority ?? NotificationPriority.normal) as any,
        in_app_enabled: data.in_app_enabled ?? true,
        push_enabled: data.push_enabled ?? true,
        email_enabled: data.email_enabled ?? true,
        created_by: data.created_by ?? null,
      },
    });
  }

  async findById(id: number) {
    return await this.prisma.notification.findUnique({ where: { id } });
  }

  async findByUserId(
    user_id: number,
    options?: {
      is_read?: boolean;
      notification_type?: NotificationType;
      limit?: number;
      offset?: number;
    },
  ) {
    return await this.prisma.notification.findMany({
      where: {
        user_id,
        ...(options?.is_read !== undefined ? { is_read: options.is_read } : {}),
        ...(options?.notification_type
          ? { notification_type: options.notification_type as any }
          : {}),
      },
      orderBy: { created_at: 'desc' },
      ...(options?.limit !== undefined ? { take: options.limit } : {}),
      ...(options?.offset !== undefined ? { skip: options.offset } : {}),
    });
  }

  async markAsRead(id: number, user_id: number) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, user_id },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    return await this.prisma.notification.update({
      where: { id },
      data: { is_read: true, read_at: new Date() },
    });
  }

  async markAllAsRead(user_id: number): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { user_id, is_read: false },
      data: { is_read: true, read_at: new Date() },
    });
  }

  async delete(id: number, user_id: number): Promise<void> {
    await this.prisma.notification.deleteMany({ where: { id, user_id } });
  }

  async getUnreadCount(user_id: number): Promise<number> {
    return await this.prisma.notification.count({
      where: { user_id, is_read: false },
    });
  }

  // Get subscription and payment notifications (used by AdminService)
  async getSubscriptionPaymentNotifications(options: {
    page?: number;
    limit?: number;
    is_read?: boolean;
    user_id?: number;
    search?: string;
    sort_by?: string;
    sort_order?: 'ASC' | 'DESC';
  }): Promise<{ data: any[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      is_read,
      user_id,
      search,
      sort_by = 'created_at',
      sort_order = 'DESC',
    } = options;

    const validSortFields = ['created_at', 'updated_at', 'title', 'is_read'];
    const sortField = validSortFields.includes(sort_by)
      ? sort_by
      : 'created_at';
    const orderDirection = sort_order === 'ASC' ? 'asc' : 'desc';

    const skip = (page - 1) * limit;

    const where: any = {
      OR: [
        { notification_type: 'subscription_expired' },
        {
          data: {
            path: ['$.subscription_id'],
            not: null,
          },
        },
      ],
    };

    if (is_read !== undefined) {
      where.is_read = is_read;
    }

    if (user_id) {
      where.user_id = user_id;
    }

    if (search) {
      // Wrap the existing filter in an AND with the search filter
      const existingWhere = { ...where };
      Object.keys(existingWhere).forEach((k) => delete where[k]);
      where.AND = [
        existingWhere,
        {
          OR: [{ title: { contains: search } }, { body: { contains: search } }],
        },
      ];
    }

    const [notifications, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        orderBy: { [sortField]: orderDirection },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return { data: notifications, total };
  }
}
