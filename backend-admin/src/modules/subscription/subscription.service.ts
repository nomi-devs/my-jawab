import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, MoreThan, LessThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Subscription } from './entities/subscription.entity';
import { UserSubscription, SubscriptionStatus } from './entities/user-subscription.entity';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { User } from '../auth/entities/user.entity';
import { Currency } from '../currency/entities/currency.entity';
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
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(UserSubscription)
    private userSubscriptionRepository: Repository<UserSubscription>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Currency)
    private currencyRepository: Repository<Currency>,
    private emailTemplatesService: EmailTemplatesService,
    private configService: ConfigService,
    private entitlementsService: EntitlementsService,
  ) { }

  // ========== Subscription Management ==========

  async createSubscription(
    createSubscriptionDto: CreateSubscriptionDto,
    userId: number,
  ): Promise<SubscriptionResponseDto> {
    try {
      // Check if subscription name already exists
      const existingSubscription = await this.subscriptionRepository.findOne({
        where: { subscription_name: createSubscriptionDto.subscription_name },
        select: ['id'],
      });

      if (existingSubscription) {
        throw new ConflictException('Subscription with this name already exists');
      }

      let currencyId: number | null = null;
      if (createSubscriptionDto.subscription_currency) {
        const currency = await this.currencyRepository.findOne({
          where: [
            { currency_code: createSubscriptionDto.subscription_currency },
            { currency_symbol: createSubscriptionDto.subscription_currency },
            { currency_name: createSubscriptionDto.subscription_currency },
          ],
        });
        if (currency) {
          currencyId = currency.id;
        }
      }

      const subscription = this.subscriptionRepository.create({
        ...createSubscriptionDto,
        currency_id: currencyId,
        is_active: createSubscriptionDto.is_active ?? true,
        created_by: userId,
      });

      const savedSubscription = await this.subscriptionRepository.save(subscription);
      return this.mapSubscriptionToResponseDto(savedSubscription);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      this.logger.error(`Error creating subscription: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to create subscription: ${error.message}`);
    }
  }

  async getSubscriptions(
    listQueryDto: ListSubscriptionsQueryDto,
  ): Promise<{
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

    const queryBuilder = this.subscriptionRepository.createQueryBuilder('subscription')
      .leftJoinAndSelect('subscription.currency', 'currency');

    if (subscription_type) {
      queryBuilder.andWhere('subscription.subscription_type = :subscription_type', {
        subscription_type,
      });
    }

    if (is_active !== undefined) {
      const activeValue = is_active === ActiveStatus.ACTIVE;
      queryBuilder.andWhere('subscription.is_active = :is_active', { is_active: activeValue });
    }

    if (search) {
      queryBuilder.andWhere(
        '(subscription.subscription_name LIKE :search OR subscription.subscription_description LIKE :search)',
        { search: `%${search}%` },
      );
    }

    queryBuilder.orderBy(`subscription.${sort_by}`, sort_order);

    const total = await queryBuilder.getCount();
    queryBuilder.skip(skip).take(limit);

    const subscriptions = await queryBuilder.getMany();

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
    const subscription = await this.subscriptionRepository.findOne({
      where: { id },
      relations: ['currency'],
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
    const subscription = await this.subscriptionRepository.findOne({
      where: { id },
      relations: ['currency'],
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // Check if subscription name is being updated and if it already exists
    if (
      updateSubscriptionDto.subscription_name &&
      updateSubscriptionDto.subscription_name !== subscription.subscription_name
    ) {
      const existingSubscription = await this.subscriptionRepository.findOne({
        where: { subscription_name: updateSubscriptionDto.subscription_name },
        select: ['id'],
      });

      if (existingSubscription) {
        throw new ConflictException('Subscription with this name already exists');
      }
    }

    if (updateSubscriptionDto.subscription_currency) {
      const currency = await this.currencyRepository.findOne({
        where: [
          { currency_code: updateSubscriptionDto.subscription_currency },
          { currency_symbol: updateSubscriptionDto.subscription_currency },
          { currency_name: updateSubscriptionDto.subscription_currency },
        ],
      });
      if (currency) {
        subscription.currency_id = currency.id;
      }
    }

    Object.assign(subscription, updateSubscriptionDto);
    subscription.updated_by = userId;

    const updatedSubscription = await this.subscriptionRepository.save(subscription);

    // If plan features changed, invalidate cache for ALL users on this plan
    if (updateSubscriptionDto.features !== undefined) {
      await this.entitlementsService.invalidatePlan(id);
    }

    return this.mapSubscriptionToResponseDto(updatedSubscription);
  }

  async deleteSubscription(id: number, userId: number): Promise<{ message: string }> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // Check if subscription has active user subscriptions
    const activeUserSubscriptions = await this.userSubscriptionRepository.count({
      where: { subscription_id: id, is_active: true },
    });

    if (activeUserSubscriptions > 0) {
      throw new BadRequestException(
        'Cannot delete subscription with active user subscriptions. Please deactivate user subscriptions first.',
      );
    }

    subscription.is_active = false;
    subscription.updated_by = userId;
    await this.subscriptionRepository.save(subscription);

    return { message: 'Subscription deleted successfully' };
  }

  async getActiveSubscriptions(): Promise<SubscriptionResponseDto[]> {
    const subscriptions = await this.subscriptionRepository.find({
      where: { is_active: true },
      relations: ['currency'],
      order: { created_at: 'DESC' },
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
      const subscription = await this.subscriptionRepository.findOne({
        where: { id: createUserSubscriptionDto.subscription_id, is_active: true },
      });

      if (!subscription) {
        throw new NotFoundException('Subscription not found or inactive');
      }

      // Check if user already has this subscription
      const existingUserSubscription = await this.userSubscriptionRepository.findOne({
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
        : this.calculateEndDate(startDate, subscription.subscription_duration, subscription.subscription_duration_type);

      const userSubscription = this.userSubscriptionRepository.create({
        user_id: userId,
        subscription_id: createUserSubscriptionDto.subscription_id,
        subscription_start_date: startDate,
        subscription_end_date: endDate,
        subscription_renewal_type: createUserSubscriptionDto.subscription_renewal_type,
        subscription_renewal_date: createUserSubscriptionDto.subscription_renewal_date
          ? new Date(createUserSubscriptionDto.subscription_renewal_date)
          : null,
        subscription_renewal_amount: createUserSubscriptionDto.subscription_renewal_amount || subscription.subscription_price,
        subscription_renewal_currency: createUserSubscriptionDto.subscription_renewal_currency || 'USD',
        subscription_renewal_gateway: createUserSubscriptionDto.subscription_renewal_gateway,
        subscription_status: SubscriptionStatus.PENDING,
        is_active: true,
        created_by: userId,
      });

      const savedUserSubscription = await this.userSubscriptionRepository.save(userSubscription);

      // Invalidate entitlements cache so new feature set takes effect immediately
      await this.entitlementsService.invalidate(userId);

      // Send subscription reminder email if status is PENDING
      if (savedUserSubscription.subscription_status === SubscriptionStatus.PENDING) {
        try {
          const user = await this.userRepository.findOne({
            where: { id: userId },
            select: ['id', 'email', 'username'],
          });

          if (user && user.email) {
            const reminderHours = this.configService.get<number>('app.subscription.pendingReminderHours', 24);
            await this.emailTemplatesService.sendSubscriptionReminderEmail({
              recipientEmail: user.email,
              recipientName: user.username,
              subscriptionName: subscription.subscription_name,
              amount: savedUserSubscription.subscription_renewal_amount || subscription.subscription_price,
              currency: savedUserSubscription.subscription_renewal_currency || 'USD',
              hoursRemaining: reminderHours,
            });
          }
        } catch (error) {
          this.logger.error('Failed to send subscription reminder email:', error);
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
      this.logger.error(`Error creating user subscription: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to create user subscription: ${error.message}`);
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

    const queryBuilder = this.userSubscriptionRepository
      .createQueryBuilder('user_subscription')
      .leftJoinAndSelect('user_subscription.subscription', 'subscription');

    // If userId is provided, filter by it (for user's own subscriptions)
    const targetUserId = user_id || userId;
    if (targetUserId) {
      queryBuilder.andWhere('user_subscription.user_id = :targetUserId', {
        targetUserId,
      });
    }

    if (subscription_id) {
      queryBuilder.andWhere('user_subscription.subscription_id = :subscription_id', {
        subscription_id,
      });
    }

    if (subscription_status) {
      queryBuilder.andWhere('user_subscription.subscription_status = :subscription_status', {
        subscription_status,
      });
    }

    if (is_active !== undefined) {
      const activeValue = is_active === ActiveStatus.ACTIVE;
      queryBuilder.andWhere('user_subscription.is_active = :is_active', { is_active: activeValue });
    }

    if (search) {
      queryBuilder.andWhere(
        '(subscription.subscription_name LIKE :search OR subscription.subscription_description LIKE :search)',
        { search: `%${search}%` },
      );
    }

    queryBuilder.orderBy(`user_subscription.${sort_by}`, sort_order);

    const total = await queryBuilder.getCount();
    queryBuilder.skip(skip).take(limit);

    const userSubscriptions = await queryBuilder.getMany();

    return {
      data: userSubscriptions.map((us) => this.mapUserSubscriptionToResponseDto(us)),
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  async getUserSubscriptionById(id: number, userId?: number): Promise<UserSubscriptionResponseDto> {
    const where: FindOptionsWhere<UserSubscription> = { id };
    if (userId) {
      where.user_id = userId;
    }

    const userSubscription = await this.userSubscriptionRepository.findOne({
      where,
      relations: ['subscription', 'subscription.currency'],
    });

    if (!userSubscription) {
      throw new NotFoundException('User subscription not found');
    }

    return this.mapUserSubscriptionToResponseDto(userSubscription);
  }

  async updateUserSubscriptionStatus(
    id: number,
    status: SubscriptionStatus,
    userId: number,
  ): Promise<UserSubscriptionResponseDto> {
    const userSubscription = await this.userSubscriptionRepository.findOne({
      where: { id },
    });

    if (!userSubscription) {
      throw new NotFoundException('User subscription not found');
    }

    userSubscription.subscription_status = status;
    userSubscription.updated_by = userId;

    // If activating, set start date if not set
    if (status === SubscriptionStatus.ACTIVE && !userSubscription.subscription_start_date) {
      userSubscription.subscription_start_date = new Date();
    }

    const updatedUserSubscription = await this.userSubscriptionRepository.save(userSubscription);
    return this.mapUserSubscriptionToResponseDto(updatedUserSubscription);
  }

  async cancelUserSubscription(
    id: number,
    userId: number,
  ): Promise<{ message: string }> {
    const userSubscription = await this.userSubscriptionRepository.findOne({
      where: { id, user_id: userId },
    });

    if (!userSubscription) {
      throw new NotFoundException('User subscription not found');
    }

    userSubscription.subscription_status = SubscriptionStatus.INACTIVE;
    userSubscription.is_active = false;
    userSubscription.updated_by = userId;

    await this.userSubscriptionRepository.save(userSubscription);

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
      const userSubscription = await this.userSubscriptionRepository.findOne({
        where: { id: createPaymentDto.users_subscriptions_id },
      });

      if (!userSubscription) {
        throw new NotFoundException('User subscription not found');
      }

      // Check if payment already exists for this subscription
      const existingPayment = await this.paymentRepository.findOne({
        where: {
          users_subscriptions_id: createPaymentDto.users_subscriptions_id,
          user_id: userSubscription.user_id,
        },
      });

      if (existingPayment) {
        throw new ConflictException('Payment already exists for this subscription');
      }

      const payment = this.paymentRepository.create({
        ...createPaymentDto,
        user_id: userSubscription.user_id,
        created_by: userId,
      });

      const savedPayment = await this.paymentRepository.save(payment);

      // Update user subscription status if payment is completed
      if (createPaymentDto.payment_status === PaymentStatus.COMPLETED) {
        userSubscription.subscription_status = SubscriptionStatus.ACTIVE;
        if (!userSubscription.subscription_start_date) {
          userSubscription.subscription_start_date = new Date();
        }
        await this.userSubscriptionRepository.save(userSubscription);

        // Send subscription confirmation email
        try {
          const user = await this.userRepository.findOne({
            where: { id: userSubscription.user_id },
            select: ['id', 'email', 'username'],
          });

          if (user && user.email) {
            const subscription = await this.subscriptionRepository.findOne({
              where: { id: userSubscription.subscription_id },
            });

            if (subscription && userSubscription.subscription_end_date) {
              await this.emailTemplatesService.sendSubscriptionConfirmationEmail({
                recipientEmail: user.email,
                recipientName: user.username,
                subscriptionName: subscription.subscription_name,
                subscriptionType: subscription.subscription_type,
                amount: savedPayment.payment_amount,
                currency: savedPayment.payment_currency,
                startDate: userSubscription.subscription_start_date,
                endDate: userSubscription.subscription_end_date,
                renewalDate: userSubscription.subscription_renewal_date || undefined,
              });
            }
          }
        } catch (error) {
          this.logger.error('Failed to send subscription confirmation email:', error);
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
      this.logger.error(`Error creating payment: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to create payment: ${error.message}`);
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

    const queryBuilder = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.user_subscription', 'user_subscription')
      .leftJoinAndSelect('user_subscription.subscription', 'subscription')
      .leftJoinAndSelect('payment.currency', 'currency');

    const targetUserId = user_id || userId;
    if (targetUserId) {
      queryBuilder.andWhere('payment.user_id = :targetUserId', { targetUserId });
    }

    if (users_subscriptions_id) {
      queryBuilder.andWhere('payment.users_subscriptions_id = :users_subscriptions_id', {
        users_subscriptions_id,
      });
    }

    if (payment_status) {
      queryBuilder.andWhere('payment.payment_status = :payment_status', { payment_status });
    }

    if (payment_method) {
      queryBuilder.andWhere('payment.payment_method = :payment_method', { payment_method });
    }

    if (search) {
      queryBuilder.andWhere(
        '(payment.payment_transaction_id LIKE :search OR payment.payment_gateway LIKE :search)',
        { search: `%${search}%` },
      );
    }

    queryBuilder.orderBy(`payment.${sort_by}`, sort_order);

    const total = await queryBuilder.getCount();
    queryBuilder.skip(skip).take(limit);

    const payments = await queryBuilder.getMany();

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

  async getPaymentById(id: number, userId?: number): Promise<PaymentResponseDto> {
    const where: FindOptionsWhere<Payment> = { id };
    if (userId) {
      where.user_id = userId;
    }

    const payment = await this.paymentRepository.findOne({
      where,
      relations: ['user_subscription', 'user_subscription.subscription', 'currency'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return this.mapPaymentToResponseDto(payment);
  }

  async updatePaymentStatus(
    id: number,
    status: PaymentStatus,
    userId: number,
  ): Promise<PaymentResponseDto> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['user_subscription', 'user_subscription.subscription', 'currency'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    payment.payment_status = status;
    payment.updated_by = userId;

    const updatedPayment = await this.paymentRepository.save(payment);

    // Update user subscription status if payment is completed
    if (status === PaymentStatus.COMPLETED && payment.user_subscription) {
      payment.user_subscription.subscription_status = SubscriptionStatus.ACTIVE;
      if (!payment.user_subscription.subscription_start_date) {
        payment.user_subscription.subscription_start_date = new Date();
      }
      await this.userSubscriptionRepository.save(payment.user_subscription);

      // Send subscription confirmation email
      try {
        const user = await this.userRepository.findOne({
          where: { id: payment.user_subscription.user_id },
          select: ['id', 'email', 'username'],
        });

        if (user && user.email && payment.user_subscription.subscription && payment.user_subscription.subscription_end_date) {
          await this.emailTemplatesService.sendSubscriptionConfirmationEmail({
            recipientEmail: user.email,
            recipientName: user.username,
            subscriptionName: payment.user_subscription.subscription.subscription_name,
            subscriptionType: payment.user_subscription.subscription.subscription_type,
            amount: updatedPayment.payment_amount,
            currency: updatedPayment.payment_currency,
            startDate: payment.user_subscription.subscription_start_date,
            endDate: payment.user_subscription.subscription_end_date,
            renewalDate: payment.user_subscription.subscription_renewal_date || undefined,
          });
        }
      } catch (error) {
        this.logger.error('Failed to send subscription confirmation email:', error);
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
    subscription: Subscription,
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
    userSubscription: UserSubscription,
  ): UserSubscriptionResponseDto {
    return {
      id: userSubscription.id,
      user_id: userSubscription.user_id,
      subscription_id: userSubscription.subscription_id,
      subscription_start_date: userSubscription.subscription_start_date,
      subscription_end_date: userSubscription.subscription_end_date,
      subscription_renewal_type: userSubscription.subscription_renewal_type,
      subscription_renewal_date: userSubscription.subscription_renewal_date,
      subscription_renewal_amount: Number(userSubscription.subscription_renewal_amount),
      subscription_renewal_currency: userSubscription.subscription_renewal_currency,
      subscription_renewal_gateway: userSubscription.subscription_renewal_gateway,
      subscription_status: userSubscription.subscription_status,
      is_active: userSubscription.is_active,
      created_by: userSubscription.created_by,
      updated_by: userSubscription.updated_by,
      created_at: userSubscription.created_at,
      updated_at: userSubscription.updated_at,
      ...(userSubscription.subscription && {
        subscription: this.mapSubscriptionToResponseDto(userSubscription.subscription),
      }),
    };
  }

  private mapPaymentToResponseDto(payment: Payment): PaymentResponseDto {
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
        user_subscription: this.mapUserSubscriptionToResponseDto(payment.user_subscription),
      }),
    };
  }
}

