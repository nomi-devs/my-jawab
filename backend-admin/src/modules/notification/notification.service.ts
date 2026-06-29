import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType, NotificationPriority } from './entities/notification.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification, 'notification')
    private notificationRepository: Repository<Notification>,
  ) {}

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
  }): Promise<Notification> {
    const notification = this.notificationRepository.create({
      ...data,
      priority: data.priority || NotificationPriority.NORMAL,
      in_app_enabled: data.in_app_enabled ?? true,
      push_enabled: data.push_enabled ?? true,
      email_enabled: data.email_enabled ?? true,
    });

    return await this.notificationRepository.save(notification);
  }

  async findById(id: number): Promise<Notification | null> {
    return await this.notificationRepository.findOne({ where: { id } });
  }

  async findByUserId(
    user_id: number,
    options?: {
      is_read?: boolean;
      notification_type?: NotificationType;
      limit?: number;
      offset?: number;
    },
  ): Promise<Notification[]> {
    const query = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.user_id = :user_id', { user_id })
      .orderBy('notification.created_at', 'DESC');

    if (options?.is_read !== undefined) {
      query.andWhere('notification.is_read = :is_read', { is_read: options.is_read });
    }

    if (options?.notification_type) {
      query.andWhere('notification.notification_type = :type', { type: options.notification_type });
    }

    if (options?.limit) {
      query.limit(options.limit);
    }

    if (options?.offset) {
      query.offset(options.offset);
    }

    return await query.getMany();
  }

  async markAsRead(id: number, user_id: number): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id, user_id },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    notification.is_read = true;
    notification.read_at = new Date();

    return await this.notificationRepository.save(notification);
  }

  async markAllAsRead(user_id: number): Promise<void> {
    await this.notificationRepository.update(
      { user_id, is_read: false },
      { is_read: true, read_at: new Date() },
    );
  }

  async delete(id: number, user_id: number): Promise<void> {
    await this.notificationRepository.delete({ id, user_id });
  }

  async getUnreadCount(user_id: number): Promise<number> {
    return await this.notificationRepository.count({
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
  }): Promise<{ data: Notification[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      is_read,
      user_id,
      search,
      sort_by = 'created_at',
      sort_order = 'DESC',
    } = options;

    const queryBuilder = this.notificationRepository
      .createQueryBuilder('notification')
      .where(
        '(notification.notification_type = :subscriptionType OR JSON_EXTRACT(notification.data, "$.subscription_id") IS NOT NULL OR JSON_EXTRACT(notification.data, "$.payment_id") IS NOT NULL OR JSON_EXTRACT(notification.data, "$.user_subscription_id") IS NOT NULL)',
        { subscriptionType: NotificationType.SUBSCRIPTION_EXPIRED },
      );

    // Filter by read status
    if (is_read !== undefined) {
      queryBuilder.andWhere('notification.is_read = :is_read', { is_read });
    }

    // Filter by user_id
    if (user_id) {
      queryBuilder.andWhere('notification.user_id = :user_id', { user_id });
    }

    // Search in title and body
    if (search) {
      const searchLike = `%${search}%`;
      queryBuilder.andWhere(
        '(notification.title LIKE :search OR notification.body LIKE :search)',
        { search: searchLike },
      );
    }

    // Sorting
    const validSortFields = ['created_at', 'updated_at', 'title', 'is_read'];
    const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
    queryBuilder.orderBy(`notification.${sortField}`, sort_order);

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [notifications, total] = await queryBuilder.getManyAndCount();

    return { data: notifications, total };
  }
}

