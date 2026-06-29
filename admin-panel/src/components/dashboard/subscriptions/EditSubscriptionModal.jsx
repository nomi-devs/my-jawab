// src/components/dashboard/subscriptions/EditSubscriptionModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Package, Save } from 'lucide-react';
import { useSubscriptionActions } from '../../../hooks/useSubscriptions';
import currenciesApi from '../../../api/currenciesApi';
import FeaturesEditor from './FeaturesEditor';

const EditSubscriptionModal = ({ isOpen, onClose, subscription, onSuccess }) => {
  const [formData, setFormData] = useState({
    subscription_type: 'pro',
    subscription_name: '',
    subscription_description: '',
    subscription_price: '',
    subscription_duration: '',
    subscription_duration_type: 'days',
    subscription_currency: '',
    is_active: true,
    features: {},
  });
  const [currencies, setCurrencies] = useState([]);
  const { updateSubscription, isUpdating } = useSubscriptionActions();
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
      setCurrencies((response.data || []).filter(c => c.is_active));
    } catch (err) {
      console.error('Error fetching currencies:', err);
    } finally {
      setLoadingCurrencies(false);
    }
  };

  useEffect(() => {
    if (subscription) {
      setFormData({
        subscription_type: subscription.subscription_type || 'pro',
        subscription_name: subscription.subscription_name || '',
        subscription_description: subscription.subscription_description || '',
        subscription_price: subscription.subscription_price || '',
        subscription_duration: subscription.subscription_duration || '',
        subscription_duration_type: subscription.subscription_duration_type || 'days',
        subscription_currency: subscription.subscription_currency || (subscription.currency?.currency_code) || '',
        is_active: subscription.is_active !== undefined ? subscription.is_active : true,
        features: subscription.features && typeof subscription.features === 'object' ? { ...subscription.features } : {},
      });
    }
  }, [subscription]);

  if (!isOpen || !subscription) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFeaturesChange = (features) => {
    setFormData(prev => ({ ...prev, features }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setError(null);
    // isUpdating is handled by hook

    try {
      const submitData = {
        ...formData,
        subscription_price: parseFloat(formData.subscription_price),
        subscription_duration: parseInt(formData.subscription_duration),
        subscription_currency: formData.subscription_currency || null,
        features: formData.features && Object.keys(formData.features).length > 0
          ? formData.features
          : undefined,
      };

      await updateSubscription({ id: subscription.id, data: submitData });
      onSuccess();
    } catch (err) {
      console.error('Error updating subscription:', err);
      setError(err.response?.data?.message || 'Failed to update subscription. Please try again.');
    } finally {
      // isUpdating is handled by hook
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-[90%] h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-purple-100 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit Subscription</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={18} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5" style={{ scrollbarGutter: 'stable' }}>
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Type and Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subscription Type *
                </label>
                <select
                  name="subscription_type"
                  value={formData.subscription_type}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-1.5 text-xs border border-purple-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
                >
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="premium">Premium</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subscription Name *
                </label>
                <input
                  type="text"
                  name="subscription_name"
                  value={formData.subscription_name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-1.5 text-xs border border-purple-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                name="subscription_description"
                value={formData.subscription_description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-1.5 text-xs border border-purple-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent resize-none"
              />
            </div>

            {/* Price, Currency and Duration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Price *
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
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Currency *
                  </label>
                  <select
                    name="subscription_currency"
                    value={formData.subscription_currency}
                    onChange={handleChange}
                    required
                    disabled={loadingCurrencies}
                    className="w-full px-3 py-1.5 text-xs border border-purple-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
                  >
                    <option value="">Select...</option>
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
                    Duration *
                  </label>
                  <input
                    type="number"
                    name="subscription_duration"
                    value={formData.subscription_duration}
                    onChange={handleChange}
                    required
                    min="1"
                    className="w-full px-3 py-1.5 text-xs border border-purple-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type *
                  </label>
                  <select
                    name="subscription_duration_type"
                    value={formData.subscription_duration_type}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-1.5 text-xs border border-purple-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
                  >
                    <option value="days">Days</option>
                    <option value="weeks">Weeks</option>
                    <option value="months">Months</option>
                    <option value="years">Years</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Features Editor */}
            <div className="pt-3 border-t border-purple-100 dark:border-gray-700">
              <FeaturesEditor
                value={formData.features}
                onChange={handleFeaturesChange}
                disabled={isUpdating}
              />
            </div>

            {/* Active Status */}
            <div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg transition-colors">
                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors">
                    Active Status
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">Enable or disable this subscription</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="sr-only peer"
                    disabled={isUpdating}
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </div>
          </div>
        </form>

        {/* Standardized Fixed Modal Footer */}
        <div className="flex-shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-purple-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 transition-colors">
          <button
            type="button"
            onClick={onClose}
            disabled={isUpdating}
            className="px-6 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isUpdating}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isUpdating ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Updating...</span>
              </>
            ) : (
              <>
                <Save size={14} />
                <span>Update Subscription</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditSubscriptionModal;

