/**
 * Empty State Component
 * Displays empty states with icon, title, description and optional action
 */

import React from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { MapPin } from '@/components/ui/icons';
import { Text } from '@/components/ui/text';

// Create a simple alert circle icon since we don't have it yet
function AlertCircle({
  color = '#000',
  width = 24,
  height = 24,
}: {
  color?: string;
  width?: number;
  height?: number;
}) {
  return (
    <View className="size-12 items-center justify-center rounded-full bg-red-100">
      <Text className="text-xl font-bold text-red-600">!</Text>
    </View>
  );
}

// Icon mapping
const iconMap = {
  'alert-circle': AlertCircle,
  map: MapPin,
} as const;

interface EmptyStateAction {
  label: string;
  onPress: () => void;
}

interface EmptyStateProps {
  icon?: keyof typeof iconMap;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  className?: string;
}

export function EmptyState({
  icon = 'map',
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  const IconComponent = iconMap[icon];

  return (
    <View className={`items-center justify-center px-4 py-8 ${className}`}>
      {/* Icon */}
      <View className="mb-4">
        {icon === 'alert-circle' ? (
          <AlertCircle />
        ) : (
          <View className="size-12 items-center justify-center rounded-full bg-gray-100">
            <IconComponent width={24} height={24} color="#6B7280" />
          </View>
        )}
      </View>

      {/* Title */}
      <Text className="mb-2 text-center text-lg font-semibold text-gray-900">
        {title}
      </Text>

      {/* Description */}
      {description && (
        <Text className="mb-6 max-w-xs text-center text-sm leading-relaxed text-gray-600">
          {description}
        </Text>
      )}

      {/* Action Button */}
      {action && (
        <Button onPress={action.onPress} className="bg-blue-600 px-6">
          <Text className="font-medium text-white">{action.label}</Text>
        </Button>
      )}
    </View>
  );
}
