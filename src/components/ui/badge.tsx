import React from 'react';
import type { ViewProps } from 'react-native';
import { View } from 'react-native';
import type { VariantProps } from 'tailwind-variants';
import { tv } from 'tailwind-variants';

import { Text } from './text';

const badge = tv({
  slots: {
    container: 'inline-flex items-center justify-center rounded-full px-2 py-1',
    text: 'text-xs font-medium uppercase tracking-wide',
  },
  variants: {
    variant: {
      default: {
        container: 'bg-neutral-100 dark:bg-neutral-800',
        text: 'text-neutral-800 dark:text-neutral-200',
      },
      primary: {
        container: 'bg-primary-100 dark:bg-primary-900',
        text: 'text-primary-800 dark:text-primary-200',
      },
      secondary: {
        container: 'bg-secondary-100 dark:bg-secondary-900',
        text: 'text-secondary-800 dark:text-secondary-200',
      },
      success: {
        container: 'bg-success-100 dark:bg-success-900',
        text: 'text-success-800 dark:text-success-200',
      },
      warning: {
        container: 'bg-warning-100 dark:bg-warning-900',
        text: 'text-warning-800 dark:text-warning-200',
      },
      error: {
        container: 'bg-error-100 dark:bg-error-900',
        text: 'text-error-800 dark:text-error-200',
      },
      // Trip-specific status variants
      planning: {
        container: 'bg-warning-100 dark:bg-warning-900',
        text: 'text-warning-800 dark:text-warning-200',
      },
      confirmed: {
        container: 'bg-primary-100 dark:bg-primary-900',
        text: 'text-primary-800 dark:text-primary-200',
      },
      ongoing: {
        container: 'bg-success-100 dark:bg-success-900',
        text: 'text-success-800 dark:text-success-200',
      },
      completed: {
        container: 'bg-neutral-100 dark:bg-neutral-800',
        text: 'text-neutral-700 dark:text-neutral-300',
      },
      cancelled: {
        container: 'bg-error-100 dark:bg-error-900',
        text: 'text-error-800 dark:text-error-200',
      },
    },
    size: {
      sm: {
        container: 'px-2 py-0.5',
        text: 'text-xs',
      },
      md: {
        container: 'px-3 py-1',
        text: 'text-sm',
      },
      lg: {
        container: 'px-4 py-1.5',
        text: 'text-base',
      },
    },
    dot: {
      true: {
        container: 'relative pl-6',
      },
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
    dot: false,
  },
});

type BadgeVariants = VariantProps<typeof badge>;

interface BadgeProps extends BadgeVariants, ViewProps {
  children: React.ReactNode;
  className?: string;
  dotColor?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant,
  size,
  dot,
  className = '',
  children,
  dotColor,
  ...props
}) => {
  const styles = badge({ variant, size, dot });

  return (
    <View className={styles.container({ className })} {...props}>
      {dot && (
        <View
          className={`absolute left-2 size-2 rounded-full ${
            dotColor || 'bg-current'
          }`}
        />
      )}
      <Text className={styles.text()}>{children}</Text>
    </View>
  );
};

/**
 * Trip status badge with semantic colors
 */
interface TripStatusBadgeProps
  extends Omit<BadgeProps, 'variant' | 'children'> {
  status: 'PLANNING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}

export const TripStatusBadge: React.FC<TripStatusBadgeProps> = ({
  status,
  ...props
}) => {
  const statusConfig = {
    PLANNING: { variant: 'planning' as const, label: 'Planning' },
    CONFIRMED: { variant: 'confirmed' as const, label: 'Confirmed' },
    IN_PROGRESS: { variant: 'ongoing' as const, label: 'In Progress' },
    COMPLETED: { variant: 'completed' as const, label: 'Completed' },
    CANCELLED: { variant: 'cancelled' as const, label: 'Cancelled' },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} {...props}>
      {config.label}
    </Badge>
  );
};

/**
 * Notification badge with count
 */
interface NotificationBadgeProps extends Omit<BadgeProps, 'children'> {
  count: number;
  max?: number;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  max = 99,
  ...props
}) => {
  if (count === 0) return null;

  const displayCount = count > max ? `${max}+` : count.toString();

  return (
    <Badge
      variant="error"
      size="sm"
      className="absolute -right-1 -top-1"
      {...props}
    >
      {displayCount}
    </Badge>
  );
};
