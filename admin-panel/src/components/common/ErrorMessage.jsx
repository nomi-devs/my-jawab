// src/components/common/ErrorMessage.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle } from 'lucide-react';

const ErrorMessage = ({ message, onRetry }) => {
  const { t } = useTranslation('common');

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
        <div className="flex items-center gap-3">
          <AlertCircle className="text-red-600" size={24} />
          <div>
            <h3 className="font-medium text-red-800">{t('error')}</h3>
            <p className="text-red-600 text-sm">{message}</p>
          </div>
        </div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          {t('tryAgain')}
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
