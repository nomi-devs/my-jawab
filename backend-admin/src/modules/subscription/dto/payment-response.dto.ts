import { PaymentStatus, PaymentMethod } from '@prisma/client';
import { UserSubscriptionResponseDto } from './user-subscription-response.dto';

export class PaymentResponseDto {
  id: number;
  users_subscriptions_id: number;
  user_id: number;
  payment_amount: number;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  payment_currency: string;
  payment_gateway: string;
  payment_transaction_id: string;
  created_by: number | null;
  updated_by: number | null;
  created_at: Date;
  updated_at: Date;
  currency_id?: number | null;
  currency?: any;
  user_subscription?: UserSubscriptionResponseDto;
}
