import { Env } from '@env';
import axios, {
  type AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';

import { getToken, removeToken } from '@/lib/auth/utils';

import type { ApiResponse } from './types';
import {
  ApiClientError,
  AuthenticationError,
  NetworkError,
  ValidationError,
} from './types';

// Extend axios request config to include retry flag
interface RetryAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Create axios client with enhanced configuration
export const client = axios.create({
  baseURL: Env.API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor for authentication
 */
client.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();

    // Enhanced token debugging with validation
    if (__DEV__) {
      console.log('🔍 Request interceptor - Token check:');
      console.log('  - URL:', config.url);
      console.log('  - Method:', config.method?.toUpperCase());
      console.log('  - Token exists:', !!token);
      console.log('  - Access token exists:', !!token?.access);
      console.log('  - Access token length:', token?.access?.length || 0);
      if (token?.access) {
        console.log(
          '  - Access token preview:',
          token.access.substring(0, 50) + '...'
        );

        // Additional token validation
        try {
          const tokenParts = token.access.split('.');
          console.log('  - Token format valid (JWT):', tokenParts.length === 3);
          if (tokenParts.length === 3) {
            // Basic JWT validation - decode payload to check expiration
            const payload = JSON.parse(atob(tokenParts[1]));
            const now = Math.floor(Date.now() / 1000);
            const isExpired = payload.exp && payload.exp < now;
            console.log('  - Token expired:', isExpired);
            console.log(
              '  - Token expires at:',
              new Date((payload.exp || 0) * 1000).toISOString()
            );
          }
        } catch (e) {
          console.log('  - Token validation error:', (e as Error).message);
        }
      }
    }

    // Enhanced token validation
    if (token?.access) {
      // Validate token format (basic JWT check)
      const tokenParts = token.access.split('.');
      if (tokenParts.length !== 3) {
        if (__DEV__) {
          console.error('❌ Invalid token format - not a valid JWT');
        }
        // Don't set invalid token
      } else {
        try {
          // Check if token is expired
          const payload = JSON.parse(atob(tokenParts[1]));
          const now = Math.floor(Date.now() / 1000);
          const isExpired = payload.exp && payload.exp < now;

          if (isExpired) {
            if (__DEV__) {
              console.error('❌ Access token is expired');
            }
            // Don't set expired token - let it fail and trigger refresh
          } else {
            config.headers.Authorization = `Bearer ${token.access}`;
            if (__DEV__) {
              console.log('✅ Authorization header set successfully');
            }
          }
        } catch (e) {
          if (__DEV__) {
            console.error('❌ Token validation failed:', (e as Error).message);
          }
          // Set token anyway - let server validate
          config.headers.Authorization = `Bearer ${token.access}`;
        }
      }
    } else {
      if (__DEV__) {
        console.log('❌ No access token available - header not set');
        console.log('❌ This will likely result in 401 UNAUTHORIZED');

        // Check if this is an auth endpoint that doesn't need tokens
        const isAuthEndpoint =
          config.url?.includes('/auth/login') ||
          config.url?.includes('/auth/register') ||
          config.url?.includes('/auth/refresh');

        if (!isAuthEndpoint) {
          console.warn(
            '⚠️  Non-auth endpoint called without token - this will fail'
          );
        }
      }
    }

    // Add request ID for tracing
    config.headers['X-Request-ID'] = generateRequestId();

    // Development logging
    if (__DEV__) {
      console.log(
        `📤 API Request: ${config.method?.toUpperCase()} ${config.url}`,
        {
          data: config.data,
          headers: {
            ...config.headers,
            Authorization: config.headers.Authorization
              ? 'Bearer [TOKEN]'
              : 'NOT SET',
          },
        }
      );
    }

    return config;
  },
  (error) => {
    if (__DEV__) {
      console.error('📤❌ Request interceptor error:', error);
    }
    return Promise.reject(error);
  }
);

/**
 * Response interceptor for error handling and token refresh
 */
client.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    // Development logging
    if (__DEV__) {
      console.log(
        `📥 API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`,
        {
          status: response.status,
          data: response.data,
        }
      );
    }

    return response;
  },
  async (error: AxiosError<ApiResponse>) => {
    const originalRequest = error.config as RetryAxiosRequestConfig;

    // Development logging
    if (__DEV__) {
      console.error(`📥❌ API Error: ${error.response?.status}`, {
        url: originalRequest?.url,
        data: error.response?.data,
      });
    }

    // Handle 401 Unauthorized - attempt token refresh
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      console.log('\n🔄 === TOKEN REFRESH TRIGGERED ===');
      console.log('🎯 Original request URL:', originalRequest.url);
      console.log('📊 Error message:', error.response?.data?.error?.message);

      originalRequest._retry = true;

      try {
        const token = getToken();
        console.log('🔍 Current token state:', {
          exists: !!token,
          hasAccess: !!token?.access,
          hasRefresh: !!token?.refresh,
          refreshLength: token?.refresh?.length || 0,
        });

        if (token?.refresh) {
          console.log('🔄 Attempting token refresh...');
          const refreshResponse = await refreshToken(token.refresh);
          console.log('📥 Refresh response:', {
            success: refreshResponse.success,
            hasData: !!refreshResponse.data,
            dataKeys: refreshResponse.data
              ? Object.keys(refreshResponse.data)
              : [],
          });

          if (refreshResponse.success && refreshResponse.data) {
            console.log('✅ Token refresh successful');

            // Update stored token - handle different response formats
            const newTokenData = {
              access:
                refreshResponse.data.accessToken || refreshResponse.data.access,
              refresh:
                refreshResponse.data.refreshToken ||
                refreshResponse.data.refresh ||
                token.refresh,
            };

            console.log('💾 Storing new tokens:', {
              accessLength: newTokenData.access?.length || 0,
              refreshLength: newTokenData.refresh?.length || 0,
            });

            const { setToken } = await import('@/lib/auth/utils');
            setToken(newTokenData);

            // Retry original request
            originalRequest.headers.Authorization = `Bearer ${newTokenData.access}`;
            console.log('🔁 Retrying original request with new token...');

            const retryResponse = await client(originalRequest);
            console.log('✅ Retry successful!');
            console.log('🏁 === END TOKEN REFRESH SUCCESS ===\n');
            return retryResponse;
          } else {
            console.error('❌ Refresh response unsuccessful:', refreshResponse);
          }
        } else {
          console.error('❌ No refresh token available');
        }
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);

        // Refresh failed, sign out user
        console.log('🧹 Clearing tokens due to refresh failure');
        removeToken();

        console.log('🏁 === END TOKEN REFRESH FAILURE ===\n');
        throw new AuthenticationError('Session expired. Please sign in again.');
      }
    }

    // Handle different error types
    if (!error.response) {
      // Network error
      throw new NetworkError(
        'Unable to connect to server. Please check your internet connection.'
      );
    }

    const apiError = error.response.data?.error;
    const status = error.response.status;

    switch (status) {
      case 400:
        throw new ValidationError(
          apiError?.message || 'Invalid request data',
          apiError?.details
        );
      case 401:
        throw new AuthenticationError(
          apiError?.message || 'Authentication failed'
        );
      case 403:
        throw new ApiClientError(
          apiError?.message || 'Access denied',
          apiError?.code || 'FORBIDDEN',
          status,
          apiError?.details
        );
      case 404:
        throw new ApiClientError(
          apiError?.message || 'Resource not found',
          apiError?.code || 'NOT_FOUND',
          status
        );
      case 409:
        throw new ApiClientError(
          apiError?.message || 'Conflict occurred',
          apiError?.code || 'CONFLICT',
          status,
          apiError?.details
        );
      default:
        throw new ApiClientError(
          apiError?.message || 'An unexpected error occurred',
          apiError?.code || 'UNKNOWN_ERROR',
          status,
          apiError?.details
        );
    }
  }
);

/**
 * Token refresh function
 */
async function refreshToken(refreshToken: string): Promise<ApiResponse> {
  const response = await axios.post<ApiResponse>(
    `${Env.API_URL}/api/v2/auth/refresh`,
    { refreshToken },
    {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    }
  );
  return response.data;
}

/**
 * Generate unique request ID for tracing
 */
function generateRequestId(): string {
  return `mobile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Enhanced client with retry mechanism
 */
export const clientWithRetry = {
  async request<T>(config: any, maxRetries = 3): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await client.request<ApiResponse<T>>(config);

        if (!response.data.success) {
          throw new ApiClientError(
            response.data.error?.message || 'Request failed',
            response.data.error?.code || 'REQUEST_FAILED',
            response.status,
            response.data.error?.details
          );
        }

        return response.data.data as T;
      } catch (error) {
        lastError = error as Error;

        // Don't retry on client errors (4xx) except 408 (timeout)
        if (
          error instanceof ApiClientError &&
          error.status &&
          error.status >= 400 &&
          error.status < 500 &&
          error.status !== 408
        ) {
          throw error;
        }

        // Don't retry authentication errors
        if (error instanceof AuthenticationError) {
          throw error;
        }

        // If this is the last attempt, throw the error
        if (attempt === maxRetries) {
          throw error;
        }

        // Wait before retrying (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise((resolve) => setTimeout(resolve, delay));

        if (__DEV__) {
          console.log(
            `🔄 Retrying request (attempt ${attempt + 1}/${maxRetries}) after ${delay}ms delay`
          );
        }
      }
    }

    throw lastError!;
  },
};
