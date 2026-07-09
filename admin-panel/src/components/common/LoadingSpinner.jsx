// src/components/common/LoadingSpinner.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';

const LoadingSpinner = ({ message, size = 'medium' }) => {
  const { t } = useTranslation('common');
  const sizeClass = {
    small: 'h-6 w-6',
    medium: 'h-12 w-12',
    large: 'h-16 w-16',
  }[size];

  const resolvedMessage = message === undefined ? t('loading') : message;

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className={`animate-spin rounded-full border-b-2 border-purple-600 ${sizeClass}`}></div>
      {resolvedMessage && <p className="text-gray-600">{resolvedMessage}</p>}
    </div>
  );
};

export default LoadingSpinner;
