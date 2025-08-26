/**
 * API Types and Exports
 * Central export point for all API functionality
 */

// Legacy paginate type - kept for backward compatibility
export type PaginateQuery<T> = {
  results: T[];
  count: number;
  next: string | null;
  previous: string | null;
};

// Re-export common types
export * from './common/types';

// Re-export auth module
export * from './auth';

// Re-export trips module
export * from './trips';
