import { SubscriptionRenewalType, SubscriptionStatus } from '@prisma/client';
import { SubscriptionResponseDto } from './subscription-response.dto';

export class UserSubscriptionResponseDto {
  id: number;
  user_id: number;
  subscription_id: number;
  subscription_start_date: Date | null;
  subscription_end_date: Date | null;
  subscription_renewal_type: SubscriptionRenewalType;
  subscription_renewal_date: Date | null;
  subscription_renewal_amount: number;
  subscription_renewal_currency: string;
  subscription_renewal_gateway: string;
  subscription_status: SubscriptionStatus;
  is_active: boolean;
  created_by: number | null;
  updated_by: number | null;
  created_at: Date;
  updated_at: Date;
  subscription?: SubscriptionResponseDto;
}
