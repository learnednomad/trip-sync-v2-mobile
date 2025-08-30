import { Link } from 'expo-router';
import { MotiView } from 'moti';
import React from 'react';
import { ScrollView, View } from 'react-native';

import {
  AlertTriangle as WarningIcon,
  CheckCircle as SuccessIcon,
  Settings as InfoIcon,
  X as CloseIcon,
  XCircle as ErrorIcon,
} from '@/components/ui/icons';
import {
  type Notification,
  useNavigationStore,
} from '@/lib/navigation/navigation-store';

import { Button } from './index';
import { Text } from './text';

/**
 * Notification bell icon with badge
 */
export const NotificationBell: React.FC<{ className?: string }> = ({
  className = '',
}) => {
  const unreadCount = useNavigationStore.use.unreadCount();
  const openModal = useNavigationStore.use.openModal();

  return (
    <View className={`relative ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        onPress={() => openModal('notifications')}
        className="p-2"
      >
        <InfoIcon color="#737373" />
      </Button>

      {unreadCount > 0 && (
        <View className="absolute -right-1 -top-1 h-5 min-w-5 items-center justify-center rounded-full bg-error-500">
          <Text className="text-xs font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </Text>
        </View>
      )}
    </View>
  );
};

/**
 * Notification item component
 */
const NotificationItem: React.FC<{
  notification: Notification;
  onDismiss: (id: string) => void;
}> = ({ notification, onDismiss }) => {
  const iconMap = {
    info: InfoIcon,
    success: SuccessIcon,
    warning: WarningIcon,
    error: ErrorIcon,
  };

  const colorMap = {
    info: '#0ea5e9',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
  };

  const Icon = iconMap[notification.type];
  const iconColor = colorMap[notification.type];

  return (
    <MotiView
      from={{ opacity: 0, translateY: -20 }}
      animate={{ opacity: 1, translateY: 0 }}
      exit={{ opacity: 0, translateY: -20 }}
      className={`mb-2 rounded-lg border-l-4 bg-white p-4 dark:bg-neutral-800 ${
        notification.read
          ? 'border-neutral-200 opacity-70 dark:border-neutral-600'
          : 'border-primary-500'
      } shadow-sm`}
    >
      <View className="flex-row">
        <View className="mr-3 mt-0.5">
          <Icon color={iconColor} />
        </View>

        <View className="flex-1">
          <View className="mb-1 flex-row items-start justify-between">
            <Text
              className={`font-semibold ${
                notification.read
                  ? 'text-neutral-600 dark:text-neutral-400'
                  : 'text-neutral-900 dark:text-white'
              }`}
            >
              {notification.title}
            </Text>

            <Button
              variant="ghost"
              size="sm"
              onPress={() => onDismiss(notification.id)}
              className="-mr-1 -mt-1 p-1"
            >
              <CloseIcon color="#a3a3a3" width={14} height={14} />
            </Button>
          </View>

          <Text
            className={`text-sm ${
              notification.read
                ? 'text-neutral-500 dark:text-neutral-500'
                : 'text-neutral-700 dark:text-neutral-300'
            } mb-2`}
          >
            {notification.message}
          </Text>

          <View className="flex-row items-center justify-between">
            <Text className="text-xs text-neutral-500 dark:text-neutral-400">
              {new Date(notification.timestamp).toLocaleTimeString()}
            </Text>

            {notification.actionUrl && notification.actionLabel && (
              <Link href={notification.actionUrl as any} asChild>
                <Button variant="link" size="sm">
                  {notification.actionLabel}
                </Button>
              </Link>
            )}
          </View>
        </View>
      </View>
    </MotiView>
  );
};

/**
 * Notifications panel/modal
 */
export const NotificationsPanel: React.FC = () => {
  const notifications = useNavigationStore.use.notifications();
  const removeNotification = useNavigationStore.use.removeNotification();
  const markAllRead = useNavigationStore.use.markAllRead();
  const closeModal = useNavigationStore.use.closeModal();

  return (
    <View className="flex-1 bg-neutral-50 dark:bg-neutral-900">
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
        <Text className="text-lg font-semibold text-neutral-900 dark:text-white">
          Notifications
        </Text>

        <View className="flex-row space-x-2">
          {notifications.some((n) => !n.read) && (
            <Button variant="ghost" size="sm" onPress={markAllRead}>
              Mark All Read
            </Button>
          )}
          <Button variant="ghost" size="sm" onPress={closeModal}>
            <CloseIcon color="#737373" />
          </Button>
        </View>
      </View>

      {/* Notifications list */}
      <ScrollView className="flex-1 p-4">
        {notifications.length === 0 ? (
          <View className="items-center py-12">
            <View className="mb-4 size-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
              <InfoIcon color="#737373" width={32} height={32} />
            </View>
            <Text className="mb-2 text-base font-medium text-neutral-900 dark:text-white">
              No Notifications
            </Text>
            <Text className="text-center text-sm text-neutral-600 dark:text-neutral-400">
              You're all caught up! New notifications will appear here.
            </Text>
          </View>
        ) : (
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onDismiss={removeNotification}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
};

/**
 * Hook for adding notifications easily
 */
export const useNotifications = () => {
  const addNotification = useNavigationStore.use.addNotification();

  return {
    showSuccess: (
      title: string,
      message: string,
      actionUrl?: string,
      actionLabel?: string
    ) => {
      addNotification({
        type: 'success',
        title,
        message,
        read: false,
        timestamp: new Date().toISOString(),
        actionUrl,
        actionLabel,
      });
    },

    showError: (title: string, message: string) => {
      addNotification({ 
        type: 'error', 
        title, 
        message,
        read: false,
        timestamp: new Date().toISOString(),
      });
    },

    showWarning: (title: string, message: string) => {
      addNotification({ 
        type: 'warning', 
        title, 
        message,
        read: false,
        timestamp: new Date().toISOString(),
      });
    },

    showInfo: (
      title: string,
      message: string,
      actionUrl?: string,
      actionLabel?: string
    ) => {
      addNotification({ 
        type: 'info', 
        title, 
        message,
        read: false,
        timestamp: new Date().toISOString(),
        actionUrl, 
        actionLabel 
      });
    },
  };
};
