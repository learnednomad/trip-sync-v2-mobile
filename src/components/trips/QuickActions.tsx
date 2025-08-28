/**
 * Quick Actions Component
 * Epic 2: Story 2.1 - Core Trip Management
 * Quick access to trip creation options
 */

import React from 'react';
import { View, ScrollView } from 'react-native';
import { Plus, Bookmark, Copy, Calendar } from '@/components/ui/icons';

import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';

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
  onQuickPlan 
}: QuickActionsProps) {
  return (
    <View className="bg-white border-b border-gray-100 px-4 py-3">
      <Text className="text-sm font-medium text-gray-700 mb-3">Quick Actions</Text>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row space-x-3">
          {/* Create New Trip */}
          <Button
            onPress={onCreateTrip}
            className="bg-blue-600 px-4 py-3 rounded-lg flex-row items-center"
          >
            <Plus width={16} height={16} color="white" />
            <Text className="text-white font-medium ml-2">New Trip</Text>
          </Button>

          {/* Use Template */}
          <Button
            variant="outline"
            onPress={onShowTemplates}
            className="px-4 py-3 rounded-lg flex-row items-center border-blue-200"
          >
            <Bookmark width={16} height={16} color="#2563EB" />
            <Text className="text-blue-600 font-medium ml-2">Templates</Text>
          </Button>

          {/* Duplicate Last Trip */}
          <Button
            variant="outline"
            onPress={onDuplicateLastTrip}
            className="px-4 py-3 rounded-lg flex-row items-center border-gray-200"
          >
            <Copy width={16} height={16} color="#6B7280" />
            <Text className="text-gray-600 font-medium ml-2">Duplicate</Text>
          </Button>

          {/* Quick Plan */}
          <Button
            variant="outline"
            onPress={onQuickPlan}
            className="px-4 py-3 rounded-lg flex-row items-center border-green-200"
          >
            <Calendar width={16} height={16} color="#059669" />
            <Text className="text-green-600 font-medium ml-2">Quick Plan</Text>
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}