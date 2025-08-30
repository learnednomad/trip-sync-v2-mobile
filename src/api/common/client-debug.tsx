/**
 * Enhanced API Client with Comprehensive Debugging
 * Replace your client.tsx temporarily with this version for debugging
 */

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
 * Enhanced request interceptor with comprehensive debugging
 */
client.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    console.log('\n🚀 === REQUEST INTERCEPTOR START ===');
    console.log('🌐 Base URL:', config.baseURL);
    console.log('🎯 Request URL:', config.url);
    console.log('📋 Method:', config.method?.toUpperCase());

    // Token retrieval and debugging
    console.log('🔍 Getting token...');
    const token = getToken();
    console.log('🔑 Token exists:', !!token);

    if (token) {
      console.log('📊 Token structure:', Object.keys(token));
      console.log('🔐 Access token length:', token.access?.length || 0);
      console.log('🔄 Refresh token length:', token.refresh?.length || 0);
      console.log(
        '🎫 Access token preview:',
        token.access?.substring(0, 50) + '...'
      );

      if (token.access) {
        config.headers.Authorization = `Bearer ${token.access}`;
        console.log('✅ Authorization header set');
      } else {
        console.error('❌ No access token available');
      }
    } else {
      console.error('❌ No token found in storage');
    }

    // Add request ID for tracing
    const requestId = generateRequestId();
    config.headers['X-Request-ID'] = requestId;
    console.log('🏷️ Request ID:', requestId);

    // Log final headers
    console.log('📤 Final headers:', {
      Authorization: config.headers.Authorization
        ? 'Bearer [TOKEN]'
        : 'NOT SET',
      'Content-Type': config.headers['Content-Type'],
      'X-Request-ID': config.headers['X-Request-ID'],
      ...Object.fromEntries(
        Object.entries(config.headers).filter(
          ([key]) =>
            !['Authorization', 'Content-Type', 'X-Request-ID'].includes(key)
        )
      ),
    });

    console.log('🏁 === REQUEST INTERCEPTOR END ===\n');
    return config;
  },
  (error) => {
    console.error('\n🚨 === REQUEST INTERCEPTOR ERROR ===');
    console.error('❌ Request interceptor failed:', error);
    console.error('🏁 === END REQUEST ERROR ===\n');
    return Promise.reject(error);
  }
);

/**
 * Enhanced response interceptor with comprehensive debugging
 */
client.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    console.log('\n✅ === RESPONSE INTERCEPTOR SUCCESS ===');
    console.log('🎯 URL:', response.config.url);
    console.log('📊 Status:', response.status);
    console.log('📥 Success:', response.data?.success);
    console.log('🏷️ Request ID:', response.config.headers['X-Request-ID']);

    if (response.data?.data) {
      console.log('📦 Data keys:', Object.keys(response.data.data));
    }
    if (response.data?.error) {
      console.log('⚠️ Error in success response:', response.data.error);
    }

    console.log('🏁 === END RESPONSE SUCCESS ===\n');
    return response;
  },
  async (error: AxiosError<ApiResponse>) => {
    console.log('\n🚨 === RESPONSE INTERCEPTOR ERROR ===');

    const originalRequest = error.config as RetryAxiosRequestConfig;

    console.log('🎯 Failed URL:', originalRequest?.url);
    console.log('📊 Error Status:', error.response?.status);
    console.log('🏷️ Request ID:', originalRequest?.headers?.['X-Request-ID']);
    console.log('🔄 Is Retry:', !!originalRequest?._retry);

    if (error.response) {
      console.log('📥 Error Response Data:', error.response.data);
      console.log('📋 Response Headers:', error.response.headers);
    } else {
      console.log('🌐 Network Error:', error.message);
    }

    // Handle 401 Unauthorized - attempt token refresh
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      console.log('\n🔄 === TOKEN REFRESH ATTEMPT ===');
      originalRequest._retry = true;

      try {
        console.log('🔍 Getting refresh token...');
        const token = getToken();

        if (token?.refresh) {
          console.log('🔄 Refresh token available, attempting refresh...');
          const refreshResponse = await refreshToken(token.refresh);

          console.log('📊 Refresh response:', refreshResponse);

          if (refreshResponse.success && refreshResponse.data) {
            console.log('✅ Token refresh successful');

            // Update stored token
            const { setToken } = await import('@/lib/auth/utils');
            setToken(refreshResponse.data);
            console.log('💾 New tokens stored');

            // Retry original request
            originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.access}`;
            console.log('🔁 Retrying original request with new token...');

            const retryResult = await client(originalRequest);
            console.log('✅ Retry successful');
            console.log('🏁 === END TOKEN REFRESH SUCCESS ===\n');

            return retryResult;
          } else {
            console.error('❌ Refresh response unsuccessful:', refreshResponse);
          }
        } else {
          console.error('❌ No refresh token available');
        }
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);

        // Refresh failed, sign out user
        console.log('🧹 Clearing tokens due to refresh failure...');
        removeToken();

        console.log('🏁 === END TOKEN REFRESH FAILURE ===\n');
        throw new AuthenticationError('Session expired. Please sign in again.');
      }
    }

    console.log('🏁 === END RESPONSE ERROR ===\n');

    // Handle different error types (same as original)
    if (!error.response) {
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
 * Enhanced token refresh function with debugging
 */
async function refreshToken(refreshToken: string): Promise<ApiResponse> {
  console.log('🔄 Calling refresh endpoint...');
  console.log('🌐 Refresh URL:', `${Env.API_URL}/api/v2/auth/refresh`);

  const response = await axios.post<ApiResponse>(
    `${Env.API_URL}/api/v2/auth/refresh`,
    { refreshToken },
    {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    }
  );

  console.log('📊 Refresh response status:', response.status);
  console.log('📥 Refresh response data:', response.data);

  return response.data;
}

/**
 * Generate unique request ID for tracing
 */
function generateRequestId(): string {
  return `mobile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Export the same interface as original client
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

        console.log(
          `🔄 Retrying request (attempt ${attempt + 1}/${maxRetries}) after ${delay}ms delay`
        );
      }
    }

    throw lastError!;
  },
};
