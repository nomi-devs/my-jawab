// src/components/dashboard/payments/AddPaymentModal.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, CreditCard, Save } from 'lucide-react';
import paymentsApi from '../../../api/paymentsApi';
import subscriptionsApi from '../../../api/subscriptionsApi';
import currenciesApi from '../../../api/currenciesApi';

const AddPaymentModal = ({ isOpen, onClose, onSuccess }) => {
  const { t } = useTranslation('payments');
  const [formData, setFormData] = useState({
    users_subscriptions_id: '',
    payment_amount: '',
    payment_status: 'pending',
    payment_method: 'credit_card',
    payment_currency: 'USD',
    currency_id: '',
    payment_gateway: 'stripe',
    payment_transaction_id: '',
  });
  const [userSubscriptions, setUserSubscriptions] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);
  const [loadingCurrencies, setLoadingCurrencies] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUserSubscriptions();
      fetchCurrencies();
    }
  }, [isOpen]);

  const fetchCurrencies = async () => {
    try {
      setLoadingCurrencies(true);
      const response = await currenciesApi.getCurrencies();
      const activeCurrencies = (response.data || []).filter((c) => c.is_active);
      setCurrencies(activeCurrencies);

      // Select default currency if available
      if (activeCurrencies.length > 0 && !formData.currency_id) {
        const usd = activeCurrencies.find((c) => c.currency_code === 'USD');
        const defaultCurrency = usd || activeCurrencies[0];
        setFormData((prev) => ({
          ...prev,
          currency_id: defaultCurrency.id,
          payment_currency: defaultCurrency.currency_code,
        }));
      }
    } catch (err) {
      console.error('Error fetching currencies:', err);
    } finally {
      setLoadingCurrencies(false);
    }
  };

  const fetchUserSubscriptions = async () => {
    try {
      setLoadingSubscriptions(true);
      const response = await subscriptionsApi.getUserSubscriptions({
        page: 1,
        limit: 100,
        subscription_status: 'active',
      });
      setUserSubscriptions(response.data.data || []);
    } catch (err) {
      console.error('Error fetching user subscriptions:', err);
    } finally {
      setLoadingSubscriptions(false);
    }
  };

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'currency_id') {
      const selectedCurrency = currencies.find((c) => c.id === parseInt(value));
      setFormData((prev) => ({
        ...prev,
        currency_id: value,
        payment_currency: selectedCurrency ? selectedCurrency.currency_code : prev.payment_currency,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const submitData = {
        ...formData,
        users_subscriptions_id: parseInt(formData.users_subscriptions_id),
        payment_amount: parseFloat(formData.payment_amount),
        currency_id: formData.currency_id ? parseInt(formData.currency_id) : null,
      };

      await paymentsApi.createPayment(submitData);
      onSuccess();
    } catch (err) {
      console.error('Error creating payment:', err);
      setError(err.response?.data?.message || t('addModal.createFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-[90%] h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-purple-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {t('addModal.title')}
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
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-5"
          style={{ scrollbarGutter: 'stable' }}
        >
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-5">
            {/* User Subscription */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('addModal.userSubscription')}
              </label>
              <select
                name="users_subscriptions_id"
                value={formData.users_subscriptions_id}
                onChange={handleChange}
                required
                disabled={loadingSubscriptions}
                className="w-full px-3 py-1.5 text-xs border border-purple-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
              >
                <option value="">{t('addModal.selectSubscription')}</option>
                {userSubscriptions.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {t('addModal.userOptionPrefix')} {sub.user_id} -{' '}
                    {sub.subscription?.subscription_name || t('notAvailable')} (
                    {sub.subscription_status})
                  </option>
                ))}
              </select>
            </div>

            {/* Amount and Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('addModal.amount')}
                </label>
                <input
                  type="number"
                  name="payment_amount"
                  value={formData.payment_amount}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-1.5 text-xs border border-purple-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
                  placeholder="29.99"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('addModal.statusLabel')}
                </label>
                <select
                  name="payment_status"
                  value={formData.payment_status}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-1.5 text-xs border border-purple-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
                >
                  <option value="pending">{t('status.pending')}</option>
                  <option value="completed">{t('status.completed')}</option>
                  <option value="failed">{t('status.failed')}</option>
                </select>
              </div>
            </div>

            {/* Method and Currency */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('addModal.paymentMethod')}
                </label>
                <select
                  name="payment_method"
                  value={formData.payment_method}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-1.5 text-xs border border-purple-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
                >
                  <option value="credit_card">{t('methods.creditCard')}</option>
                  <option value="debit_card">{t('methods.debitCard')}</option>
                  <option value="paypal">{t('methods.paypal')}</option>
                  <option value="bank_transfer">{t('methods.bankTransfer')}</option>
                  <option value="cash">{t('methods.cash')}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('addModal.currency')}
                </label>
                <select
                  name="currency_id"
                  value={formData.currency_id}
                  onChange={handleChange}
                  required
                  disabled={loadingCurrencies}
                  className="w-full px-3 py-1.5 text-xs border border-purple-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
                >
                  <option value="">{t('addModal.selectCurrency')}</option>
                  {currencies.map((currency) => (
                    <option key={currency.id} value={currency.id}>
                      {currency.currency_name} ({currency.currency_code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Gateway and Transaction ID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('addModal.paymentGateway')}
                </label>
                <input
                  type="text"
                  name="payment_gateway"
                  value={formData.payment_gateway}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-1.5 text-xs border border-purple-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
                  placeholder="stripe"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('addModal.transactionId')}
                </label>
                <input
                  type="text"
                  name="payment_transaction_id"
                  value={formData.payment_transaction_id}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-1.5 text-xs border border-purple-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
                  placeholder="txn_1234567890"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Standardized Fixed Modal Footer */}
        <div className="shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-purple-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 transition-colors">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            {t('common:cancel')}
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>{t('addModal.creating')}</span>
              </>
            ) : (
              <>
                <Save size={14} />
                <span>{t('addModal.createPayment')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddPaymentModal;
