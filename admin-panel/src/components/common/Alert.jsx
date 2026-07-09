// src/components/common/Alert.jsx
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const Alert = React.memo(
  ({
    type = 'success', // success, error, warning, info
    message,
    duration = 3000,
    onClose,
    position = 'top-right', // top-right, top-left, bottom-right, bottom-left
  }) => {
    const { t } = useTranslation('common');

    useEffect(() => {
      if (duration > 0 && onClose) {
        const timer = setTimeout(() => {
          onClose();
        }, duration);

        return () => clearTimeout(timer);
      }
    }, [duration, onClose]);

    if (!message) return null;

    const positionClasses = {
      'top-right': 'top-4 end-4 md:top-6 md:end-6',
      'top-left': 'top-4 start-4 md:top-6 md:start-6',
      'bottom-right': 'bottom-4 end-4 md:bottom-6 md:end-6',
      'bottom-left': 'bottom-4 start-4 md:bottom-6 md:start-6',
    };

    const typeStyles = {
      success: {
        bg: 'bg-green-50 dark:bg-green-900/30',
        border: 'border-green-200 dark:border-green-800',
        text: 'text-green-800 dark:text-green-200',
        icon: <CheckCircle className="text-green-600 dark:text-green-400" size={18} />,
      },
      error: {
        bg: 'bg-red-50 dark:bg-red-900/30',
        border: 'border-red-200 dark:border-red-800',
        text: 'text-red-800 dark:text-red-200',
        icon: <AlertCircle className="text-red-600 dark:text-red-400" size={18} />,
      },
      warning: {
        bg: 'bg-amber-50 dark:bg-amber-900/30',
        border: 'border-amber-200 dark:border-amber-800',
        text: 'text-amber-800 dark:text-amber-200',
        icon: <AlertCircle className="text-amber-600 dark:text-amber-400" size={18} />,
      },
      info: {
        bg: 'bg-blue-50 dark:bg-blue-900/30',
        border: 'border-blue-200 dark:border-blue-800',
        text: 'text-blue-800 dark:text-blue-200',
        icon: <Info className="text-blue-600 dark:text-blue-400" size={18} />,
      },
    };

    const style = typeStyles[type] || typeStyles.success;

    return (
      <div
        className={`fixed ${positionClasses[position]} z-[9999] animate-in slide-in-from-right duration-300 max-w-sm w-full`}
      >
        <div
          className={`${style.bg} ${style.border} border rounded-lg p-3 md:p-4 shadow-lg flex items-start gap-3 transition-colors`}
        >
          <div className="shrink-0 mt-0.5">{style.icon}</div>
          <div className="flex-1 min-w-0">
            <p
              className={`${style.text} text-sm md:text-base font-medium wrap-break-word transition-colors`}
            >
              {message}
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className={`shrink-0 ${style.text} hover:opacity-70 transition-opacity p-1`}
              aria-label={t('close')}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
    );
  },
);

Alert.displayName = 'Alert';
export default Alert;
