// src/components/common/RefreshButton.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw } from 'lucide-react';

const RefreshButton = ({ onClick, loading = false, title, size = 20 }) => {
  const { t } = useTranslation('common');

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="p-2 text-gray-400 dark:text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
      title={title ?? t('refresh')}
    >
      <RefreshCw size={size} className={loading ? 'animate-spin' : ''} />
    </button>
  );
};

export default React.memo(RefreshButton);
