// src/components/dashboard/subscriptions/AddSubscriptionModal.jsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Package, Save } from 'lucide-react';
import { useSubscriptionActions } from '../../../hooks/useSubscriptions';
import currenciesApi from '../../../api/currenciesApi';
import { useEffect } from 'react';
import FeaturesEditor from './FeaturesEditor';

// Sensible defaults applied when picking a subscription type
const DEFAULT_FEATURES_BY_TYPE = {
  free: {
    can_create_polls: false,
    can_create_communities: false,
    video_uploads: false,
    verified_badge: false,
    priority_support: false,
    early_access: false,
    ads_enabled: true,
    daily_post_limit: 5,
    daily_comment_limit: 30,
    max_communities_joined: 10,
    max_topic_subscriptions: 10,
    max_video_size_mb: 0,
    max_bio_length: 200,
  },
  pro: {
    can_create_polls: true,
    can_create_communities: true,
    video_uploads: true,
    verified_badge: true,
    priority_support: true,
    early_access: false,
    ads_enabled: false,
    daily_post_limit: 20,
    daily_comment_limit: -1,
    max_communities_joined: 50,
    max_topic_subscriptions: 50,
    max_video_size_mb: 100,
    max_bio_length: 500,
  },
  premium: {
    can_create_polls: true,
    can_create_communities: true,
    video_uploads: true,
    verified_badge: true,
    priority_support: true,
    early_access: true,
    ads_enabled: false,
    daily_post_limit: -1,
    daily_comment_limit: -1,
    max_communities_joined: -1,
    max_topic_subscriptions: -1,
    max_video_size_mb: 500,
    max_bio_length: 1000,
  },
};

const AddSubscriptionModal = ({ isOpen, onClose, onSuccess }) => {
  const { t } = useTranslation('subscriptions');
  const [formData, setFormData] = useState({
    subscription_type: 'pro',
    subscription_name: '',
    subscription_description: '',
    subscription_price: '',
    subscription_duration: '',
    subscription_duration_type: 'days',
    subscription_currency: '',
    is_active: true,
    features: DEFAULT_FEATURES_BY_TYPE.pro,
  });
  const [currencies, setCurrencies] = useState([]);
  const { createSubscription, isCreating } = useSubscriptionActions();
  const [error, setError] = useState(null);
  const [loadingCurrencies, setLoadingCurrencies] = useState(false);

  useEffect(() => {
    if (isOpen) {
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
      if (activeCurrencies.length > 0 && !formData.subscription_currency) {
        const usd = activeCurrencies.find((c) => c.currency_code === 'USD');
        const defaultCurrency = usd || activeCurrencies[0];
        setFormData((prev) => ({
          ...prev,
          subscription_currency: defaultCurrency.currency_code,
        }));
      }
    } catch (err) {
      console.error('Error fetching currencies:', err);
    } finally {
      setLoadingCurrencies(false);
    }
  };

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => {
      const newVal = type === 'checkbox' ? checked : value;
      const updated = { ...prev, [name]: newVal };
      // When the plan type changes, prefill features with sensible defaults for that tier
      if (name === 'subscription_type' && DEFAULT_FEATURES_BY_TYPE[newVal]) {
        updated.features = { ...DEFAULT_FEATURES_BY_TYPE[newVal] };
      }
      return updated;
    });
  };

  const handleFeaturesChange = (features) => {
    setFormData((prev) => ({ ...prev, features }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const validationErrors = [];
    if (!formData.subscription_name.trim())
      validationErrors.push(t('addSubscriptionModal.errors.nameRequired'));
    if (formData.subscription_price === '' || formData.subscription_price === null) {
      validationErrors.push(t('addSubscriptionModal.errors.priceRequired'));
    } else if (parseFloat(formData.subscription_price) < 0) {
      validationErrors.push(t('addSubscriptionModal.errors.priceMin'));
    }
    if (formData.subscription_duration === '' || formData.subscription_duration === null) {
      validationErrors.push(t('addSubscriptionModal.errors.durationRequired'));
    } else if (parseInt(formData.subscription_duration) < 1) {
      validationErrors.push(t('addSubscriptionModal.errors.durationMin'));
    }
    if (!formData.subscription_currency)
      validationErrors.push(t('addSubscriptionModal.errors.currencyRequired'));

    if (validationErrors.length > 0) {
      setError(validationErrors.join('. '));
      return;
    }

    try {
      const submitData = {
        ...formData,
        subscription_price: parseFloat(formData.subscription_price),
        subscription_duration: parseInt(formData.subscription_duration),
        subscription_currency: formData.subscription_currency || null,
        features:
          formData.features && Object.keys(formData.features).length > 0
            ? formData.features
            : undefined,
      };

      await createSubscription(submitData);
      onSuccess();
    } catch (err) {
      console.error('Error creating subscription:', err);
      setError(err.response?.data?.message || t('addSubscriptionModal.errors.createFailed'));
    } finally {
      // isCreating is handled by hook
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-[90%] h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-purple-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {t('addSubscriptionModal.title')}
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
            {/* Type and Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('addSubscriptionModal.subscriptionType')}
                </label>
                <select
                  name="subscription_type"
                  value={formData.subscription_type}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-1.5 text-xs border border-purple-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
                >
                  <option value="free">{t('addSubscriptionModal.planTypes.free')}</option>
                  <option value="pro">{t('addSubscriptionModal.planTypes.pro')}</option>
                  <option value="premium">{t('addSubscriptionModal.planTypes.premium')}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('addSubscriptionModal.subscriptionName')}
                </label>
                <input
                  type="text"
                  name="subscription_name"
                  value={formData.subscription_name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-1.5 text-xs border border-purple-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
                  placeholder={t('addSubscriptionModal.namePlaceholder')}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('addSubscriptionModal.description')}
              </label>
              <textarea
                name="subscription_description"
                value={formData.subscription_description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-1.5 text-xs border border-purple-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent resize-none"
                placeholder={t('addSubscriptionModal.descriptionPlaceholder')}
              />
            </div>

            {/* Price, Currency and Duration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('addSubscriptionModal.price')}
                  </label>
                  <input
                    type="number"
                    name="subscription_price"
                    value={formData.subscription_price}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-1.5 text-xs border border-purple-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
                    placeholder={t('addSubscriptionModal.pricePlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('addSubscriptionModal.currency')}
                  </label>
                  <select
                    name="subscription_currency"
                    value={formData.subscription_currency}
                    onChange={handleChange}
                    required
                    disabled={loadingCurrencies}
                    className="w-full px-3 py-1.5 text-xs border border-purple-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
                  >
                    <option value="">{t('addSubscriptionModal.selectCurrency')}</option>
                    {currencies.map((currency) => (
                      <option key={currency.id} value={currency.currency_code}>
                        {currency.currency_code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('addSubscriptionModal.duration')}
                  </label>
                  <input
                    type="number"
                    name="subscription_duration"
                    value={formData.subscription_duration}
                    onChange={handleChange}
                    required
                    min="1"
                    className="w-full px-3 py-1.5 text-xs border border-purple-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
                    placeholder={t('addSubscriptionModal.durationPlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('addSubscriptionModal.durationType')}
                  </label>
                  <select
                    name="subscription_duration_type"
                    value={formData.subscription_duration_type}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-1.5 text-xs border border-purple-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
                  >
                    <option value="days">{t('addSubscriptionModal.durationTypes.days')}</option>
                    <option value="weeks">{t('addSubscriptionModal.durationTypes.weeks')}</option>
                    <option value="months">
                      {t('addSubscriptionModal.durationTypes.months')}
                    </option>
                    <option value="years">{t('addSubscriptionModal.durationTypes.years')}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Features Editor */}
            <div className="pt-3 border-t border-purple-100 dark:border-gray-700">
              <FeaturesEditor
                value={formData.features}
                onChange={handleFeaturesChange}
                disabled={isCreating}
              />
            </div>

            {/* Active Status */}
            <div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg transition-colors">
                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors">
                    {t('addSubscriptionModal.activeStatus')}
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">
                    {t('addSubscriptionModal.activeStatusDescription')}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="sr-only peer"
                    disabled={isCreating}
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </div>
          </div>
        </form>

        {/* Standardized Fixed Modal Footer */}
        <div className="shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-purple-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 transition-colors">
          <button
            type="button"
            onClick={onClose}
            disabled={isCreating}
            className="px-6 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            {t('common:cancel')}
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isCreating}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isCreating ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>{t('addSubscriptionModal.creating')}</span>
              </>
            ) : (
              <>
                <Save size={14} />
                <span>{t('addSubscriptionModal.create')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddSubscriptionModal;
