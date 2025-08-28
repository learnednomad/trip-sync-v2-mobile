/**
 * Authentication React Query Hooks
 * TanStack Query integration for auth operations
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import {
  signIn as authSignIn,
  signOut as authSignOut,
  useAuth,
} from '@/lib/auth';

import * as authApi from './api';
import type {
  LoginRequest,
  LogoutRequest,
  PasswordResetRequest,
  RegisterRequest,
} from './types';

// Query Keys
export const authKeys = {
  all: ['auth'] as const,
  user: () => [...authKeys.all, 'user'] as const,
  config: () => [...authKeys.all, 'config'] as const,
  verify: (token: string) => [...authKeys.all, 'verify', token] as const,
  tokenCheck: (token: string) =>
    [...authKeys.all, 'token-check', token] as const,
};

/**
 * Get current authenticated user profile
 */
export const useCurrentUser = () => {
  const { token, status } = useAuth();

  return useQuery({
    queryKey: authKeys.user(),
    queryFn: authApi.getCurrentUser,
    enabled: status === 'signIn' && !!token?.access,
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (error && 'status' in error && error.status === 401) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

/**
 * Get JWT configuration from server
 */
export const useJwtConfig = () => {
  return useQuery({
    queryKey: authKeys.config(),
    queryFn: authApi.getJwtConfig,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });
};

/**
 * Register a new user account
 */
export const useRegister = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: (response) => {
      if (response.success && response.data) {
        // Sign in user with returned tokens
        authSignIn({
          access: response.data.tokens.access,
          refresh: response.data.tokens.refresh,
        });

        // Cache user data
        queryClient.setQueryData(authKeys.user(), {
          success: true,
          data: { user: response.data.user },
        });

        // Navigate to main app
        router.replace('/(app)/(tabs)/');
      }
    },
    onError: (error) => {
      console.error('Registration failed:', error);
    },
  });
};

/**
 * Sign in with email and password
 */
export const useLogin = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (response) => {
      console.log('🔍 Full login response:', JSON.stringify(response, null, 2));
      
      if (response.success && response.data) {
        console.log('📊 Tokens structure:', response.data.tokens);
        console.log('🔑 Available token fields:', Object.keys(response.data.tokens || {}));
        
        // Enhanced token extraction - handles multiple possible field names
        const tokens = response.data.tokens;
        const accessToken = tokens?.access || tokens?.accessToken || tokens?.token;
        const refreshToken = tokens?.refresh || tokens?.refreshToken;
        
        console.log('🎯 Extracted tokens:');
        console.log('  - Access token length:', accessToken?.length || 0);
        console.log('  - Refresh token length:', refreshToken?.length || 0);
        
        if (accessToken && refreshToken) {
          // Sign in user with returned tokens
          authSignIn({
            access: accessToken,
            refresh: refreshToken,
          });
          console.log('✅ Tokens stored successfully via authSignIn');
        } else {
          console.error('❌ Could not extract valid tokens from response');
          console.error('Available fields:', tokens ? Object.keys(tokens) : 'No tokens object');
        }

        // Cache user data
        queryClient.setQueryData(authKeys.user(), {
          success: true,
          data: { user: response.data.user },
        });

        // Navigate to main app
        router.replace('/(app)/(tabs)/');
      }
    },
    onError: (error) => {
      console.error('Login failed:', error);
    },
  });
};

/**
 * Sign out current user
 */
export const useLogout = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { token } = useAuth();

  return useMutation({
    mutationFn: (data?: Partial<LogoutRequest>) => {
      const logoutData: LogoutRequest = {
        refreshToken: token?.refresh || '',
        allDevices: data?.allDevices || false,
      };
      return authApi.logout(logoutData);
    },
    onSuccess: () => {
      // Sign out user locally
      authSignOut();

      // Clear all auth-related queries
      queryClient.removeQueries({ queryKey: authKeys.all });

      // Navigate to sign in screen
      router.replace('/sign-in');
    },
    onError: (error) => {
      // Even if server logout fails, sign out locally
      console.error('Logout request failed:', error);
      authSignOut();
      queryClient.removeQueries({ queryKey: authKeys.all });
      router.replace('/sign-in');
    },
  });
};

/**
 * Request password reset
 */
export const usePasswordReset = () => {
  return useMutation({
    mutationFn: (data: PasswordResetRequest) =>
      authApi.requestPasswordReset(data),
    onSuccess: (response) => {
      if (response.success) {
        console.log('Password reset email sent');
      }
    },
    onError: (error) => {
      console.error('Password reset failed:', error);
    },
  });
};

/**
 * Verify token validity
 */
export const useVerifyToken = (token?: string) => {
  return useQuery({
    queryKey: authKeys.verify(token || ''),
    queryFn: () => authApi.verifyToken({ token: token || '' }),
    enabled: !!token,
    retry: false,
    staleTime: 0, // Always check server
  });
};

/**
 * Check token expiration status
 */
export const useTokenCheck = (token?: string) => {
  return useQuery({
    queryKey: authKeys.tokenCheck(token || ''),
    queryFn: () => authApi.checkTokenStatus(token || ''),
    enabled: !!token,
    retry: false,
    refetchInterval: 1000 * 60 * 5, // Check every 5 minutes
  });
};
