/**
 * Empty State Component
 * Displays empty states with icon, title, description and optional action
 */

import React from 'react';
import { View } from 'react-native';
import { MapPin } from '@/components/ui/icons';

import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';

// Create a simple alert circle icon since we don't have it yet
function AlertCircle({ color = '#000', width = 24, height = 24 }: { color?: string; width?: number; height?: number }) {
  return (
    <View className="w-12 h-12 rounded-full bg-red-100 items-center justify-center">
      <Text className="text-red-600 text-xl font-bold">!</Text>
    </View>
  );
}

// Icon mapping
const iconMap = {
  'alert-circle': AlertCircle,
  'map': MapPin,
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
  className = '' 
}: EmptyStateProps) {
  const IconComponent = iconMap[icon];

  return (
    <View className={`items-center justify-center py-8 px-4 ${className}`}>
      {/* Icon */}
      <View className="mb-4">
        {icon === 'alert-circle' ? (
          <AlertCircle />
        ) : (
          <View className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center">
            <IconComponent width={24} height={24} color="#6B7280" />
          </View>
        )}
      </View>

      {/* Title */}
      <Text className="text-lg font-semibold text-gray-900 text-center mb-2">
        {title}
      </Text>

      {/* Description */}
      {description && (
        <Text className="text-sm text-gray-600 text-center mb-6 max-w-xs leading-relaxed">
          {description}
        </Text>
      )}

      {/* Action Button */}
      {action && (
        <Button
          onPress={action.onPress}
          className="bg-blue-600 px-6"
        >
          <Text className="text-white font-medium">
            {action.label}
          </Text>
        </Button>
      )}
    </View>
  );
}