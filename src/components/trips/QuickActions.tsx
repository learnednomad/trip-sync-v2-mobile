/**
 * Quick Actions Component
 * Epic 2: Story 2.1 - Core Trip Management
 * Quick access to trip creation options
 */

import React from 'react';
import { ScrollView, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Bookmark, Calendar, Copy, Plus } from '@/components/ui/icons';
import { Text } from '@/components/ui/text';

interface QuickActionsProps {
  onCreateTrip: () => void;
  onShowTemplates: () => void;
  onDuplicateLastTrip: () => void;
  onQuickPlan: () => void;
}

export function QuickActions({
  onCreateTrip,
  onShowTemplates,
  onDuplicateLastTrip,
  onQuickPlan,
}: QuickActionsProps) {
  return (
    <View className="border-b border-gray-100 bg-white px-4 py-3">
      <Text className="mb-3 text-sm font-medium text-gray-700">
        Quick Actions
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row space-x-3">
          {/* Create New Trip */}
          <Button
            onPress={onCreateTrip}
            className="flex-row items-center rounded-lg bg-blue-600 px-4 py-3"
          >
            <Plus width={16} height={16} color="white" />
            <Text className="ml-2 font-medium text-white">New Trip</Text>
          </Button>

          {/* Use Template */}
          <Button
            variant="outline"
            onPress={onShowTemplates}
            className="flex-row items-center rounded-lg border-blue-200 px-4 py-3"
          >
            <Bookmark width={16} height={16} color="#2563EB" />
            <Text className="ml-2 font-medium text-blue-600">Templates</Text>
          </Button>

          {/* Duplicate Last Trip */}
          <Button
            variant="outline"
            onPress={onDuplicateLastTrip}
            className="flex-row items-center rounded-lg border-gray-200 px-4 py-3"
          >
            <Copy width={16} height={16} color="#6B7280" />
            <Text className="ml-2 font-medium text-gray-600">Duplicate</Text>
          </Button>

          {/* Quick Plan */}
          <Button
            variant="outline"
            onPress={onQuickPlan}
            className="flex-row items-center rounded-lg border-green-200 px-4 py-3"
          >
            <Calendar width={16} height={16} color="#059669" />
            <Text className="ml-2 font-medium text-green-600">Quick Plan</Text>
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}
