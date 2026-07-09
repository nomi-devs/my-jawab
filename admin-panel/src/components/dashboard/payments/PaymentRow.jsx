// src/components/dashboard/payments/PaymentRow.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, CreditCard } from 'lucide-react';

const PaymentRow = ({ payment, onViewDetails }) => {
  const { t } = useTranslation('payments');

  const formatAmount = (amount, currencyCode = 'USD') => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
      }).format(amount);
    } catch (e) {
      return `${currencyCode} ${amount}`;
    }
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

  const getMethodIcon = (method) => {
    return <CreditCard className="w-4 h-4" />;
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
    <tr className="hover:bg-purple-50/50 dark:hover:bg-gray-700/30 transition-colors animate-fadeIn">
      <td className="px-4 py-2 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
              {payment.payment_transaction_id || `#${payment.id}`}
            </div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
              {payment.payment_gateway || t('notAvailable')}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-2 whitespace-nowrap">
        {payment.user_subscription?.subscription?.subscription_name && (
          <div className="text-xs text-gray-900 dark:text-gray-100">
            {payment.user_subscription.subscription.subscription_name}
          </div>
        )}
      </td>
      <td className="px-4 py-2 whitespace-nowrap">
        <div className="flex flex-col space-y-1">
          <span className="text-xs font-semibold text-gray-900 dark:text-gray-100" dir="ltr">
            {formatAmount(
              payment.payment_amount,
              payment.currency?.currency_code || payment.payment_currency,
            )}
          </span>
          <span className="text-[10px] text-gray-500 dark:text-gray-400 capitalize">
            {methodLabels[payment.payment_method] ||
              payment.payment_method?.replace('_', ' ') ||
              t('notAvailable')}
          </span>
        </div>
      </td>
      <td className="px-4 py-2 whitespace-nowrap">
        <span
          className={`inline-flex items-center w-fit px-1.5 py-0.5 rounded text-[10px] font-medium ${getStatusBadgeColor(payment.payment_status)}`}
        >
          {statusLabels[payment.payment_status] || payment.payment_status || t('notAvailable')}
        </span>
      </td>
      <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
        {payment.created_at
          ? new Date(payment.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
          : t('notAvailable')}
      </td>
      <td className="px-4 py-2 whitespace-nowrap text-end text-xs font-medium">
        <button
          onClick={() => onViewDetails && onViewDetails(payment)}
          className="p-1 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded transition-colors"
          title={t('viewDetails')}
        >
          <Eye size={14} />
        </button>
      </td>
    </tr>
  );
};

export default PaymentRow;
