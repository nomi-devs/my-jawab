// src/components/dashboard/notifications/NotificationsPage.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { Bell, AlertCircle, Loader2 } from 'lucide-react';
import notificationApi from '../../../api/notificationApi';

const formatTimeAgo = (dateString) => {
  if (!dateString) return 'Just now';

  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
};

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await notificationApi.getSubscriptionPaymentNotifications({
        page: 1,
        limit: 100,
        sort_by: 'created_at',
        sort_order: 'DESC',
      });

      const transformedNotifications = (response.data.data || []).map((notification) => ({
        id: notification.id,
        title: notification.title || 'Notification',
        message: notification.body || '',
        time: formatTimeAgo(notification.created_at),
        read: notification.is_read || false,
        notificationType: notification.notification_type,
        data: notification.data,
        actionUrl: notification.action_url,
        createdAt: notification.created_at,
      }));

      setNotifications(transformedNotifications);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error('Error marking all as read:', err);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  };

  const deleteNotification = async (id) => {
    try {
      await notificationApi.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error('Error deleting notification:', err);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Notifications</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            View and manage all your subscription and payment notifications.
          </p>
        </div>
        {notifications.length > 0 && (
          <button
            onClick={markAllAsRead}
            className="px-3 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-purple-100 dark:border-gray-700">
        {loading ? (
          <div className="p-8 flex flex-col items-center justify-center">
            <Loader2 className="w-6 h-6 text-purple-500 animate-spin mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading notifications...</p>
          </div>
        ) : error ? (
          <div className="p-8 flex flex-col items-center justify-center">
            <AlertCircle className="w-6 h-6 text-red-500 mb-2" />
            <p className="text-sm text-red-500 dark:text-red-400 mb-2">{error}</p>
            <button
              onClick={fetchNotifications}
              className="px-3 py-1 text-xs font-medium text-purple-600 dark:text-purple-400 hover:underline"
            >
              Try again
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 flex flex-col items-center justify-center">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-4">
              <Bell className="w-6 h-6 text-purple-400 dark:text-purple-500" />
            </div>
            <p className="text-gray-500 dark:text-gray-400">No notifications</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              You're all caught up!
            </p>
          </div>
        ) : (
          <>
            <div className="px-4 py-3 border-b border-purple-50 dark:border-gray-700 flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {notifications.length} total notifications{unreadCount ? ` • ${unreadCount} unread` : ''}
              </p>
            </div>
            <div className="divide-y divide-purple-50 dark:divide-gray-700">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 flex items-start justify-between ${
                    !notification.read ? 'bg-purple-50/40 dark:bg-gray-700/40' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-gray-800 dark:text-gray-100 text-sm truncate">
                        {notification.title}
                      </h3>
                      <span className="text-xs text-gray-400 dark:text-gray-500 ml-2 whitespace-nowrap">
                        {notification.time}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {notification.message}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="ml-3 text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;


