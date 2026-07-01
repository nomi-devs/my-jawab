// src/components/dashboard/subscriptions/SubscriptionRow.jsx
import React from 'react';
import { Eye, Edit, Trash2, Package } from 'lucide-react';

const SubscriptionRow = ({ subscription, onEdit, onDelete, onViewDetails }) => {
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
    <tr className="hover:bg-purple-50/50 dark:hover:bg-gray-700/30 transition-colors animate-fadeIn">
      <td className="px-4 py-3 align-top">
        <div className="flex items-start space-x-2">
          <div className="flex-shrink-0">
            <Package className="w-7 h-7 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
              {subscription.subscription_name}
            </div>
            {subscription.subscription_description && (
              <div
                className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400 leading-snug line-clamp-2"
                style={{ width: '150px' }}
              >
                {subscription.subscription_description}
              </div>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-2 whitespace-nowrap">
        <div className="flex flex-col space-y-1">
          <span
            className={`inline-flex items-center w-fit px-1.5 py-0.5 rounded text-[10px] font-medium ${getTypeBadgeColor(subscription.subscription_type)}`}
          >
            {subscription.subscription_type}
          </span>
          <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
            {formatPrice(
              subscription.subscription_price,
              subscription.subscription_currency || subscription.currency?.currency_code,
            )}
          </span>
        </div>
      </td>
      <td className="px-4 py-2 whitespace-nowrap">
        <div className="text-xs text-gray-700 dark:text-gray-300">
          {formatDuration(
            subscription.subscription_duration,
            subscription.subscription_duration_type,
          )}
        </div>
      </td>
      <td className="px-4 py-2 whitespace-nowrap">
        <span
          className={`inline-flex items-center w-fit px-1.5 py-0.5 rounded text-[10px] font-medium ${
            subscription.is_active
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
          }`}
        >
          {subscription.is_active ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
        {subscription.created_at
          ? new Date(subscription.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
          : 'N/A'}
      </td>
      <td className="px-4 py-2 whitespace-nowrap text-right text-xs font-medium">
        <div className="flex items-center justify-end space-x-2">
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
      </td>
    </tr>
  );
};

export default SubscriptionRow;
