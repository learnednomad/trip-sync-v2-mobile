/**
 * Simplified Authentication Guards
 * Streamlined approach with just essential patterns
 */

import { Redirect } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { ActivityIndicator } from '@/components/ui';
import { useAuth } from './index';

/**
 * Simple authentication status hook - replaces useAuthStatus
 */
export const useAuthState = () => {
  const status = useAuth.use.status();
  const token = useAuth.use.token();
  
  return {
    isAuthenticated: status === 'signIn' && !!token,
    isLoading: status === 'idle',
    status,
    token,
  };
};

/**
 * Simple protected route component - replaces AuthGuard, useRequireAuth, NavigationGuard
 */
export const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  fallback?: string;
}> = ({ children, fallback = '/(auth)/login' }) => {
  const { isAuthenticated, isLoading } = useAuthState();
  
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href={fallback as any} />;
  }

  return <>{children}</>;
};

/**
 * Simple guest-only route component - replaces GuestGuard, useRequireGuest
 */
export const GuestOnlyRoute: React.FC<{
  children: React.ReactNode;
  fallback?: string;
}> = ({ children, fallback = '/(app)' }) => {
  const { isAuthenticated, isLoading } = useAuthState();
  
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href={fallback as any} />;
  }

  return <>{children}</>;
};

// Export simplified API - only 2 components + 1 hook instead of 5+ patterns
export {
  useAuthState as useAuth, // Can replace the complex auth patterns
  ProtectedRoute,
  GuestOnlyRoute,
};