// src/components/dashboard/layout/Header.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, PanelLeftOpen, PanelLeftClose } from 'lucide-react';
import SearchBar from './SearchBar';
import NotificationDropdown from './NotificationDropdown';
import LanguageToggle from '../../common/LanguageToggle';

const Header = ({ activeTab, setSidebarOpen, sidebarCollapsed, setSidebarCollapsed }) => {
  const { t } = useTranslation('layout');
  // Check both localStorage and sessionStorage for user data
  const [username] = useState(
    localStorage.getItem('username') || sessionStorage.getItem('username') || '',
  );
  const [role] = useState(localStorage.getItem('role') || sessionStorage.getItem('role') || '');
  const navigate = useNavigate();

  // Username is set from login response, no need to fetch profile
  // The getProfile endpoint is not available in admin API

  const handleProfileClick = () => {
    navigate('/profile');
  };

  return (
    <header className="h-16 bg-linear-to-r from-white to-purple-50/50 dark:from-gray-800 dark:to-gray-900 border-b border-purple-100 dark:border-gray-700 flex items-center justify-between px-6 sticky top-0 z-10 transition-colors duration-300">
      <div className="flex items-center">
        {/* Mobile sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden p-1.5 -ms-1 me-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <Menu size={20} />
        </button>

        {/* Desktop sidebar collapse/expand toggle - match header icon style */}
        <button
          type="button"
          onClick={() => setSidebarCollapsed && setSidebarCollapsed((prev) => !prev)}
          className="hidden lg:inline-flex items-center justify-center me-3 p-1.5 -ms-1 text-purple-600 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title={sidebarCollapsed ? t('header.expandSidebar') : t('header.collapseSidebar')}
        >
          {sidebarCollapsed ? (
            <PanelLeftOpen size={20} className="rtl:-scale-x-100" />
          ) : (
            <PanelLeftClose size={20} className="rtl:-scale-x-100" />
          )}
        </button>

        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 capitalize hidden sm:block transition-colors">
          {activeTab}
        </h2>
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        {/* Search */}
        <SearchBar />

        {/* Notifications */}
        <NotificationDropdown />

        {/* Language toggle */}
        <LanguageToggle />

        {/* User Profile - show only when logged-in user data exists */}
        {username && (
          <button
            onClick={handleProfileClick}
            className="flex items-center gap-2 ps-3 border-s border-purple-100 dark:border-gray-700 hover:bg-purple-50/50 dark:hover:bg-gray-700/50 rounded-lg px-2 py-1 transition-colors cursor-pointer group"
            title={t('header.viewProfile')}
          >
            <div className="text-end hidden sm:block">
              <div className="text-xs font-semibold text-gray-800 dark:text-gray-100 transition-colors group-hover:text-purple-600 dark:group-hover:text-purple-400">
                {username}
              </div>
              {role && (
                <div className="text-[10px] text-purple-500 dark:text-purple-400 capitalize transition-colors">
                  {role}
                </div>
              )}
            </div>

            {/* Avatar */}
            <div className="w-8 h-8 purple-gradient rounded-full flex items-center justify-center text-white text-xs font-bold ring-2 ring-offset-1 ring-purple-100 dark:ring-gray-700 transition-all group-hover:ring-purple-300 dark:group-hover:ring-purple-600 group-hover:scale-105">
              {username.charAt(0).toUpperCase()}
            </div>
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
