// src/components/dashboard/layout/NotificationDropdown.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bell, CheckCircle, AlertCircle, Info, X, CreditCard, Package, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import notificationApi from '../../../api/notificationApi';

// Helper function to format time ago
const formatTimeAgo = (dateString) => {
  if (!dateString) return 'Just now';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
};

// Helper function to determine notification type and icon
const getNotificationType = (notificationType, data) => {
  // Check if it's a subscription-related notification
  if (notificationType === 'subscription_expired' || 
      notificationType?.includes('subscription') ||
      data?.subscription_id ||
      data?.user_subscription_id) {
    return { type: 'subscription', icon: Package, color: 'purple' };
  }
  
  // Check if it's a payment-related notification
  if (notificationType?.includes('payment') || data?.payment_id) {
    return { type: 'payment', icon: CreditCard, color: 'green' };
  }
  
  // Default to info
  return { type: 'info', icon: Info, color: 'blue' };
};

const NotificationDropdown = React.memo(() => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await notificationApi.getSubscriptionPaymentNotifications({
        page: 1,
        limit: 20,
        sort_by: 'created_at',
        sort_order: 'DESC'
      });
      
      // Transform API response to component format
      const transformedNotifications = (response.data.data || []).map(notification => ({
        id: notification.id,
        title: notification.title || 'Notification',
        message: notification.body || '',
        time: formatTimeAgo(notification.created_at),
        type: getNotificationType(notification.notification_type, notification.data).type,
        read: notification.is_read || false,
        notificationType: notification.notification_type,
        data: notification.data,
        actionUrl: notification.action_url,
        createdAt: notification.created_at
      }));
      
      setNotifications(transformedNotifications);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
      // Keep existing notifications on error
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (id) => {
    const notification = notifications.find(n => n.id === id);
    if (!notification || notification.read) return;
    
    try {
      // Mark as read via API
      await notificationApi.markAsRead(id);
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === id ? { ...n, read: true } : n
        )
      );
      
      // Navigate to action URL if available
      if (notification.actionUrl) {
        // You can implement navigation here if needed
        console.log('Navigate to:', notification.actionUrl);
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
      // Still update UI optimistically
      setNotifications(prev => 
        prev.map(n => 
          n.id === id ? { ...n, read: true } : n
        )
      );
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
    } catch (err) {
      console.error('Error marking all as read:', err);
      // Still update UI optimistically
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
    }
  };

  const deleteNotification = async (id, e) => {
    e.stopPropagation();
    
    try {
      await notificationApi.deleteNotification(id);
      
      // Remove from local state
      setNotifications(prev => prev.filter(notification => notification.id !== id));
    } catch (err) {
      console.error('Error deleting notification:', err);
      // Still remove from UI optimistically
      setNotifications(prev => prev.filter(notification => notification.id !== id));
    }
  };

  const getNotificationIcon = (notification) => {
    const { icon: Icon, color } = getNotificationType(notification.notificationType, notification.data);
    const colorClasses = {
      purple: 'text-purple-500',
      green: 'text-green-500',
      blue: 'text-blue-500',
      amber: 'text-amber-500'
    };
    return <Icon className={`w-4 h-4 ${colorClasses[color] || colorClasses.blue}`} />;
  };

  const getNotificationColor = (notification) => {
    const { color } = getNotificationType(notification.notificationType, notification.data);
    const colorClasses = {
      purple: 'bg-purple-100 border-purple-200 dark:bg-purple-900/30',
      green: 'bg-green-100 border-green-200 dark:bg-green-900/30',
      blue: 'bg-blue-100 border-blue-200 dark:bg-blue-900/30',
      amber: 'bg-amber-100 border-amber-200 dark:bg-amber-900/30'
    };
    return colorClasses[color] || colorClasses.blue;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-purple-400 dark:text-purple-500 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg transition-colors group"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full border-2 border-white flex items-center justify-center">
            {unreadCount}
          </span>
        )}
        <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Notifications
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-purple-100 dark:border-gray-700 z-50 animate-in slide-in-from-top-5 duration-200 transition-colors">
          {/* Dropdown Header */}
          <div className="p-4 border-b border-purple-100 dark:border-gray-700 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-800 dark:text-gray-100 transition-colors">Notifications</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">{unreadCount} unread notifications</p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-6 h-6 text-purple-500 animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading notifications...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <AlertCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
                <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
                <button
                  onClick={fetchNotifications}
                  className="mt-2 text-xs text-purple-600 dark:text-purple-400 hover:underline"
                >
                  Try again
                </button>
              </div>
            ) : notifications.length > 0 ? (
              <div className="divide-y divide-purple-50 dark:divide-gray-700">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification.id)}
                    className={`p-4 hover:bg-purple-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${
                      !notification.read ? 'bg-purple-50/50 dark:bg-gray-700/50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1 min-w-0">
                        <div className={`p-2 rounded-lg ${getNotificationColor(notification)} flex-shrink-0`}>
                          {getNotificationIcon(notification)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-gray-800 dark:text-gray-200 text-sm transition-colors truncate">
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-purple-500 dark:bg-purple-400 rounded-full flex-shrink-0 ml-2"></span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-1 transition-colors line-clamp-2">
                            {notification.message}
                          </p>
                          <span className="text-xs text-gray-400 dark:text-gray-500 transition-colors">
                            {notification.time}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => deleteNotification(notification.id, e)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ml-2 flex-shrink-0"
                        aria-label="Delete notification"
                      >
                        <X size={14} className="text-gray-400 dark:text-gray-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-6 h-6 text-purple-400 dark:text-purple-500" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 transition-colors">No notifications</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 transition-colors">You're all caught up!</p>
              </div>
            )}
          </div>

          {/* Dropdown Footer */}
          <div className="p-4 border-t border-purple-100 dark:border-gray-700">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/notifications');
              }}
              className="w-full py-2 text-center text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              View All Notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

NotificationDropdown.displayName = 'NotificationDropdown';
export default NotificationDropdown;