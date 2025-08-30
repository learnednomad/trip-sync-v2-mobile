import { MotiView } from 'moti';
import React from 'react';
import { View } from 'react-native';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  className?: string;
  borderRadius?: number;
}

/**
 * Animated skeleton loading placeholder
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  className = '',
  borderRadius = 8,
}) => {
  return (
    <MotiView
      style={{
        width,
        height,
        borderRadius,
      }}
      className={`bg-neutral-200 dark:bg-neutral-700 ${className}`}
      from={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
      transition={{
        type: 'timing',
        duration: 1000,
        loop: true,
        repeatReverse: true,
      }}
    />
  );
};

/**
 * Skeleton for trip cards
 */
export const TripCardSkeleton: React.FC = () => {
  return (
    <View className="mb-3 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
      {/* Cover image skeleton */}
      <Skeleton width="100%" height={120} borderRadius={8} className="mb-3" />

      {/* Title skeleton */}
      <Skeleton width="80%" height={24} className="mb-2" />

      {/* Description skeleton */}
      <Skeleton width="100%" height={16} className="mb-1" />
      <Skeleton width="60%" height={16} className="mb-3" />

      {/* Date and participants skeleton */}
      <View className="flex-row items-center justify-between">
        <Skeleton width={100} height={16} />
        <Skeleton width={80} height={16} />
      </View>
    </View>
  );
};

/**
 * Skeleton for trip list
 */
export const TripListSkeleton: React.FC<{ count?: number }> = ({
  count = 3,
}) => {
  return (
    <View>
      {Array.from({ length: count }).map((_, index) => (
        <TripCardSkeleton key={index} />
      ))}
    </View>
  );
};

/**
 * Skeleton for user avatar
 */
export const AvatarSkeleton: React.FC<{ size?: number }> = ({ size = 40 }) => {
  return (
    <Skeleton
      width={size}
      height={size}
      borderRadius={size / 2}
      className="bg-neutral-300 dark:bg-neutral-600"
    />
  );
};

/**
 * Skeleton for navigation items
 */
export const NavigationSkeleton: React.FC = () => {
  return (
    <View className="flex-row items-center justify-between p-4">
      <AvatarSkeleton size={32} />
      <View className="mx-4 flex-1">
        <Skeleton width="60%" height={16} className="mb-1" />
        <Skeleton width="40%" height={12} />
      </View>
      <Skeleton width={60} height={32} borderRadius={16} />
    </View>
  );
};

/**
 * Skeleton for form inputs
 */
export const InputSkeleton: React.FC<{ label?: boolean }> = ({
  label = true,
}) => {
  return (
    <View className="mb-4">
      {label && <Skeleton width="30%" height={16} className="mb-2" />}
      <Skeleton width="100%" height={44} borderRadius={8} />
    </View>
  );
};

/**
 * Skeleton for cards
 */
export const CardSkeleton: React.FC<{
  lines?: number;
  showHeader?: boolean;
  showFooter?: boolean;
}> = ({ lines = 3, showHeader = true, showFooter = false }) => {
  return (
    <View className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
      {showHeader && (
        <View className="mb-3 flex-row items-center">
          <AvatarSkeleton size={24} />
          <View className="ml-3 flex-1">
            <Skeleton width="40%" height={16} />
          </View>
        </View>
      )}

      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? '60%' : '100%'}
          height={16}
          className="mb-2"
        />
      ))}

      {showFooter && (
        <View className="mt-3 flex-row items-center justify-between">
          <Skeleton width={80} height={16} />
          <Skeleton width={60} height={16} />
        </View>
      )}
    </View>
  );
};
