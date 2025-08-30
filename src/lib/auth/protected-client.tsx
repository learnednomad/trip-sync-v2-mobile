/**
 * Protected API Client
 * Ensures authentication before making API calls
 */

import { type AxiosRequestConfig } from 'axios';

import { client } from '@/api/common/client';

import { useAuth } from './index';
import { getToken } from './utils';

export class AuthenticationRequiredError extends Error {
  constructor(message = 'Authentication required for this operation') {
    super(message);
    this.name = 'AuthenticationRequiredError';
  }
}

/**
 * Protected API client that ensures authentication before making requests
 */
export const protectedClient = {
  /**
   * Make a GET request with authentication validation
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    validateAuthentication('GET', url);
    const response = await client.get<T>(url, config);
    return response.data;
  },

  /**
   * Make a POST request with authentication validation
   */
  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    validateAuthentication('POST', url);
    const response = await client.post<T>(url, data, config);
    return response.data;
  },

  /**
   * Make a PUT request with authentication validation
   */
  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    validateAuthentication('PUT', url);
    const response = await client.put<T>(url, data, config);
    return response.data;
  },

  /**
   * Make a DELETE request with authentication validation
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    validateAuthentication('DELETE', url);
    const response = await client.delete<T>(url, config);
    return response.data;
  },

  /**
   * Make a PATCH request with authentication validation
   */
  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    validateAuthentication('PATCH', url);
    const response = await client.patch<T>(url, data, config);
    return response.data;
  },
};

/**
 * Validate that user is authenticated before making API calls
 */
function validateAuthentication(method: string, url: string): void {
  const token = getToken();

  // Skip validation for auth endpoints
  const isAuthEndpoint =
    url.includes('/auth/login') ||
    url.includes('/auth/register') ||
    url.includes('/auth/refresh') ||
    url.includes('/auth/verify');

  if (isAuthEndpoint) {
    return;
  }

  if (!token?.access) {
    if (__DEV__) {
      console.error(`🚨 Authentication Error: ${method} ${url}`);
      console.error('No access token available. User must login first.');
    }
    throw new AuthenticationRequiredError(
      `Authentication required for ${method} ${url}. Please login first.`
    );
  }

  // Basic token validation
  try {
    const tokenParts = token.access.split('.');
    if (tokenParts.length !== 3) {
      throw new AuthenticationRequiredError(
        'Invalid authentication token format'
      );
    }

    // Check expiration
    const payload = JSON.parse(atob(tokenParts[1]));
    const now = Math.floor(Date.now() / 1000);
    const isExpired = payload.exp && payload.exp < now;

    if (isExpired) {
      if (__DEV__) {
        console.error(`🚨 Token Expired: ${method} ${url}`);
        console.error(
          'Access token has expired. Token refresh will be attempted.'
        );
      }
      // Don't throw here - let axios interceptor handle token refresh
    }
  } catch (e) {
    if (__DEV__) {
      console.warn(
        `⚠️  Token validation failed for ${method} ${url}:`,
        (e as Error).message
      );
    }
    // Continue anyway - let server validate
  }

  if (__DEV__) {
    console.log(`🔒 Protected request validated: ${method} ${url}`);
  }
}

/**
 * React hook for protected API calls
 */
export const useProtectedClient = () => {
  const { status, token } = useAuth();

  const isAuthenticated = status === 'signIn' && !!token?.access;

  const makeProtectedRequest = async <T = any,>(
    requestFn: () => Promise<T>,
    options?: {
      requireAuth?: boolean;
      onAuthError?: (error: AuthenticationRequiredError) => void;
    }
  ): Promise<T> => {
    const { requireAuth = true, onAuthError } = options || {};

    if (requireAuth && !isAuthenticated) {
      const error = new AuthenticationRequiredError();
      if (onAuthError) {
        onAuthError(error);
      }
      throw error;
    }

    try {
      return await requestFn();
    } catch (error) {
      if (error instanceof AuthenticationRequiredError && onAuthError) {
        onAuthError(error);
      }
      throw error;
    }
  };

  return {
    protectedClient,
    isAuthenticated,
    makeProtectedRequest,
    authStatus: status,
  };
};
