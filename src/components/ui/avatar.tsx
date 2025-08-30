import React, { useState } from 'react';
import type { ViewProps } from 'react-native';
import { View } from 'react-native';
import type { VariantProps } from 'tailwind-variants';
import { tv } from 'tailwind-variants';

import { Image } from './image';
import { Text } from './text';

const avatar = tv({
  slots: {
    container:
      'items-center justify-center overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700',
    image: 'size-full',
    fallback: 'font-semibold text-neutral-600 dark:text-neutral-300',
  },
  variants: {
    size: {
      xs: {
        container: 'size-6',
        fallback: 'text-xs',
      },
      sm: {
        container: 'size-8',
        fallback: 'text-sm',
      },
      md: {
        container: 'size-12',
        fallback: 'text-base',
      },
      lg: {
        container: 'size-16',
        fallback: 'text-lg',
      },
      xl: {
        container: 'size-24',
        fallback: 'text-2xl',
      },
      '2xl': {
        container: 'size-32',
        fallback: 'text-4xl',
      },
    },
    variant: {
      default: {
        container: 'bg-neutral-200 dark:bg-neutral-700',
      },
      primary: {
        container: 'bg-primary-100 dark:bg-primary-900',
        fallback: 'text-primary-700 dark:text-primary-300',
      },
      secondary: {
        container: 'bg-secondary-100 dark:bg-secondary-900',
        fallback: 'text-secondary-700 dark:text-secondary-300',
      },
      success: {
        container: 'bg-success-100 dark:bg-success-900',
        fallback: 'dark:text-success-300 text-success-700',
      },
    },
    border: {
      true: {
        container: 'border-2 border-white dark:border-neutral-900',
      },
    },
    online: {
      true: {
        container: 'relative',
      },
    },
  },
  defaultVariants: {
    size: 'md',
    variant: 'default',
    border: false,
    online: false,
  },
});

type AvatarVariants = VariantProps<typeof avatar>;

interface AvatarProps extends AvatarVariants, ViewProps {
  src?: string;
  alt?: string;
  name?: string;
  className?: string;
  onError?: () => void;
  fallbackComponent?: React.ReactNode;
}

/**
 * Avatar component with image fallback to initials
 */
export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  name,
  size,
  variant,
  border,
  online,
  className = '',
  onError,
  fallbackComponent,
  ...props
}) => {
  const [imageError, setImageError] = useState(false);
  const styles = avatar({ size, variant, border, online });

  const handleImageError = () => {
    setImageError(true);
    onError?.();
  };

  const getInitials = (fullName?: string): string => {
    if (!fullName) return '?';

    return fullName
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const showImage = src && !imageError;

  return (
    <View className={styles.container({ className })} {...props}>
      {showImage ? (
        <Image
          source={{ uri: src }}
          alt={alt || `${name}'s avatar`}
          className={styles.image()}
          onError={handleImageError}
          accessibilityRole="image"
        />
      ) : (
        fallbackComponent || (
          <Text className={styles.fallback()}>{getInitials(name)}</Text>
        )
      )}

      {/* Online status indicator */}
      {online && (
        <View className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-white bg-success-500 dark:border-neutral-900" />
      )}
    </View>
  );
};

/**
 * Avatar group for showing multiple users
 */
interface AvatarGroupProps extends ViewProps {
  children: React.ReactNode;
  max?: number;
  spacing?: 'tight' | 'normal' | 'loose';
  className?: string;
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  children,
  max = 4,
  spacing = 'normal',
  className = '',
  ...props
}) => {
  const childrenArray = React.Children.toArray(children);
  const visibleChildren = childrenArray.slice(0, max);
  const remainingCount = childrenArray.length - max;

  const spacingClasses = {
    tight: '-space-x-1',
    normal: '-space-x-2',
    loose: 'space-x-1',
  };

  return (
    <View
      className={`flex-row items-center ${spacingClasses[spacing]} ${className}`}
      {...props}
    >
      {visibleChildren}

      {remainingCount > 0 && (
        <Avatar
          name={`+${remainingCount}`}
          variant="primary"
          className="bg-neutral-500 dark:bg-neutral-400"
          fallbackComponent={
            <Text className="text-xs font-semibold text-white">
              +{remainingCount}
            </Text>
          }
        />
      )}
    </View>
  );
};
