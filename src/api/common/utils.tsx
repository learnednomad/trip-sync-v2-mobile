import type {
  GetNextPageParamFunction,
  GetPreviousPageParamFunction,
} from '@tanstack/react-query';

import type { ApiResponse, PaginationParams } from './types';

type KeyParams = {
  [key: string]: any;
};

export const DEFAULT_LIMIT = 10;
export const MAX_LIMIT = 50;

/**
 * Generate query keys for TanStack Query
 */
export function getQueryKey<T extends KeyParams>(key: string, params?: T) {
  return [key, ...(params ? [params] : [])];
}

/**
 * Normalize paginated API response for backend compatibility
 */
export function normalizePages<T>(pages?: ApiResponse<T[]>[]): T[] {
  return pages && pages.length > 0
    ? pages.reduce((prev: T[], current) => {
        return current.success && current.data
          ? [...prev, ...current.data]
          : prev;
      }, [])
    : [];
}

/**
 * Extract URL parameters for pagination
 */
export function getUrlParameters(
  url: string | null
): { [k: string]: string } | null {
  if (url === null) {
    return null;
  }
  let regex = /[?&]([^=#]+)=([^&#]*)/g,
    params = {},
    match;
  while ((match = regex.exec(url))) {
    if (match[1] !== null) {
      //@ts-ignore
      params[match[1]] = match[2];
    }
  }
  return params;
}

/**
 * Backend-compatible pagination helpers for TanStack Query infinite queries
 */
export const getPreviousPageParam: GetPreviousPageParamFunction<
  unknown,
  ApiResponse<unknown[]>
> = (firstPage) => {
  if (!firstPage.success || !firstPage.metadata) return undefined;

  const { page = 1 } = firstPage.metadata;
  return page > 1 ? page - 1 : undefined;
};

export const getNextPageParam: GetNextPageParamFunction<
  unknown,
  ApiResponse<unknown[]>
> = (lastPage) => {
  if (!lastPage.success || !lastPage.metadata) return undefined;

  const { page = 1, hasMore = false } = lastPage.metadata;
  return hasMore ? page + 1 : undefined;
};

/**
 * Build pagination parameters for API requests
 */
export function buildPaginationParams(
  page?: number,
  limit?: number
): PaginationParams {
  return {
    page: page || 1,
    limit: Math.min(limit || DEFAULT_LIMIT, MAX_LIMIT),
  };
}

/**
 * Format error message for user display
 */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
}

/**
 * Check if we're currently online
 */
export function isOnline(): boolean {
  // This would integrate with NetInfo in a real app
  // For now, assume online
  return true;
}

/**
 * Generate cache key for offline storage
 */
export function generateCacheKey(endpoint: string, params?: any): string {
  const baseKey = endpoint.replace(/\//g, '_');
  if (!params) return baseKey;

  const paramString = Object.keys(params)
    .sort()
    .map((key) => `${key}-${params[key]}`)
    .join('_');

  return `${baseKey}_${paramString}`;
}

/**
 * Debounce function for search and other operations
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
