import { Redirect, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { View } from 'react-native';

import { ActivityIndicator } from '@/components/ui';

import { useAuth } from './index';

type AuthRoutes =
  | '/(auth)/login'
  | '/(auth)/register'
  | '/(auth)/forgot-password'
  | '/(auth)/onboarding';
type AppRoutes = '/(app)' | '/(app)/trips' | '/(app)/settings';

interface AuthGuardProps {
  children: React.ReactNode;
  fallbackRoute?: AuthRoutes;
}

interface GuestGuardProps {
  children: React.ReactNode;
  fallbackRoute?: AppRoutes;
}

/**
 * Route guard that protects authenticated routes
 * Redirects unauthenticated users to login
 */
export function AuthGuard({
  children,
  fallbackRoute = '/(auth)/login',
}: AuthGuardProps) {
  const status = useAuth.use.status();
  const token = useAuth.use.token();

  // Show loading while auth state is being determined
  if (status === 'idle') {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" testID="activity-indicator" />
      </View>
    );
  }

  // Redirect to login if user is signed out or no token
  if (status === 'signOut' || !token) {
    return <Redirect href={fallbackRoute} />;
  }

  // User is authenticated, render protected content
  return <>{children}</>;
}

/**
 * Route guard that protects guest-only routes (login, register)
 * Redirects authenticated users to main app
 */
export function GuestGuard({
  children,
  fallbackRoute = '/(app)',
}: GuestGuardProps) {
  const status = useAuth.use.status();
  const token = useAuth.use.token();

  // Show loading while auth state is being determined
  if (status === 'idle') {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" testID="activity-indicator" />
      </View>
    );
  }

  // Redirect to main app if user is signed in
  if (status === 'signIn' && token) {
    return <Redirect href={fallbackRoute} />;
  }

  // User is not authenticated, render guest content
  return <>{children}</>;
}

/**
 * Higher-order component for protecting routes
 * Usage: export default withAuth(MyProtectedScreen)
 */
export function withAuth<T extends object>(Component: React.ComponentType<T>) {
  return function ProtectedComponent(props: T) {
    return (
      <AuthGuard>
        <Component {...props} />
      </AuthGuard>
    );
  };
}

/**
 * Higher-order component for guest-only routes
 * Usage: export default withGuest(LoginScreen)
 */
export function withGuest<T extends object>(Component: React.ComponentType<T>) {
  return function GuestComponent(props: T) {
    return (
      <GuestGuard>
        <Component {...props} />
      </GuestGuard>
    );
  };
}

/**
 * Navigation guard component to handle route access control
 * Monitors route changes and applies protection rules
 */
export function NavigationGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const status = useAuth.use.status();
  const token = useAuth.use.token();

  useEffect(() => {
    // Log authentication state changes for debugging
    console.log('🛡️ NavigationGuard: Auth state changed', {
      status,
      hasToken: !!token,
    });
  }, [status, token]);

  return <>{children}</>;
}

/**
 * Hook for checking authentication status in components
 */
export function useAuthStatus() {
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

/**
 * Hook for requiring authentication in components
 * Automatically redirects to login if not authenticated
 */
export function useRequireAuth(redirectTo: AuthRoutes = '/(auth)/login') {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStatus();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [isAuthenticated, isLoading, redirectTo, router]);

  return { isAuthenticated, isLoading };
}

/**
 * Hook for preventing access when authenticated (guest-only routes)
 */
export function useRequireGuest(redirectTo: AppRoutes = '/(app)') {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStatus();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [isAuthenticated, isLoading, redirectTo, router]);

  return { isAuthenticated, isLoading };
}
