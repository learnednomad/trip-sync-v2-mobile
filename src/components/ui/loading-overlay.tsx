/**
 * Loading Overlay Component
 * Displays a full-screen loading overlay with message
 */

import React from 'react';
import { View, Modal, ActivityIndicator } from 'react-native';

import { Text } from '@/components/ui/text';

interface LoadingOverlayProps {
  message?: string;
  visible?: boolean;
}

export function LoadingOverlay({ 
  message = 'Loading...', 
  visible = true 
}: LoadingOverlayProps) {
  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      statusBarTranslucent
    >
      <View className="flex-1 bg-black/50 items-center justify-center">
        <View className="bg-white rounded-2xl px-8 py-6 items-center space-y-4 mx-8 shadow-lg">
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className="text-gray-900 font-medium text-center">
            {message}
          </Text>
        </View>
      </View>
    </Modal>
  );
}