import { FlashList } from '@shopify/flash-list';
import React from 'react';

import type { Trip } from '@/api';
import { useTrips } from '@/api';
import { EmptyList, FocusAwareStatusBar, Text, View } from '@/components/ui';

export default function Home() {
  const { data: tripsData, isPending, isError } = useTrips();

  const renderItem = React.useCallback(
    ({ item }: { item: Trip }) => (
      <View className="mx-4 my-2 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <Text className="text-lg font-semibold text-gray-900">{item.name}</Text>
        {item.description && (
          <Text className="mt-1 text-sm text-gray-600">{item.description}</Text>
        )}
        <View className="mt-2 flex-row justify-between">
          <Text className="text-sm text-gray-500">📍 {item.destination}</Text>
          <Text className="text-sm text-gray-500">
            {new Date(item.startDate).toLocaleDateString()}
          </Text>
        </View>
        <View className="mt-1">
          <Text className="text-xs font-medium text-blue-600">
            {item.status}
          </Text>
        </View>
      </View>
    ),
    []
  );

  if (isError) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-red-600">Error loading trips</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <FocusAwareStatusBar />
      <FlashList
        data={tripsData?.data?.trips ?? []}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<EmptyList isLoading={isPending} />}
        estimatedItemSize={120}
      />
    </View>
  );
}
