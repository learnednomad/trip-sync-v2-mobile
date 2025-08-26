import { Env } from '@env';
import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

import { getToken, removeToken } from '@/lib/auth/utils';

import type { ApiResponse } from './types';
import { ApiClientError, AuthenticationError, NetworkError, ValidationError } from './types';

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
    if (token?.access) {
      config.headers.Authorization = `Bearer ${token.access}`;
    }
    
    // Add request ID for tracing
    config.headers['X-Request-ID'] = generateRequestId();
    
    // Development logging
    if (__DEV__) {
      console.log(`📤 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
        headers: config.headers,
        data: config.data,
      });
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
      console.log(`📥 API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data,
      });
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
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const token = getToken();
        if (token?.refresh) {
          const refreshResponse = await refreshToken(token.refresh);
          if (refreshResponse.success && refreshResponse.data) {
            // Update stored token
            const { setToken } = await import('@/lib/auth/utils');
            setToken(refreshResponse.data);
            
            // Retry original request
            originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.access}`;
            return client(originalRequest);
          }
        }
      } catch (refreshError) {
        // Refresh failed, sign out user
        removeToken();
        // You might want to navigate to login screen here
        throw new AuthenticationError('Session expired. Please sign in again.');
      }
    }
    
    // Handle different error types
    if (!error.response) {
      // Network error
      throw new NetworkError('Unable to connect to server. Please check your internet connection.');
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
        throw new AuthenticationError(apiError?.message || 'Authentication failed');
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
        if (error instanceof ApiClientError && error.status && error.status >= 400 && error.status < 500 && error.status !== 408) {
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
        await new Promise(resolve => setTimeout(resolve, delay));
        
        if (__DEV__) {
          console.log(`🔄 Retrying request (attempt ${attempt + 1}/${maxRetries}) after ${delay}ms delay`);
        }
      }
    }
    
    throw lastError!;
  }
};
