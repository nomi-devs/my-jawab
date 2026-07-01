// src/components/dashboard/subscriptions/SubscriptionCard.jsx
import React from 'react';
import { Eye, Edit, Trash2, Package } from 'lucide-react';

const SubscriptionCard = ({ subscription, onEdit, onDelete, onViewDetails }) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const formatDuration = (duration, durationType) => {
    if (duration === 1) {
      return `${duration} ${durationType.slice(0, -1)}`;
    }
    return `${duration} ${durationType}`;
  };

  const getTypeBadgeColor = (type) => {
    switch (type) {
      case 'free':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
      case 'pro':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
      case 'premium':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-purple-100 dark:border-gray-700 p-4 hover:shadow-md transition-shadow animate-fadeIn">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Package className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {subscription.subscription_name}
            </h4>
            <span
              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium mt-1 ${getTypeBadgeColor(subscription.subscription_type)}`}
            >
              {subscription.subscription_type}
            </span>
          </div>
        </div>
        <span
          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
            subscription.is_active
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
          }`}
        >
          {subscription.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>

      {subscription.subscription_description && (
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
          {subscription.subscription_description}
        </p>
      )}

      <div className="space-y-2 mb-3">
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-gray-500 dark:text-gray-400">Price</span>
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {formatPrice(subscription.subscription_price)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-gray-500 dark:text-gray-400">Duration</span>
          <span className="text-xs text-gray-700 dark:text-gray-300">
            {formatDuration(
              subscription.subscription_duration,
              subscription.subscription_duration_type,
            )}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-purple-100 dark:border-gray-700">
        <span className="text-[10px] text-gray-500 dark:text-gray-400">
          {subscription.created_at
            ? new Date(subscription.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            : 'N/A'}
        </span>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onViewDetails && onViewDetails(subscription)}
            className="p-1 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded transition-colors"
            title="View Details"
          >
            <Eye size={14} />
          </button>
          <button
            onClick={() => onEdit && onEdit(subscription)}
            className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
            title="Edit"
          >
            <Edit size={14} />
          </button>
          <button
            onClick={() => onDelete && onDelete(subscription)}
            className="p-1 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionCard;
