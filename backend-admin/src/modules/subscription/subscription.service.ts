import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { SubscriptionResponseDto } from './dto/subscription-response.dto';
import { ListSubscriptionsQueryDto } from './dto/list-subscriptions-query.dto';
import { ActiveStatus } from '../admin/dto/list-users-query.dto';
import { CreateUserSubscriptionDto } from './dto/create-user-subscription.dto';
import { UserSubscriptionResponseDto } from './dto/user-subscription-response.dto';
import { ListUserSubscriptionsQueryDto } from './dto/list-user-subscriptions-query.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';
import { ListPaymentsQueryDto } from './dto/list-payments-query.dto';
import { EmailTemplatesService } from '../email/services/email-templates.service';
import { EntitlementsService } from '../entitlements/entitlements.service';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    private prisma: PrismaService,
    private emailTemplatesService: EmailTemplatesService,
    private configService: ConfigService,
    private entitlementsService: EntitlementsService,
  ) {}

  // ========== Subscription Management ==========

  async createSubscription(
    createSubscriptionDto: CreateSubscriptionDto,
    userId: number,
  ): Promise<SubscriptionResponseDto> {
    try {
      // Check if subscription name already exists
      const existingSubscription = await this.prisma.subscription.findFirst({
        where: { subscription_name: createSubscriptionDto.subscription_name },
        select: { id: true },
      });

      if (existingSubscription) {
        throw new ConflictException(
          'Subscription with this name already exists',
        );
      }

      let currencyId: number | null = null;
      if (createSubscriptionDto.subscription_currency) {
        const currency = await this.prisma.currency.findFirst({
          where: {
            OR: [
              { currency_code: createSubscriptionDto.subscription_currency },
              { currency_symbol: createSubscriptionDto.subscription_currency },
              { currency_name: createSubscriptionDto.subscription_currency },
            ],
          },
        });
        if (currency) {
          currencyId = currency.id;
        }
      }

      const savedSubscription = await this.prisma.subscription.create({
        data: {
          ...createSubscriptionDto,
          currency_id: currencyId,
          is_active: createSubscriptionDto.is_active ?? true,
          created_by: userId,
        },
      });

      return this.mapSubscriptionToResponseDto(savedSubscription);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      this.logger.error(
        `Error creating subscription: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        `Failed to create subscription: ${error.message}`,
      );
    }
  }

  async getSubscriptions(listQueryDto: ListSubscriptionsQueryDto): Promise<{
    data: SubscriptionResponseDto[];
    meta: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  }> {
    const {
      page = 1,
      limit = 10,
      search,
      sort_by = 'created_at',
      sort_order = 'DESC',
      subscription_type,
      is_active,
    } = listQueryDto;

    const skip = (page - 1) * limit;
    const sortOrderLower = sort_order.toLowerCase() as 'asc' | 'desc';

    const where: any = {};

    if (subscription_type) {
      where.subscription_type = subscription_type;
    }

    if (is_active !== undefined) {
      where.is_active = is_active === ActiveStatus.ACTIVE;
    }

    if (search) {
      where.OR = [
        { subscription_name: { contains: search } },
        { subscription_description: { contains: search } },
      ];
    }

    const [subscriptions, total] = await Promise.all([
      this.prisma.subscription.findMany({
        where,
        include: { currency: true },
        orderBy: { [sort_by]: sortOrderLower },
        skip,
        take: limit,
      }),
      this.prisma.subscription.count({ where }),
    ]);

    return {
      data: subscriptions.map((sub) => this.mapSubscriptionToResponseDto(sub)),
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  async getSubscriptionById(id: number): Promise<SubscriptionResponseDto> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: { currency: true },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return this.mapSubscriptionToResponseDto(subscription);
  }

  async updateSubscription(
    id: number,
    updateSubscriptionDto: UpdateSubscriptionDto,
    userId: number,
  ): Promise<SubscriptionResponseDto> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: { currency: true },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // Check if subscription name is being updated and if it already exists
    if (
      updateSubscriptionDto.subscription_name &&
      updateSubscriptionDto.subscription_name !== subscription.subscription_name
    ) {
      const existingSubscription = await this.prisma.subscription.findFirst({
        where: { subscription_name: updateSubscriptionDto.subscription_name },
        select: { id: true },
      });

      if (existingSubscription) {
        throw new ConflictException(
          'Subscription with this name already exists',
        );
      }
    }

    const updateData: any = { ...updateSubscriptionDto, updated_by: userId };

    if (updateSubscriptionDto.subscription_currency) {
      const currency = await this.prisma.currency.findFirst({
        where: {
          OR: [
            { currency_code: updateSubscriptionDto.subscription_currency },
            { currency_symbol: updateSubscriptionDto.subscription_currency },
            { currency_name: updateSubscriptionDto.subscription_currency },
          ],
        },
      });
      if (currency) {
        updateData.currency_id = currency.id;
      }
    }

    const updatedSubscription = await this.prisma.subscription.update({
      where: { id },
      data: updateData,
      include: { currency: true },
    });

    // If plan features changed, invalidate cache for ALL users on this plan
    if (updateSubscriptionDto.features !== undefined) {
      await this.entitlementsService.invalidatePlan(id);
    }

    return this.mapSubscriptionToResponseDto(updatedSubscription);
  }

  async deleteSubscription(
    id: number,
    userId: number,
  ): Promise<{ message: string }> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // Check if subscription has active user subscriptions
    const activeUserSubscriptions = await this.prisma.userSubscription.count({
      where: { subscription_id: id, is_active: true },
    });

    if (activeUserSubscriptions > 0) {
      throw new BadRequestException(
        'Cannot delete subscription with active user subscriptions. Please deactivate user subscriptions first.',
      );
    }

    await this.prisma.subscription.update({
      where: { id },
      data: { is_active: false, updated_by: userId },
    });

    return { message: 'Subscription deleted successfully' };
  }

  async getActiveSubscriptions(): Promise<SubscriptionResponseDto[]> {
    const subscriptions = await this.prisma.subscription.findMany({
      where: { is_active: true },
      include: { currency: true },
      orderBy: { created_at: 'desc' },
    });

    return subscriptions.map((sub) => this.mapSubscriptionToResponseDto(sub));
  }

  // ========== User Subscription Management ==========

  async createUserSubscription(
    createUserSubscriptionDto: CreateUserSubscriptionDto,
    userId: number,
  ): Promise<UserSubscriptionResponseDto> {
    try {
      // Verify subscription exists
      const subscription = await this.prisma.subscription.findFirst({
        where: {
          id: createUserSubscriptionDto.subscription_id,
          is_active: true,
        },
      });

      if (!subscription) {
        throw new NotFoundException('Subscription not found or inactive');
      }

      // Check if user already has this subscription
      const existingUserSubscription =
        await this.prisma.userSubscription.findFirst({
          where: {
            user_id: userId,
            subscription_id: createUserSubscriptionDto.subscription_id,
          },
        });

      if (existingUserSubscription) {
        throw new ConflictException('User already has this subscription');
      }

      // Calculate dates if not provided
      const startDate = createUserSubscriptionDto.subscription_start_date
        ? new Date(createUserSubscriptionDto.subscription_start_date)
        : new Date();

      // Calculate end date based on subscription duration
      const endDate = createUserSubscriptionDto.subscription_end_date
        ? new Date(createUserSubscriptionDto.subscription_end_date)
        : this.calculateEndDate(
            startDate,
            subscription.subscription_duration,
            subscription.subscription_duration_type,
          );

      const savedUserSubscription = await this.prisma.userSubscription.create({
        data: {
          user_id: userId,
          subscription_id: createUserSubscriptionDto.subscription_id,
          subscription_start_date: startDate,
          subscription_end_date: endDate,
          subscription_renewal_type:
            createUserSubscriptionDto.subscription_renewal_type,
          subscription_renewal_date:
            createUserSubscriptionDto.subscription_renewal_date
              ? new Date(createUserSubscriptionDto.subscription_renewal_date)
              : null,
          subscription_renewal_amount:
            createUserSubscriptionDto.subscription_renewal_amount ||
            subscription.subscription_price,
          subscription_renewal_currency:
            createUserSubscriptionDto.subscription_renewal_currency || 'USD',
          subscription_renewal_gateway:
            createUserSubscriptionDto.subscription_renewal_gateway,
          subscription_status: 'pending',
          is_active: true,
          created_by: userId,
        },
      });

      // Invalidate entitlements cache so new feature set takes effect immediately
      await this.entitlementsService.invalidate(userId);

      // Send subscription reminder email if status is PENDING
      if (savedUserSubscription.subscription_status === 'pending') {
        try {
          const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, username: true },
          });

          if (user && user.email) {
            const reminderHours = this.configService.get<number>(
              'app.subscription.pendingReminderHours',
              24,
            );
            await this.emailTemplatesService.sendSubscriptionReminderEmail({
              recipientEmail: user.email,
              recipientName: user.username,
              subscriptionName: subscription.subscription_name,
              amount:
                (savedUserSubscription.subscription_renewal_amount?.toNumber() ??
                  0) ||
                (subscription.subscription_price?.toNumber() ?? 0),
              currency:
                savedUserSubscription.subscription_renewal_currency || 'USD',
              hoursRemaining: reminderHours,
            });
          }
        } catch (error) {
          this.logger.error(
            'Failed to send subscription reminder email:',
            error,
          );
        }
      }

      return this.mapUserSubscriptionToResponseDto(savedUserSubscription);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      this.logger.error(
        `Error creating user subscription: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        `Failed to create user subscription: ${error.message}`,
      );
    }
  }

  async getUserSubscriptions(
    listQueryDto: ListUserSubscriptionsQueryDto,
    userId?: number,
  ): Promise<{
    data: UserSubscriptionResponseDto[];
    meta: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  }> {
    const {
      page = 1,
      limit = 10,
      search,
      sort_by = 'created_at',
      sort_order = 'DESC',
      user_id,
      subscription_id,
      subscription_status,
      is_active,
    } = listQueryDto;

    const skip = (page - 1) * limit;
    const sortOrderLower = sort_order.toLowerCase() as 'asc' | 'desc';

    const where: any = {};

    const targetUserId = user_id || userId;
    if (targetUserId) {
      where.user_id = targetUserId;
    }

    if (subscription_id) {
      where.subscription_id = subscription_id;
    }

    if (subscription_status) {
      where.subscription_status = subscription_status;
    }

    if (is_active !== undefined) {
      where.is_active = is_active === ActiveStatus.ACTIVE;
    }

    if (search) {
      where.subscription = {
        OR: [
          { subscription_name: { contains: search } },
          { subscription_description: { contains: search } },
        ],
      };
    }

    const [userSubscriptions, total] = await Promise.all([
      this.prisma.userSubscription.findMany({
        where,
        include: { subscription: true },
        orderBy: { [sort_by]: sortOrderLower },
        skip,
        take: limit,
      }),
      this.prisma.userSubscription.count({ where }),
    ]);

    return {
      data: userSubscriptions.map((us) =>
        this.mapUserSubscriptionToResponseDto(us),
      ),
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  async getUserSubscriptionById(
    id: number,
    userId?: number,
  ): Promise<UserSubscriptionResponseDto> {
    const where: any = { id };
    if (userId) {
      where.user_id = userId;
    }

    const userSubscription = await this.prisma.userSubscription.findFirst({
      where,
      include: { subscription: { include: { currency: true } } },
    });

    if (!userSubscription) {
      throw new NotFoundException('User subscription not found');
    }

    return this.mapUserSubscriptionToResponseDto(userSubscription);
  }

  async updateUserSubscriptionStatus(
    id: number,
    status: string,
    userId: number,
  ): Promise<UserSubscriptionResponseDto> {
    const userSubscription = await this.prisma.userSubscription.findUnique({
      where: { id },
    });

    if (!userSubscription) {
      throw new NotFoundException('User subscription not found');
    }

    const updateData: any = { subscription_status: status, updated_by: userId };

    // If activating, set start date if not set
    if (status === 'active' && !userSubscription.subscription_start_date) {
      updateData.subscription_start_date = new Date();
    }

    const updatedUserSubscription = await this.prisma.userSubscription.update({
      where: { id },
      data: updateData,
    });

    return this.mapUserSubscriptionToResponseDto(updatedUserSubscription);
  }

  async cancelUserSubscription(
    id: number,
    userId: number,
  ): Promise<{ message: string }> {
    const userSubscription = await this.prisma.userSubscription.findFirst({
      where: { id, user_id: userId },
    });

    if (!userSubscription) {
      throw new NotFoundException('User subscription not found');
    }

    await this.prisma.userSubscription.update({
      where: { id },
      data: {
        subscription_status: 'inactive',
        is_active: false,
        updated_by: userId,
      },
    });

    // Invalidate entitlements cache so user loses premium features immediately
    await this.entitlementsService.invalidate(userId);

    return { message: 'Subscription cancelled successfully' };
  }

  // ========== Payment Management ==========

  async createPayment(
    createPaymentDto: CreatePaymentDto,
    userId: number,
  ): Promise<PaymentResponseDto> {
    try {
      // Verify user subscription exists
      const userSubscription = await this.prisma.userSubscription.findUnique({
        where: { id: createPaymentDto.users_subscriptions_id },
      });

      if (!userSubscription) {
        throw new NotFoundException('User subscription not found');
      }

      // Check if payment already exists for this subscription
      const existingPayment = await this.prisma.payment.findFirst({
        where: {
          users_subscriptions_id: createPaymentDto.users_subscriptions_id,
          user_id: userSubscription.user_id,
        },
      });

      if (existingPayment) {
        throw new ConflictException(
          'Payment already exists for this subscription',
        );
      }

      const savedPayment = await this.prisma.payment.create({
        data: {
          ...createPaymentDto,
          user_id: userSubscription.user_id,
          created_by: userId,
        },
      });

      // Update user subscription status if payment is completed
      if (createPaymentDto.payment_status === 'completed') {
        const updateData: any = { subscription_status: 'active' };
        if (!userSubscription.subscription_start_date) {
          updateData.subscription_start_date = new Date();
        }
        await this.prisma.userSubscription.update({
          where: { id: userSubscription.id },
          data: updateData,
        });

        // Send subscription confirmation email
        try {
          const user = await this.prisma.user.findUnique({
            where: { id: userSubscription.user_id },
            select: { id: true, email: true, username: true },
          });

          if (user && user.email) {
            const subscription = await this.prisma.subscription.findUnique({
              where: { id: userSubscription.subscription_id },
            });

            if (subscription && userSubscription.subscription_end_date) {
              const startDate =
                updateData.subscription_start_date ||
                userSubscription.subscription_start_date;
              await this.emailTemplatesService.sendSubscriptionConfirmationEmail(
                {
                  recipientEmail: user.email,
                  recipientName: user.username,
                  subscriptionName: subscription.subscription_name,
                  subscriptionType: subscription.subscription_type,
                  amount: savedPayment.payment_amount?.toNumber() ?? 0,
                  currency: savedPayment.payment_currency,
                  startDate,
                  endDate: userSubscription.subscription_end_date,
                  renewalDate:
                    userSubscription.subscription_renewal_date || undefined,
                },
              );
            }
          }
        } catch (error) {
          this.logger.error(
            'Failed to send subscription confirmation email:',
            error,
          );
        }
      }

      return this.mapPaymentToResponseDto(savedPayment);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      this.logger.error(
        `Error creating payment: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        `Failed to create payment: ${error.message}`,
      );
    }
  }

  async getPayments(
    listQueryDto: ListPaymentsQueryDto,
    userId?: number,
  ): Promise<{
    data: PaymentResponseDto[];
    meta: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  }> {
    const {
      page = 1,
      limit = 10,
      search,
      sort_by = 'created_at',
      sort_order = 'DESC',
      user_id,
      users_subscriptions_id,
      payment_status,
      payment_method,
    } = listQueryDto;

    const skip = (page - 1) * limit;
    const sortOrderLower = sort_order.toLowerCase() as 'asc' | 'desc';

    const where: any = {};

    const targetUserId = user_id || userId;
    if (targetUserId) {
      where.user_id = targetUserId;
    }

    if (users_subscriptions_id) {
      where.users_subscriptions_id = users_subscriptions_id;
    }

    if (payment_status) {
      where.payment_status = payment_status;
    }

    if (payment_method) {
      where.payment_method = payment_method;
    }

    if (search) {
      where.OR = [
        { payment_transaction_id: { contains: search } },
        { payment_gateway: { contains: search } },
      ];
    }

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        include: {
          user_subscription: { include: { subscription: true } },
          currency: true,
        },
        orderBy: { [sort_by]: sortOrderLower },
        skip,
        take: limit,
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      data: payments.map((payment) => this.mapPaymentToResponseDto(payment)),
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  async getPaymentById(
    id: number,
    userId?: number,
  ): Promise<PaymentResponseDto> {
    const where: any = { id };
    if (userId) {
      where.user_id = userId;
    }

    const payment = await this.prisma.payment.findFirst({
      where,
      include: {
        user_subscription: { include: { subscription: true } },
        currency: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return this.mapPaymentToResponseDto(payment);
  }

  async updatePaymentStatus(
    id: number,
    status: string,
    userId: number,
  ): Promise<PaymentResponseDto> {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        user_subscription: { include: { subscription: true } },
        currency: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const updatedPayment = await this.prisma.payment.update({
      where: { id },
      data: { payment_status: status as any, updated_by: userId },
      include: {
        user_subscription: { include: { subscription: true } },
        currency: true,
      },
    });

    // Update user subscription status if payment is completed
    if (status === 'completed' && payment.user_subscription) {
      const updateSubData: any = { subscription_status: 'active' };
      if (!payment.user_subscription.subscription_start_date) {
        updateSubData.subscription_start_date = new Date();
      }
      await this.prisma.userSubscription.update({
        where: { id: payment.user_subscription.id },
        data: updateSubData,
      });

      // Send subscription confirmation email
      try {
        const userSubForEmail = await this.prisma.userSubscription.findUnique({
          where: { id: payment.user_subscription.id },
        });
        const user = await this.prisma.user.findUnique({
          where: { id: payment.user_subscription.user_id },
          select: { id: true, email: true, username: true },
        });

        if (
          user &&
          user.email &&
          payment.user_subscription.subscription &&
          userSubForEmail?.subscription_end_date
        ) {
          const startDate =
            updateSubData.subscription_start_date ||
            payment.user_subscription.subscription_start_date;
          await this.emailTemplatesService.sendSubscriptionConfirmationEmail({
            recipientEmail: user.email,
            recipientName: user.username,
            subscriptionName:
              payment.user_subscription.subscription.subscription_name,
            subscriptionType:
              payment.user_subscription.subscription.subscription_type,
            amount: updatedPayment.payment_amount?.toNumber() ?? 0,
            currency: updatedPayment.payment_currency,
            startDate,
            endDate: userSubForEmail.subscription_end_date,
            renewalDate:
              payment.user_subscription.subscription_renewal_date || undefined,
          });
        }
      } catch (error) {
        this.logger.error(
          'Failed to send subscription confirmation email:',
          error,
        );
      }
    }

    return this.mapPaymentToResponseDto(updatedPayment);
  }

  // ========== Helper Methods ==========

  private calculateEndDate(
    startDate: Date,
    duration: number,
    durationType: string,
  ): Date {
    const endDate = new Date(startDate);

    switch (durationType) {
      case 'days':
        endDate.setDate(endDate.getDate() + duration);
        break;
      case 'weeks':
        endDate.setDate(endDate.getDate() + duration * 7);
        break;
      case 'months':
        endDate.setMonth(endDate.getMonth() + duration);
        break;
      case 'years':
        endDate.setFullYear(endDate.getFullYear() + duration);
        break;
      default:
        endDate.setDate(endDate.getDate() + duration);
    }

    return endDate;
  }

  private mapSubscriptionToResponseDto(
    subscription: any,
  ): SubscriptionResponseDto {
    return {
      id: subscription.id,
      subscription_type: subscription.subscription_type,
      subscription_name: subscription.subscription_name,
      subscription_description: subscription.subscription_description,
      subscription_price: Number(subscription.subscription_price),
      subscription_duration: subscription.subscription_duration,
      subscription_duration_type: subscription.subscription_duration_type,
      is_active: subscription.is_active,
      created_by: subscription.created_by,
      updated_by: subscription.updated_by,
      created_at: subscription.created_at,
      updated_at: subscription.updated_at,
      subscription_currency: subscription.subscription_currency,
      currency_id: subscription.currency_id,
      currency: subscription.currency,
    };
  }

  private mapUserSubscriptionToResponseDto(
    userSubscription: any,
  ): UserSubscriptionResponseDto {
    return {
      id: userSubscription.id,
      user_id: userSubscription.user_id,
      subscription_id: userSubscription.subscription_id,
      subscription_start_date: userSubscription.subscription_start_date,
      subscription_end_date: userSubscription.subscription_end_date,
      subscription_renewal_type: userSubscription.subscription_renewal_type,
      subscription_renewal_date: userSubscription.subscription_renewal_date,
      subscription_renewal_amount: Number(
        userSubscription.subscription_renewal_amount,
      ),
      subscription_renewal_currency:
        userSubscription.subscription_renewal_currency,
      subscription_renewal_gateway:
        userSubscription.subscription_renewal_gateway,
      subscription_status: userSubscription.subscription_status,
      is_active: userSubscription.is_active,
      created_by: userSubscription.created_by,
      updated_by: userSubscription.updated_by,
      created_at: userSubscription.created_at,
      updated_at: userSubscription.updated_at,
      ...(userSubscription.subscription && {
        subscription: this.mapSubscriptionToResponseDto(
          userSubscription.subscription,
        ),
      }),
    };
  }

  private mapPaymentToResponseDto(payment: any): PaymentResponseDto {
    return {
      id: payment.id,
      users_subscriptions_id: payment.users_subscriptions_id,
      user_id: payment.user_id,
      payment_amount: Number(payment.payment_amount),
      payment_status: payment.payment_status,
      payment_method: payment.payment_method,
      payment_currency: payment.payment_currency,
      payment_gateway: payment.payment_gateway,
      payment_transaction_id: payment.payment_transaction_id,
      created_by: payment.created_by,
      updated_by: payment.updated_by,
      created_at: payment.created_at,
      updated_at: payment.updated_at,
      currency_id: payment.currency_id,
      currency: payment.currency,
      ...(payment.user_subscription && {
        user_subscription: this.mapUserSubscriptionToResponseDto(
          payment.user_subscription,
        ),
      }),
    };
  }
}
