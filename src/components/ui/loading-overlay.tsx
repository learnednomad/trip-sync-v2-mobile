/**
 * Loading Overlay Component
 * Displays a full-screen loading overlay with message
 */

import React from 'react';
import { ActivityIndicator, Modal, View } from 'react-native';

import { Text } from '@/components/ui/text';

interface LoadingOverlayProps {
  message?: string;
  visible?: boolean;
}

export function LoadingOverlay({
  message = 'Loading...',
  visible = true,
}: LoadingOverlayProps) {
  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      statusBarTranslucent
    >
      <View className="flex-1 items-center justify-center bg-black/50">
        <View className="mx-8 items-center space-y-4 rounded-2xl bg-white px-8 py-6 shadow-lg">
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className="text-center font-medium text-gray-900">
            {message}
          </Text>
        </View>
      </View>
    </Modal>
  );
}
