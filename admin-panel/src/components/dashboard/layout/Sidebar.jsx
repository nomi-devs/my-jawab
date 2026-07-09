// src/components/dashboard/layout/Sidebar.jsx
import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import authApi from '../../../api/authApi';

import {
  LayoutDashboard,
  Users,
  FileText,
  Globe,
  MessageCircle,
  LogOut,
  Hash,
  BarChart3,
  User,
  Package,
  CreditCard,
  Settings,
  Coins,
  Shield,
  Headphones,
  Image as ImageIcon,
  UserX,
} from 'lucide-react';
import BRANDING from '../../../constants/branding';
import BrandLogo from '../../common/BrandLogo';
import ConfirmationModal from '../../common/ConfirmationModal';

const Sidebar = ({ sidebarOpen, setSidebarOpen, sidebarCollapsed = false, onLogout }) => {
  const { t, i18n } = useTranslation('layout');
  const isRTL = i18n.dir() === 'rtl';
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1024);
  const navigate = useNavigate();

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const handler = (e) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const performLogout = async () => {
    setIsLoggingOut(true);
    try {
      const res = await authApi.logout();
      console.log(res);
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      onLogout();
      // Fallback logout - clear both storage types
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      localStorage.removeItem('email');
      localStorage.removeItem('role');
      localStorage.removeItem('is_active');
      localStorage.removeItem('is_verified');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('username');
      sessionStorage.removeItem('email');
      sessionStorage.removeItem('role');
      sessionStorage.removeItem('is_active');
      sessionStorage.removeItem('is_verified');
      navigate('/login');
    }
  };

  const navItems = [
    {
      id: 'dashboard',
      path: '/dashboard',
      label: t('sidebar.dashboard'),
      icon: LayoutDashboard,
    },
    { id: 'users', path: '/users', label: t('sidebar.users'), icon: Users },
    { id: 'users-deleted', path: '/users/deleted', label: t('sidebar.deletedUsers'), icon: UserX },
    { id: 'topics', path: '/topics', label: t('sidebar.topics'), icon: Hash },
    { id: 'sub-topics', path: '/sub-topics', label: t('sidebar.subTopics'), icon: Hash },
    {
      id: 'communities',
      path: '/communities',
      label: t('sidebar.communities'),
      icon: Globe,
    },
    { id: 'posts', path: '/posts', label: t('sidebar.posts'), icon: FileText },
    {
      id: 'polls',
      path: '/polls',
      label: t('sidebar.polls'),
      icon: BarChart3,
    },
    {
      id: 'comments',
      path: '/comments',
      label: t('sidebar.comments'),
      icon: MessageCircle,
    },
    {
      id: 'subscriptions',
      path: '/subscriptions',
      label: t('sidebar.subscriptions'),
      icon: Package,
    },
    {
      id: 'payments',
      path: '/payments',
      label: t('sidebar.payments'),
      icon: CreditCard,
    },
    {
      id: 'currencies',
      path: '/currencies',
      label: t('sidebar.currencies'),
      icon: Coins,
    },
    {
      id: 'settings',
      path: '/settings',
      label: t('sidebar.appSettings'),
      icon: Settings,
    },
    {
      id: 'banners',
      path: '/banners',
      label: t('sidebar.banners'),
      icon: ImageIcon,
    },
    {
      id: 'privacy-policy',
      path: '/privacy-policy',
      label: t('sidebar.privacyPolicy'),
      icon: Shield,
    },
    {
      id: 'support',
      path: '/support',
      label: t('sidebar.support'),
      icon: Headphones,
    },
    {
      id: 'profile',
      path: '/profile',
      label: t('sidebar.profile'),
      icon: User,
    },
  ];

  return (
    <>
      {/* Logout Confirmation Modal */}
      <ConfirmationModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={performLogout}
        type="warning"
        title={t('sidebar.confirmLogoutTitle')}
        message={t('sidebar.confirmLogoutMessage')}
        confirmText={t('sidebar.logOut')}
        cancelText={t('common:cancel')}
        isLoading={isLoggingOut}
      />

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 dark:bg-black/70 z-20 lg:hidden transition-colors"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed lg:static inset-y-0 start-0 w-64 ${
          sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'
        } bg-white dark:bg-gray-800 border-e border-purple-100 dark:border-gray-700 z-30 transform transition-all duration-300 ease-in-out shadow-lg lg:shadow-none flex flex-col h-screen`}
        style={{
          transform:
            isDesktop || sidebarOpen
              ? 'translateX(0)'
              : isRTL ? 'translateX(100%)' : 'translateX(-100%)',
        }}
      >
        {/* Logo/Brand Section */}
        <div className="h-16 flex items-center px-5 border-b border-purple-100 dark:border-gray-700 bg-linear-to-r from-purple-50 to-white dark:from-gray-800 dark:to-gray-900 transition-colors">
          <BrandLogo size="md" showText={!sidebarCollapsed} />
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto pb-20" style={{ scrollbarGutter: 'stable' }}>
          <nav className="p-3 space-y-1.5 mt-2">
            {navItems.map((item) => (
              <NavLink
                key={item.id}
                to={item.path}
                end={item.id === 'dashboard' || item.id === 'users'}
                onClick={() => setSidebarOpen(false)}
                title={sidebarCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm ${
                    isActive
                      ? 'purple-gradient text-white font-semibold shadow-md shadow-purple-500/20'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-gray-700/50 hover:text-purple-700 dark:hover:text-purple-400 hover:shadow-sm'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div
                      className={`shrink-0 transition-transform duration-200 ${
                        isActive
                          ? 'text-white'
                          : 'text-purple-500 dark:text-purple-400 group-hover:scale-110'
                      }`}
                    >
                      <item.icon size={18} />
                    </div>
                    <span
                      className={`flex-1 text-sm transition-opacity duration-200 ${
                        sidebarCollapsed ? 'hidden lg:hidden opacity-0' : 'inline opacity-100'
                      }`}
                    >
                      {item.label}
                    </span>
                    {/* {item.id === "comments" && (
                      <span
                        className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full transition-all ${
                          isActive
                            ? "bg-white/25 text-white backdrop-blur-sm"
                            : "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                        }`}
                      >
                      </span>
                    )} */}
                    {item.id === 'topics' && !sidebarCollapsed && (
                      <span
                        className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full transition-all ${
                          isActive
                            ? 'bg-white/25 text-white backdrop-blur-sm'
                            : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        }`}
                      >
                        {t('sidebar.hot')}
                      </span>
                    )}
                    {isActive && (
                      <div className="absolute start-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-e-full opacity-80"></div>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Logout Button - Pinned at Bottom */}
        <div className="mt-auto border-t border-purple-100 dark:border-gray-700 bg-linear-to-b from-white via-purple-50/30 to-purple-50/50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900 transition-colors z-10">
          <div className="p-3">
            <button
              onClick={handleLogout}
              title={sidebarCollapsed ? t('sidebar.logOut') : undefined}
              className="group relative w-full flex items-center justify-center gap-2.5 px-4 py-3 bg-linear-to-r from-red-50 to-red-50/50 dark:from-red-900/20 dark:to-red-900/10 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 hover:from-red-100 hover:to-red-50 dark:hover:from-red-900/30 dark:hover:to-red-900/20 hover:border-red-300 dark:hover:border-red-700 rounded-xl transition-all duration-200 text-sm font-semibold hover:shadow-md hover:shadow-red-500/10 active:scale-[0.98]"
            >
              <LogOut
                size={18}
                className="group-hover:rotate-12 transition-transform duration-200"
              />
              {!sidebarCollapsed && <span>{t('sidebar.logOut')}</span>}
              <div className="absolute inset-0 rounded-xl bg-red-500/0 group-hover:bg-red-500/5 dark:group-hover:bg-red-500/10 transition-colors duration-200"></div>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
