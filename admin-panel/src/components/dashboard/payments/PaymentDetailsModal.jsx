// src/components/dashboard/payments/PaymentDetailsModal.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  CreditCard,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  User,
} from 'lucide-react';
import paymentsApi from '../../../api/paymentsApi';

const PaymentDetailsModal = ({ isOpen, onClose, paymentId, paymentData }) => {
  const { t } = useTranslation('payments');
  const [payment, setPayment] = useState(paymentData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && paymentId) {
      fetchPaymentDetails();
    }
  }, [isOpen, paymentId]);

  const fetchPaymentDetails = async () => {
    try {
      setLoading(true);
      const response = await paymentsApi.getPayment(paymentId);
      setPayment(response.data);
    } catch (err) {
      console.error('Error fetching payment details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

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

  const pay = payment || paymentData;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-[90%] h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-purple-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {loading
                ? t('common:loading')
                : `${t('detailsModal.titlePrefix')} ${pay?.payment_transaction_id || `#${pay?.id}`}`}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={18} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5" style={{ scrollbarGutter: 'stable' }}>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Payment Info */}
              <div className="bg-purple-50 dark:bg-gray-700/30 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  {t('detailsModal.paymentInformation')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-gray-500 dark:text-gray-400">
                      {t('detailsModal.amount')}
                    </label>
                    <p
                      className="text-xs font-semibold text-gray-900 dark:text-gray-100 mt-0.5"
                      dir="ltr"
                    >
                      {formatAmount(pay?.payment_amount, pay?.payment_currency)}
                    </p>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 dark:text-gray-400">
                      {t('detailsModal.status')}
                    </label>
                    <p className="text-xs font-medium mt-0.5">
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${getStatusBadgeColor(pay?.payment_status)}`}
                      >
                        {statusLabels[pay?.payment_status] ||
                          pay?.payment_status ||
                          t('notAvailable')}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 dark:text-gray-400">
                      {t('detailsModal.paymentMethod')}
                    </label>
                    <p className="text-xs font-medium text-gray-900 dark:text-gray-100 mt-0.5 capitalize">
                      {methodLabels[pay?.payment_method] ||
                        pay?.payment_method?.replace('_', ' ') ||
                        t('notAvailable')}
                    </p>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 dark:text-gray-400">
                      {t('detailsModal.gateway')}
                    </label>
                    <p className="text-xs font-medium text-gray-900 dark:text-gray-100 mt-0.5">
                      {pay?.payment_gateway || t('notAvailable')}
                    </p>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 dark:text-gray-400">
                      {t('detailsModal.transactionId')}
                    </label>
                    <p className="text-xs font-medium text-gray-900 dark:text-gray-100 mt-0.5">
                      {pay?.payment_transaction_id || t('notAvailable')}
                    </p>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 dark:text-gray-400">
                      {t('detailsModal.currency')}
                    </label>
                    <p className="text-xs font-medium text-gray-900 dark:text-gray-100 mt-0.5">
                      {pay?.payment_currency || t('notAvailable')}
                    </p>
                  </div>
                </div>
              </div>

              {/* User & Subscription Info */}
              {pay?.user_subscription && (
                <div className="bg-purple-50 dark:bg-gray-700/30 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    {t('detailsModal.subscription')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pay?.user_subscription?.subscription?.subscription_name && (
                      <div>
                        <label className="text-[10px] text-gray-500 dark:text-gray-400">
                          {t('detailsModal.subscriptionPlan')}
                        </label>
                        <p className="text-xs font-medium text-gray-900 dark:text-gray-100 mt-0.5">
                          {pay.user_subscription.subscription.subscription_name}
                        </p>
                      </div>
                    )}
                    {pay?.user_subscription?.subscription_status && (
                      <div>
                        <label className="text-[10px] text-gray-500 dark:text-gray-400">
                          {t('detailsModal.subscriptionStatus')}
                        </label>
                        <p className="text-xs font-medium mt-0.5">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              pay.user_subscription.is_active
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                            }`}
                          >
                            {pay.user_subscription.subscription_status}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Dates */}
              <div className="bg-purple-50 dark:bg-gray-700/30 rounded-lg p-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  {t('detailsModal.timestamps')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pay?.created_at && (
                    <div>
                      <label className="text-[10px] text-gray-500 dark:text-gray-400">
                        {t('detailsModal.created')}
                      </label>
                      <p className="text-xs font-medium text-gray-900 dark:text-gray-100 mt-0.5">
                        {new Date(pay.created_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  )}
                  {pay?.updated_at && (
                    <div>
                      <label className="text-[10px] text-gray-500 dark:text-gray-400">
                        {t('detailsModal.lastUpdated')}
                      </label>
                      <p className="text-xs font-medium text-gray-900 dark:text-gray-100 mt-0.5">
                        {new Date(pay.updated_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Standardized Fixed Modal Footer */}
        <div className="shrink-0 flex items-center justify-end px-6 py-4 border-t border-purple-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 transition-colors">
          <button
            onClick={onClose}
            className="px-6 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            {t('common:close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetailsModal;
