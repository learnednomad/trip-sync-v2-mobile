/**
 * Trip Status Manager Component
 * Epic 2: Story 2.1 - Core Trip Management
 * Acceptance Criteria 6: Trip Status & Lifecycle Management
 */

import React, { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';

import type { Trip, TripStatus } from '@/api/trips/types';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  Archive,
  Calendar,
  CheckCircle,
  Copy,
  Play,
  RotateCcw,
  Trash2,
  XCircle,
} from '@/components/ui/icons';
import { Text } from '@/components/ui/text';

interface TripStatusManagerProps {
  trip: Trip;
  onStatusChange: (newStatus: TripStatus) => void;
  onArchiveTrip: () => void;
  onDuplicateTrip: () => void;
  onDeleteTrip: () => void;
  canManage: boolean;
}

interface StatusTransition {
  from: TripStatus;
  to: TripStatus;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  requiresConfirmation: boolean;
}

const statusConfig = {
  PLANNING: {
    label: 'Planning',
    description: 'Trip is being planned and organized',
    color: 'bg-blue-100 text-blue-800',
    icon: <Calendar width={16} height={16} color="#2563EB" />,
  },
  CONFIRMED: {
    label: 'Confirmed',
    description: 'Trip details are finalized and bookings made',
    color: 'bg-green-100 text-green-800',
    icon: <CheckCircle width={16} height={16} color="#059669" />,
  },
  IN_PROGRESS: {
    label: 'In Progress',
    description: 'Trip is currently happening',
    color: 'bg-purple-100 text-purple-800',
    icon: <Play width={16} height={16} color="#7C3AED" />,
  },
  COMPLETED: {
    label: 'Completed',
    description: 'Trip has finished successfully',
    color: 'bg-gray-100 text-gray-800',
    icon: <CheckCircle width={16} height={16} color="#374151" />,
  },
  CANCELLED: {
    label: 'Cancelled',
    description: 'Trip has been cancelled',
    color: 'bg-red-100 text-red-800',
    icon: <XCircle width={16} height={16} color="#DC2626" />,
  },
};

const getValidTransitions = (currentStatus: TripStatus): StatusTransition[] => {
  const transitions: StatusTransition[] = [];

  switch (currentStatus) {
    case 'PLANNING':
      transitions.push({
        from: 'PLANNING',
        to: 'CONFIRMED',
        label: 'Confirm Trip',
        description: 'Mark trip as confirmed with all details finalized',
        icon: <CheckCircle width={16} height={16} color="#059669" />,
        color: 'bg-green-600',
        requiresConfirmation: false,
      });
      transitions.push({
        from: 'PLANNING',
        to: 'CANCELLED',
        label: 'Cancel Trip',
        description: 'Cancel the trip permanently',
        icon: <XCircle width={16} height={16} color="white" />,
        color: 'bg-red-600',
        requiresConfirmation: true,
      });
      break;

    case 'CONFIRMED':
      transitions.push({
        from: 'CONFIRMED',
        to: 'IN_PROGRESS',
        label: 'Start Trip',
        description: 'Mark trip as currently in progress',
        icon: <Play width={16} height={16} color="white" />,
        color: 'bg-purple-600',
        requiresConfirmation: false,
      });
      transitions.push({
        from: 'CONFIRMED',
        to: 'PLANNING',
        label: 'Back to Planning',
        description: 'Return to planning stage for modifications',
        icon: <RotateCcw width={16} height={16} color="white" />,
        color: 'bg-blue-600',
        requiresConfirmation: false,
      });
      transitions.push({
        from: 'CONFIRMED',
        to: 'CANCELLED',
        label: 'Cancel Trip',
        description: 'Cancel the confirmed trip',
        icon: <XCircle width={16} height={16} color="white" />,
        color: 'bg-red-600',
        requiresConfirmation: true,
      });
      break;

    case 'IN_PROGRESS':
      transitions.push({
        from: 'IN_PROGRESS',
        to: 'COMPLETED',
        label: 'Complete Trip',
        description: 'Mark trip as successfully completed',
        icon: <CheckCircle width={16} height={16} color="white" />,
        color: 'bg-gray-600',
        requiresConfirmation: false,
      });
      transitions.push({
        from: 'IN_PROGRESS',
        to: 'CANCELLED',
        label: 'Cancel Trip',
        description: 'Cancel the ongoing trip',
        icon: <XCircle width={16} height={16} color="white" />,
        color: 'bg-red-600',
        requiresConfirmation: true,
      });
      break;

    case 'COMPLETED':
      // Completed trips can be archived or duplicated but not changed status
      break;

    case 'CANCELLED':
      transitions.push({
        from: 'CANCELLED',
        to: 'PLANNING',
        label: 'Restore Trip',
        description: 'Restore cancelled trip back to planning',
        icon: <RotateCcw width={16} height={16} color="white" />,
        color: 'bg-blue-600',
        requiresConfirmation: false,
      });
      break;
  }

  return transitions;
};

const getStatusProgress = (status: TripStatus): number => {
  switch (status) {
    case 'PLANNING':
      return 25;
    case 'CONFIRMED':
      return 50;
    case 'IN_PROGRESS':
      return 75;
    case 'COMPLETED':
      return 100;
    case 'CANCELLED':
      return 0;
    default:
      return 0;
  }
};

const getNextAutoStatus = (trip: Trip): TripStatus | null => {
  const now = new Date();
  const startDate = new Date(trip.startDate);
  const endDate = new Date(trip.endDate);

  // Auto-suggest status based on dates
  if (trip.status === 'CONFIRMED' && now >= startDate && now <= endDate) {
    return 'IN_PROGRESS';
  }
  if (trip.status === 'IN_PROGRESS' && now > endDate) {
    return 'COMPLETED';
  }

  return null;
};

export function TripStatusManager({
  trip,
  onStatusChange,
  onArchiveTrip,
  onDuplicateTrip,
  onDeleteTrip,
  canManage,
}: TripStatusManagerProps) {
  const [showLifecycleActions, setShowLifecycleActions] = useState(false);

  const currentConfig = statusConfig[trip.status];
  const validTransitions = getValidTransitions(trip.status);
  const statusProgress = getStatusProgress(trip.status);
  const suggestedStatus = getNextAutoStatus(trip);

  const handleStatusTransition = (transition: StatusTransition) => {
    if (transition.requiresConfirmation) {
      Alert.alert(
        `${transition.label}?`,
        `Are you sure you want to ${transition.description.toLowerCase()}? This action may not be reversible.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: transition.label,
            style: 'destructive',
            onPress: () => onStatusChange(transition.to),
          },
        ]
      );
    } else {
      onStatusChange(transition.to);
    }
  };

  const handleLifecycleAction = (
    action: 'archive' | 'duplicate' | 'delete'
  ) => {
    switch (action) {
      case 'archive':
        Alert.alert(
          'Archive Trip',
          'Archive this trip? It will be moved to your archived trips and hidden from the main list.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Archive', onPress: onArchiveTrip },
          ]
        );
        break;
      case 'duplicate':
        Alert.alert(
          'Duplicate Trip',
          'Create a copy of this trip with the same details?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Duplicate', onPress: onDuplicateTrip },
          ]
        );
        break;
      case 'delete':
        Alert.alert(
          'Delete Trip',
          'Permanently delete this trip? This action cannot be undone.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: onDeleteTrip },
          ]
        );
        break;
    }
  };

  const getDaysUntil = (date: string): number => {
    const target = new Date(date);
    const today = new Date();
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const startDays = getDaysUntil(trip.startDate);
  const endDays = getDaysUntil(trip.endDate);

  return (
    <View className="bg-white">
      {/* Current Status Header */}
      <View className="border-b border-gray-100 p-4">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-lg font-semibold text-gray-900">
            Trip Status
          </Text>
          {canManage && (
            <Button
              variant="outline"
              size="sm"
              onPress={() => setShowLifecycleActions(!showLifecycleActions)}
            >
              <Text className="text-gray-700">Manage</Text>
            </Button>
          )}
        </View>

        {/* Status Badge & Progress */}
        <View className="space-y-3">
          <View className="flex-row items-center">
            <View
              className={`mr-3 flex-row items-center rounded-lg px-3 py-2 ${currentConfig.color}`}
            >
              {currentConfig.icon}
              <Text className="ml-2 font-medium">{currentConfig.label}</Text>
            </View>
            <Text className="flex-1 text-gray-600">
              {currentConfig.description}
            </Text>
          </View>

          {/* Progress Bar */}
          <View className="space-y-2">
            <View className="flex-row justify-between">
              <Text className="text-xs text-gray-500">Progress</Text>
              <Text className="text-xs text-gray-500">{statusProgress}%</Text>
            </View>
            <View className="h-2 rounded-full bg-gray-200">
              <View
                className={`h-2 rounded-full ${
                  trip.status === 'CANCELLED' ? 'bg-red-400' : 'bg-blue-500'
                }`}
                style={{ width: `${statusProgress}%` }}
              />
            </View>
          </View>
        </View>

        {/* Date Information */}
        <View className="mt-4 rounded-lg bg-gray-50 p-3">
          <View className="flex-row justify-between">
            <View className="flex-1">
              <Text className="text-xs text-gray-500">Starts</Text>
              <Text className="text-sm font-medium text-gray-900">
                {trip.startDate}
              </Text>
              {startDays >= 0 && (
                <Text className="text-xs text-gray-500">
                  {startDays === 0
                    ? 'Today'
                    : startDays === 1
                      ? 'Tomorrow'
                      : `${startDays} days`}
                </Text>
              )}
            </View>
            <View className="flex-1">
              <Text className="text-xs text-gray-500">Ends</Text>
              <Text className="text-sm font-medium text-gray-900">
                {trip.endDate}
              </Text>
              {endDays >= 0 && (
                <Text className="text-xs text-gray-500">
                  {endDays === 0 ? 'Today' : `${endDays} days`}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Auto Status Suggestion */}
        {suggestedStatus && canManage && (
          <View className="mt-3 flex-row items-start rounded-lg bg-yellow-50 p-3">
            <AlertTriangle width={16} height={16} color="#D97706" />
            <View className="ml-2 flex-1">
              <Text className="text-sm font-medium text-yellow-800">
                Status Update Suggested
              </Text>
              <Text className="mt-1 text-xs text-yellow-700">
                Based on your trip dates, consider updating status to "
                {statusConfig[suggestedStatus].label}"
              </Text>
              <Button
                onPress={() => onStatusChange(suggestedStatus)}
                size="sm"
                className="mt-2 self-start bg-yellow-600"
              >
                <Text className="text-xs text-white">
                  Update to {statusConfig[suggestedStatus].label}
                </Text>
              </Button>
            </View>
          </View>
        )}
      </View>

      {/* Status Transitions */}
      {canManage && validTransitions.length > 0 && (
        <View className="border-b border-gray-100 p-4">
          <Text className="mb-3 text-sm font-medium text-gray-700">
            Available Actions
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row space-x-2">
              {validTransitions.map((transition, index) => (
                <Button
                  key={index}
                  onPress={() => handleStatusTransition(transition)}
                  className={`${transition.color} flex-row items-center px-4 py-2`}
                >
                  {transition.icon}
                  <Text className="ml-2 font-medium text-white">
                    {transition.label}
                  </Text>
                </Button>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Lifecycle Actions */}
      {showLifecycleActions && canManage && (
        <View className="border-b border-gray-100 p-4">
          <Text className="mb-3 text-sm font-medium text-gray-700">
            Trip Management
          </Text>
          <View className="space-y-2">
            {(trip.status === 'COMPLETED' || trip.status === 'CANCELLED') && (
              <Button
                variant="outline"
                onPress={() => handleLifecycleAction('archive')}
                className="flex-row items-center justify-center border-gray-300"
              >
                <Archive width={16} height={16} color="#6B7280" />
                <Text className="ml-2 font-medium text-gray-700">
                  Archive Trip
                </Text>
              </Button>
            )}

            <Button
              variant="outline"
              onPress={() => handleLifecycleAction('duplicate')}
              className="flex-row items-center justify-center border-blue-200"
            >
              <Copy width={16} height={16} color="#2563EB" />
              <Text className="ml-2 font-medium text-blue-600">
                Duplicate Trip
              </Text>
            </Button>

            <Button
              variant="outline"
              onPress={() => handleLifecycleAction('delete')}
              className="flex-row items-center justify-center border-red-200"
            >
              <Trash2 width={16} height={16} color="#DC2626" />
              <Text className="ml-2 font-medium text-red-600">Delete Trip</Text>
            </Button>
          </View>
        </View>
      )}

      {/* Status Timeline */}
      <View className="p-4">
        <Text className="mb-3 text-sm font-medium text-gray-700">
          Status Timeline
        </Text>
        <View className="space-y-3">
          {Object.entries(statusConfig).map(([status, config], index) => {
            const isActive = trip.status === status;
            const isPast =
              getStatusProgress(status as TripStatus) < statusProgress &&
              trip.status !== 'CANCELLED';
            const isFuture =
              getStatusProgress(status as TripStatus) > statusProgress &&
              status !== 'CANCELLED';

            return (
              <View key={status} className="flex-row items-center">
                <View
                  className={`mr-3 flex size-6 items-center justify-center rounded-full ${
                    isActive
                      ? config.color
                      : isPast
                        ? 'bg-green-100'
                        : 'bg-gray-100'
                  }`}
                >
                  {isPast ? (
                    <CheckCircle width={14} height={14} color="#059669" />
                  ) : isActive ? (
                    React.cloneElement(config.icon, { width: 14, height: 14 })
                  ) : (
                    <View className="size-2 rounded-full bg-gray-400" />
                  )}
                </View>
                <View className="flex-1">
                  <Text
                    className={`text-sm ${isActive ? 'font-semibold text-gray-900' : 'text-gray-600'}`}
                  >
                    {config.label}
                  </Text>
                  {isActive && (
                    <Text className="text-xs text-gray-500">
                      {config.description}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}
