import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { storage } from '@/lib/storage';

import { useAuth } from './index';

const PENDING_ROUTE_KEY = '@trip-sync/pending-route';

/**
 * Deep link handler that preserves routes for after authentication
 */
export function DeepLinkHandler() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStatus();

  useEffect(() => {
    handlePendingNavigation();
  }, [isAuthenticated, isLoading]);

  const handlePendingNavigation = async () => {
    if (isLoading) return;

    if (isAuthenticated) {
      // Check for pending route after successful authentication
      try {
        const pendingRoute = storage.getString(PENDING_ROUTE_KEY);
        if (pendingRoute) {
          storage.delete(PENDING_ROUTE_KEY);
          router.replace(pendingRoute as any); // Type assertion for dynamic routes
        }
      } catch (error) {
        console.error('Error handling pending navigation:', error);
      }
    }
  };

  return null;
}

/**
 * Store a route to navigate to after authentication
 */
export const storePendingRoute = (route: string) => {
  try {
    storage.set(PENDING_ROUTE_KEY, route);
  } catch (error) {
    console.error('Error storing pending route:', error);
  }
};

/**
 * Clear any stored pending route
 */
export const clearPendingRoute = () => {
  try {
    storage.delete(PENDING_ROUTE_KEY);
  } catch (error) {
    console.error('Error clearing pending route:', error);
  }
};

/**
 * Hook for handling protected deep links
 */
export function useProtectedDeepLink() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStatus();

  const navigateToProtectedRoute = (route: string) => {
    if (isAuthenticated) {
      router.push(route as any); // Type assertion for dynamic routes
    } else {
      // Store route for after authentication
      storePendingRoute(route);
      router.push('/(auth)/login' as any);
    }
  };

  return { navigateToProtectedRoute };
}

// Import this function to fix the missing import
function useAuthStatus() {
  const status = useAuth.use.status();
  const token = useAuth.use.token();

  return {
    isAuthenticated: status === 'signIn' && !!token,
    isLoading: status === 'idle',
    isGuest: status === 'signOut' || !token,
    status,
    token,
  };
}
