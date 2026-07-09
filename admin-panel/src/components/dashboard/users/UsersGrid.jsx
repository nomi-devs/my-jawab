// src/components/dashboard/users/UsersGrid.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Eye,
  Shield,
  CheckCircle,
  XCircle,
  Mail,
  Calendar,
  User,
  Edit,
  Trash2,
} from 'lucide-react';

const UsersGrid = React.memo(({ users, onEdit, onDelete, onViewDetails }) => {
  const { t } = useTranslation('users');
  if (users.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
          <User className="w-8 h-8 text-gray-400 dark:text-gray-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
          {t('usersGrid.noUsersFound')}
        </h3>
        <p className="text-gray-500 dark:text-gray-400">{t('usersGrid.tryChangingFilters')}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
      {users.map((user, index) => (
        <div
          key={user.id}
          className="bg-white dark:bg-gray-800 rounded-xl border border-purple-100 dark:border-gray-700 p-5 hover:shadow-lg transition-all duration-200 animate-fadeIn"
          style={{
            animationDelay: `${index * 50}ms`,
          }}
        >
          {/* User Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <img
                src={user.img}
                alt={user.name}
                className="w-12 h-12 rounded-full bg-purple-200 dark:bg-purple-900/30 border-2 border-white dark:border-gray-700 transition-transform duration-200 hover:scale-105"
                loading="lazy"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200 truncate">
                  {user.name || user.username}
                </h4>
                {user.name && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    @{user.username}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => onViewDetails && onViewDetails(user)}
              className="p-1.5 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
              title={t('usersGrid.viewDetails')}
            >
              <Eye size={16} />
            </button>
          </div>

          {/* Email */}
          <div className="flex items-center gap-2 mb-3 text-xs text-gray-600 dark:text-gray-400">
            <Mail size={14} />
            <span className="truncate">{user.email}</span>
          </div>

          {/* Role Badge */}
          <div className="mb-3">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                user.role === 'Pro User' || user.role === 'pro_user'
                  ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
                  : user.role === 'Admin' || user.role === 'admin'
                    ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                    : user.role === 'Sub Admin'
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              <Shield size={12} />
              <span className="capitalize">
                {user.role?.replace('_', ' ') || t('usersGrid.roleFallback')}
              </span>
            </span>
          </div>

          {/* Status and Verification */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                user.status === 'Active'
                  ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30'
                  : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full me-1.5 ${
                  user.status === 'Active'
                    ? 'bg-green-500 dark:bg-green-400'
                    : 'bg-red-500 dark:bg-red-400'
                }`}
              ></span>
              {user.status}
            </span>
            {user.is_verified !== undefined && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  user.is_verified
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                }`}
              >
                {user.is_verified ? <CheckCircle size={12} /> : <XCircle size={12} />}
                {user.is_verified ? t('usersGrid.verified') : t('usersGrid.unverified')}
              </span>
            )}
          </div>

          {/* Joined Date */}
          <div className="flex items-center gap-2 mb-4 text-xs text-gray-500 dark:text-gray-400">
            <Calendar size={14} />
            <span>
              {t('usersGrid.joinedPrefix')} {user.joined}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-3 border-t border-purple-100 dark:border-gray-700">
            <button
              onClick={() => onEdit && onEdit(user)}
              className="flex-1 px-3 py-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              title={t('usersGrid.editUser')}
            >
              <Edit size={14} />
              <span>{t('common:edit')}</span>
            </button>
            <button
              onClick={() => onDelete && onDelete(user.id)}
              className="flex-1 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              title={t('usersGrid.deleteUser')}
            >
              <Trash2 size={14} />
              <span>{t('common:delete')}</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
});

UsersGrid.displayName = 'UsersGrid';
export default UsersGrid;
