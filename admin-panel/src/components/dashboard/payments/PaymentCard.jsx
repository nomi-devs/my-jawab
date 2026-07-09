// src/components/dashboard/payments/PaymentCard.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, CreditCard } from 'lucide-react';

const PaymentCard = ({ payment, onViewDetails }) => {
  const { t } = useTranslation('payments');

  const formatAmount = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
      case 'failed':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  };

  const statusLabels = {
    completed: t('status.completed'),
    pending: t('status.pending'),
    failed: t('status.failed'),
  };

  const methodLabels = {
    credit_card: t('methods.creditCard'),
    debit_card: t('methods.debitCard'),
    paypal: t('methods.paypal'),
    bank_transfer: t('methods.bankTransfer'),
    cash: t('methods.cash'),
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-purple-100 dark:border-gray-700 p-4 hover:shadow-md transition-shadow animate-fadeIn">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <CreditCard className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          <div>
            <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100">
              {payment.payment_transaction_id || `#${payment.id}`}
            </h4>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
              {payment.payment_gateway || t('notAvailable')}
            </p>
          </div>
        </div>
        <span
          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${getStatusBadgeColor(payment.payment_status)}`}
        >
          {statusLabels[payment.payment_status] || payment.payment_status || t('notAvailable')}
        </span>
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-gray-500 dark:text-gray-400">
            {t('paymentCard.amount')}
          </span>
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100" dir="ltr">
            {formatAmount(payment.payment_amount, payment.payment_currency)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-gray-500 dark:text-gray-400">
            {t('paymentCard.method')}
          </span>
          <span className="text-xs text-gray-700 dark:text-gray-300 capitalize">
            {methodLabels[payment.payment_method] ||
              payment.payment_method?.replace('_', ' ') ||
              t('notAvailable')}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-gray-500 dark:text-gray-400">
            {t('paymentCard.userId')}
          </span>
          <span className="text-xs text-gray-700 dark:text-gray-300">{payment.user_id}</span>
        </div>
        {payment.user_subscription?.subscription?.subscription_name && (
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-gray-500 dark:text-gray-400">
              {t('paymentCard.plan')}
            </span>
            <span className="text-xs text-gray-700 dark:text-gray-300">
              {payment.user_subscription.subscription.subscription_name}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-purple-100 dark:border-gray-700">
        <span className="text-[10px] text-gray-500 dark:text-gray-400">
          {payment.created_at
            ? new Date(payment.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            : t('notAvailable')}
        </span>
        <button
          onClick={() => onViewDetails && onViewDetails(payment)}
          className="p-1 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded transition-colors"
          title={t('viewDetails')}
        >
          <Eye size={14} />
        </button>
      </div>
    </div>
  );
};

export default PaymentCard;
