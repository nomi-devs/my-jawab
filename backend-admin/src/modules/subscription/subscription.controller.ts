import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service';
import { CreateUserSubscriptionDto } from './dto/create-user-subscription.dto';
import { UserSubscriptionResponseDto } from './dto/user-subscription-response.dto';
import { ListUserSubscriptionsQueryDto } from './dto/list-user-subscriptions-query.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';
import { ListPaymentsQueryDto } from './dto/list-payments-query.dto';
import { SubscriptionResponseDto } from './dto/subscription-response.dto';
import { ListSubscriptionsQueryDto } from './dto/list-subscriptions-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { SubscriptionStatus } from './entities/user-subscription.entity';
import { ActiveStatus } from '../admin/dto/list-users-query.dto';

@ApiTags('Subscriptions')
@ApiBearerAuth('JWT-auth')
@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  // Get all available subscriptions (active only for users)
  @ApiOperation({ summary: 'List active subscription plans' })
  @Get()
  @HttpCode(HttpStatus.OK)
  async getSubscriptions(
    @Query() listQueryDto: ListSubscriptionsQueryDto,
  ): Promise<{
    data: SubscriptionResponseDto[];
    meta: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  }> {
    // Only show active subscriptions to regular users
    return this.subscriptionService.getSubscriptions({
      ...listQueryDto,
      is_active: ActiveStatus.ACTIVE,
    });
  }

  // Get active subscriptions only
  @ApiOperation({ summary: 'Get active plans' })
  @Get('active')
  @HttpCode(HttpStatus.OK)
  async getActiveSubscriptions(): Promise<SubscriptionResponseDto[]> {
    return this.subscriptionService.getActiveSubscriptions();
  }

  // Get subscription by ID
  @ApiOperation({ summary: 'Get plan by ID' })
  @ApiParam({ name: 'id', type: Number })
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getSubscriptionById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SubscriptionResponseDto> {
    return this.subscriptionService.getSubscriptionById(id);
  }

  // ========== User Subscription Endpoints ==========

  // Create user subscription
  @ApiOperation({ summary: 'Subscribe to a plan' })
  @Post('subscribe')
  @HttpCode(HttpStatus.CREATED)
  async createUserSubscription(
    @GetUser() user: any,
    @Body() createUserSubscriptionDto: CreateUserSubscriptionDto,
  ): Promise<UserSubscriptionResponseDto> {
    return this.subscriptionService.createUserSubscription(
      createUserSubscriptionDto,
      user.userId,
    );
  }

  // Get user's subscriptions
  @ApiOperation({ summary: 'Get my subscriptions' })
  @Get('my/subscriptions')
  @HttpCode(HttpStatus.OK)
  async getMySubscriptions(
    @GetUser() user: any,
    @Query() listQueryDto: ListUserSubscriptionsQueryDto,
  ): Promise<{
    data: UserSubscriptionResponseDto[];
    meta: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  }> {
    return this.subscriptionService.getUserSubscriptions(
      listQueryDto,
      user.userId,
    );
  }

  // Get user subscription by ID
  @ApiOperation({ summary: 'Get my subscription by ID' })
  @ApiParam({ name: 'id', type: Number })
  @Get('my/subscriptions/:id')
  @HttpCode(HttpStatus.OK)
  async getMySubscriptionById(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: any,
  ): Promise<UserSubscriptionResponseDto> {
    return this.subscriptionService.getUserSubscriptionById(id, user.userId);
  }

  // Cancel user subscription
  @ApiOperation({ summary: 'Cancel my subscription' })
  @ApiParam({ name: 'id', type: Number })
  @Put('my/subscriptions/:id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelMySubscription(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: any,
  ): Promise<{ message: string }> {
    return this.subscriptionService.cancelUserSubscription(id, user.userId);
  }

  // ========== Payment Endpoints ==========

  // Create payment
  @ApiOperation({ summary: 'Create payment' })
  @Post('payments')
  @HttpCode(HttpStatus.CREATED)
  async createPayment(
    @GetUser() user: any,
    @Body() createPaymentDto: CreatePaymentDto,
  ): Promise<PaymentResponseDto> {
    return this.subscriptionService.createPayment(
      createPaymentDto,
      user.userId,
    );
  }

  // Get user's payments
  @ApiOperation({ summary: 'Get my payments' })
  @Get('my/payments')
  @HttpCode(HttpStatus.OK)
  async getMyPayments(
    @GetUser() user: any,
    @Query() listQueryDto: ListPaymentsQueryDto,
  ): Promise<{
    data: PaymentResponseDto[];
    meta: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  }> {
    return this.subscriptionService.getPayments(listQueryDto, user.userId);
  }

  // Get payment by ID
  @ApiOperation({ summary: 'Get my payment by ID' })
  @ApiParam({ name: 'id', type: Number })
  @Get('my/payments/:id')
  @HttpCode(HttpStatus.OK)
  async getMyPaymentById(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: any,
  ): Promise<PaymentResponseDto> {
    return this.subscriptionService.getPaymentById(id, user.userId);
  }
}
