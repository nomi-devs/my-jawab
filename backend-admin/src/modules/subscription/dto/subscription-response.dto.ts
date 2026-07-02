import { SubscriptionType, SubscriptionDurationType } from '@prisma/client';

export class SubscriptionResponseDto {
  id: number;
  subscription_type: SubscriptionType;
  subscription_name: string;
  subscription_description: string | null;
  subscription_price: number;
  subscription_duration: number;
  subscription_duration_type: SubscriptionDurationType;
  is_active: boolean;
  created_by: number | null;
  updated_by: number | null;
  created_at: Date;
  updated_at: Date;
  currency_id?: number | null;
  subscription_currency?: string | null;
  currency?: any;
}
