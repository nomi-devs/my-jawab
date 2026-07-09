// src/components/dashboard/subscriptions/SubscriptionDetailsModal.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Package, DollarSign, Calendar, CheckCircle, XCircle, Users } from 'lucide-react';
import subscriptionsApi from '../../../api/subscriptionsApi';

const SubscriptionDetailsModal = ({ isOpen, onClose, subscriptionId, subscriptionData }) => {
  const { t } = useTranslation('subscriptions');
  const [subscription, setSubscription] = useState(subscriptionData);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [userSubscriptions, setUserSubscriptions] = useState([]);
  const [userSubscriptionsLoading, setUserSubscriptionsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && subscriptionId) {
      fetchSubscriptionDetails();
      fetchUserSubscriptions();
    }
  }, [isOpen, subscriptionId]);

  const fetchSubscriptionDetails = async () => {
    try {
      setLoading(true);
      const response = await subscriptionsApi.getSubscription(subscriptionId);
      setSubscription(response.data);
    } catch (err) {
      console.error('Error fetching subscription details:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserSubscriptions = async () => {
    try {
      setUserSubscriptionsLoading(true);
      const response = await subscriptionsApi.getUserSubscriptions({
        subscription_id: subscriptionId,
        page: 1,
        limit: 20,
      });
      setUserSubscriptions(response.data.data || []);
    } catch (err) {
      console.error('Error fetching user subscriptions:', err);
    } finally {
      setUserSubscriptionsLoading(false);
    }
  };

  if (!isOpen) return null;

  const formatPrice = (price, currencyCode = 'USD') => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
      }).format(price);
    } catch (e) {
      return `${currencyCode} ${price}`;
    }
  };

  const formatDuration = (duration, durationType) => {
    if (duration === 1) {
      return `${duration} ${durationType.slice(0, -1)}`;
    }
    return `${duration} ${durationType}`;
  };

  const sub = subscription || subscriptionData;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-[90%] h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-purple-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {loading
                ? t('common:loading')
                : sub?.subscription_name || t('subscriptionDetailsModal.defaultTitle')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={18} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex-shrink-0 flex border-b border-purple-100 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2.5 text-xs font-medium transition-colors ${
              activeTab === 'details'
                ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {t('subscriptionDetailsModal.tabs.details')}
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2.5 text-xs font-medium transition-colors ${
              activeTab === 'users'
                ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {t('subscriptionDetailsModal.tabs.users', { count: userSubscriptions.length })}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5" style={{ scrollbarGutter: 'stable' }}>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
            </div>
          ) : activeTab === 'details' ? (
            <div className="space-y-5">
              {/* Basic Info */}
              <div className="bg-purple-50 dark:bg-gray-700/30 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  {t('subscriptionDetailsModal.basicInformation')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-gray-500 dark:text-gray-400">
                      {t('subscriptionDetailsModal.subscriptionName')}
                    </label>
                    <p className="text-xs font-medium text-gray-900 dark:text-gray-100 mt-0.5">
                      {sub?.subscription_name}
                    </p>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 dark:text-gray-400">
                      {t('common:type')}
                    </label>
                    <p className="text-xs font-medium text-gray-900 dark:text-gray-100 mt-0.5 capitalize">
                      {sub?.subscription_type}
                    </p>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 dark:text-gray-400">
                      {t('subscriptionDetailsModal.price')}
                    </label>
                    <p className="text-xs font-medium text-gray-900 dark:text-gray-100 mt-0.5">
                      {formatPrice(
                        sub?.subscription_price,
                        sub?.subscription_currency || sub?.currency?.currency_code,
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 dark:text-gray-400">
                      {t('subscriptionDetailsModal.duration')}
                    </label>
                    <p className="text-xs font-medium text-gray-900 dark:text-gray-100 mt-0.5">
                      {formatDuration(sub?.subscription_duration, sub?.subscription_duration_type)}
                    </p>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 dark:text-gray-400">
                      {t('common:status')}
                    </label>
                    <p className="text-xs font-medium mt-0.5">
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          sub?.is_active
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                        }`}
                      >
                        {sub?.is_active ? t('common:active') : t('common:inactive')}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 dark:text-gray-400">
                      {t('common:created')}
                    </label>
                    <p className="text-xs font-medium text-gray-900 dark:text-gray-100 mt-0.5">
                      {sub?.created_at
                        ? new Date(sub?.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : t('subscriptionDetailsModal.notAvailable')}
                    </p>
                  </div>
                </div>
                {sub?.subscription_description && (
                  <div className="mt-3">
                    <label className="text-[10px] text-gray-500 dark:text-gray-400">
                      {t('common:description')}
                    </label>
                    <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5">
                      {sub?.subscription_description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {userSubscriptionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                </div>
              ) : userSubscriptions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('subscriptionDetailsModal.noUsersSubscribed')}
                  </p>
                </div>
              ) : (
                userSubscriptions.map((userSub) => (
                  <div key={userSub.id} className="bg-purple-50 dark:bg-gray-700/30 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                          {t('subscriptionDetailsModal.subscriptionActive')}
                        </p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                          {t('subscriptionDetailsModal.statusLabel', {
                            status: userSub.subscription_status,
                          })}{' '}
                          •
                          {userSub.subscription_start_date &&
                            ` ${t('subscriptionDetailsModal.startedLabel', {
                              date: new Date(
                                userSub.subscription_start_date,
                              ).toLocaleDateString(),
                            })}`}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          userSub.is_active
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                        }`}
                      >
                        {userSub.is_active ? t('common:active') : t('common:inactive')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Standardized Fixed Modal Footer */}
        <div className="flex-shrink-0 flex items-center justify-end px-6 py-4 border-t border-purple-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 transition-colors">
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

export default SubscriptionDetailsModal;
