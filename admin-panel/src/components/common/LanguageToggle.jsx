// src/components/common/LanguageToggle.jsx
import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';

const LanguageToggle = () => {
  const { isRTL, toggleLanguage } = useLanguage();
  const { t } = useTranslation('layout');

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className="relative inline-flex h-9 w-20 items-center rounded-full bg-gray-200 dark:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
      aria-label={isRTL ? t('header.switchToEnglish') : t('header.switchToArabic')}
      title={isRTL ? t('header.switchToEnglish') : t('header.switchToArabic')}
      role="switch"
      aria-checked={isRTL}
    >
      {/* Sliding Thumb */}
      <span
        className={`absolute top-1 h-7 w-9 rounded-full bg-white shadow-md transition-all duration-300 ${
          isRTL ? '-translate-x-10' : 'translate-x-1'
        }`}
      />

      {/* EN */}
      <span
        className={`relative z-10 flex w-1/2 justify-center text-xs font-semibold transition-colors duration-300 ${
          !isRTL
            ? 'text-purple-700 dark:text-purple-400'
            : 'text-gray-500 dark:text-gray-400'
        }`}
      >
        EN
      </span>

      {/* AR */}
      <span
        className={`relative z-10 flex w-1/2 justify-center text-xs font-semibold transition-colors duration-300 ${
          isRTL
            ? 'text-purple-700 dark:text-purple-400'
            : 'text-gray-500 dark:text-gray-400'
        }`}
      >
        AR
      </span>
    </button>
  );
};

export default LanguageToggle;