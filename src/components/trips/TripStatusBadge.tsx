/**
 * Trip Status Badge Component
 * Epic 2: Story 2.1 - Core Trip Management
 * Visual indicator for trip status with color coding
 */

import React from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import type { TripStatus } from '@/api/trips/types';

interface TripStatusBadgeProps {
  status: TripStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusConfig = {
  PLANNING: {
    label: 'Planning',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-200',
  },
  CONFIRMED: {
    label: 'Confirmed',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    borderColor: 'border-green-200',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-800',
    borderColor: 'border-purple-200',
  },
  COMPLETED: {
    label: 'Completed',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    borderColor: 'border-gray-200',
  },
  CANCELLED: {
    label: 'Cancelled',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    borderColor: 'border-red-200',
  },
};

const sizeConfig = {
  sm: {
    padding: 'px-2 py-1',
    textSize: 'text-xs',
    borderRadius: 'rounded-md',
  },
  md: {
    padding: 'px-3 py-1',
    textSize: 'text-sm',
    borderRadius: 'rounded-lg',
  },
  lg: {
    padding: 'px-4 py-2',
    textSize: 'text-base',
    borderRadius: 'rounded-lg',
  },
};

export function TripStatusBadge({ status, size = 'md', className = '' }: TripStatusBadgeProps) {
  const statusStyle = statusConfig[status];
  const sizeStyle = sizeConfig[size];

  return (
    <View
      className={`
        ${statusStyle.bgColor}
        ${statusStyle.borderColor}
        ${sizeStyle.padding}
        ${sizeStyle.borderRadius}
        border
        ${className}
      `}
    >
      <Text
        className={`
          ${statusStyle.textColor}
          ${sizeStyle.textSize}
          font-medium
          text-center
        `}
      >
        {statusStyle.label}
      </Text>
    </View>
  );
}