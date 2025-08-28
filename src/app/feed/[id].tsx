import { Stack, useLocalSearchParams } from 'expo-router';
import * as React from 'react';

import { useTrip } from '@/api';
import {
  ActivityIndicator,
  FocusAwareStatusBar,
  Text,
  View,
} from '@/components/ui';

export default function TripDetail() {
  const local = useLocalSearchParams<{ id: string }>();

  const { data: tripData, isPending, isError } = useTrip(local.id);

  if (isPending) {
    return (
      <View className="flex-1 justify-center p-3">
        <Stack.Screen options={{ title: 'Trip', headerBackTitle: 'Home' }} />
        <FocusAwareStatusBar />
        <ActivityIndicator />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 justify-center p-3">
        <Stack.Screen options={{ title: 'Trip', headerBackTitle: 'Home' }} />
        <FocusAwareStatusBar />
        <Text className="text-center text-red-600">Error loading trip</Text>
      </View>
    );
  }

  const trip = tripData?.data?.trip;

  if (!trip) {
    return (
      <View className="flex-1 justify-center p-3">
        <Stack.Screen options={{ title: 'Trip', headerBackTitle: 'Home' }} />
        <FocusAwareStatusBar />
        <Text className="text-center">Trip not found</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 p-4">
      <Stack.Screen options={{ title: trip.name, headerBackTitle: 'Home' }} />
      <FocusAwareStatusBar />

      <View className="mb-4 rounded-lg bg-white p-4">
        <Text className="mb-2 text-2xl font-bold text-gray-900">
          {trip.name}
        </Text>
        {trip.description && (
          <Text className="mb-4 text-gray-600">{trip.description}</Text>
        )}

        <View className="space-y-2">
          <View className="flex-row items-center">
            <Text className="w-20 text-sm font-medium text-gray-500">
              📍 Location:
            </Text>
            <Text className="text-sm text-gray-900">{trip.destination}</Text>
          </View>

          <View className="flex-row items-center">
            <Text className="w-20 text-sm font-medium text-gray-500">
              📅 Dates:
            </Text>
            <Text className="text-sm text-gray-900">
              {new Date(trip.startDate).toLocaleDateString()} -{' '}
              {new Date(trip.endDate).toLocaleDateString()}
            </Text>
          </View>

          <View className="flex-row items-center">
            <Text className="w-20 text-sm font-medium text-gray-500">
              🎯 Status:
            </Text>
            <Text className="text-sm font-medium text-blue-600">
              {trip.status}
            </Text>
          </View>

          {trip.budgetAmount && (
            <View className="flex-row items-center">
              <Text className="w-20 text-sm font-medium text-gray-500">
                💰 Budget:
              </Text>
              <Text className="text-sm text-gray-900">
                {trip.budgetCurrency} {trip.budgetAmount.toLocaleString()}
              </Text>
            </View>
          )}

          <View className="flex-row items-center">
            <Text className="w-20 text-sm font-medium text-gray-500">
              👥 Members:
            </Text>
            <Text className="text-sm text-gray-900">
              {trip.participants.length} participant(s)
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
