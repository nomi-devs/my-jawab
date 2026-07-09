// src/components/dashboard/payments/PaymentsList.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import PaymentRow from './PaymentRow';
import PaymentCard from './PaymentCard';
import { CreditCard } from 'lucide-react';

const PaymentsList = React.memo(({ payments, loading, viewMode, onViewDetails }) => {
  const { t } = useTranslation('payments');

  if (loading && payments.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">{t('list.loading')}</p>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors">
          <CreditCard className="text-purple-600 dark:text-purple-400" size={24} />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2 transition-colors">
          {t('list.noPaymentsFound')}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 transition-colors">
          {t('list.createFirstPayment')}
        </p>
      </div>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {payments.map((payment) => (
          <PaymentCard key={payment.id} payment={payment} onViewDetails={onViewDetails} />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto" style={{ scrollbarGutter: 'stable' }}>
        <table className="w-full text-start border-collapse transition-opacity duration-300">
          <thead className="bg-purple-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs uppercase font-medium transition-colors">
            <tr>
              <th className="p-4">{t('list.columns.transaction')}</th>
              <th className="p-4">{t('list.columns.userSubscription')}</th>
              <th className="p-4">{t('list.columns.amountMethod')}</th>
              <th className="p-4">{t('common:status')}</th>
              <th className="p-4">{t('common:date')}</th>
              <th className="p-4 text-end">{t('common:actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-purple-100 dark:divide-gray-700 text-sm">
            {payments.map((payment) => (
              <PaymentRow key={payment.id} payment={payment} onViewDetails={onViewDetails} />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
});

PaymentsList.displayName = 'PaymentsList';
export default PaymentsList;
