import { MotiView } from 'moti';
import React from 'react';
import { View } from 'react-native';

import { useNavigationStore } from '@/lib/navigation/navigation-store';
import { ActivityIndicator } from './index';
import { Text } from './text';

/**
 * Global loading overlay
 * Shows when app-wide operations are in progress
 */
export const GlobalLoadingOverlay: React.FC = () => {
  const globalLoading = useNavigationStore.use.globalLoading?.() || false;
  const loadingMessage = useNavigationStore.use.loadingMessage?.() || '';

  if (!globalLoading) return null;

  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-black/50 items-center justify-center z-50"
      style={{ zIndex: 9999 }}
    >
      <View className="bg-white dark:bg-neutral-800 rounded-lg p-6 items-center min-w-48 shadow-xl">
        <ActivityIndicator size="large" className="mb-4" />
        <Text className="text-base font-medium text-neutral-900 dark:text-white text-center">
          {loadingMessage || 'Loading...'}
        </Text>
      </View>
    </MotiView>
  );
};

/**
 * Hook for controlling global loading state
 */
export const useGlobalLoading = () => {
  const showGlobalLoading = useNavigationStore.use.showGlobalLoading?.() || (() => {});
  const hideGlobalLoading = useNavigationStore.use.hideGlobalLoading?.() || (() => {});
  const isLoading = useNavigationStore.use.globalLoading?.() || false;
  const message = useNavigationStore.use.loadingMessage?.() || '';

  return {
    isLoading,
    message: message || undefined,
    show: showGlobalLoading,
    hide: hideGlobalLoading,
    
    // Utility function for wrapping async operations  
    withLoading: async (operation: () => Promise<any>, loadingMessage?: string) => {
      try {
        showGlobalLoading(loadingMessage);
        const result = await operation();
        return result;
      } finally {
        hideGlobalLoading();
      }
    },
  };
};