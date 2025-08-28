/**
 * Trip Sync API Exports
 * Central export point for all API services and types
 */

// Common types and utilities
export { APIProvider } from './common/api-provider';
export { client, clientWithRetry } from './common/client';
export * from './common/types';

// Authentication API
export * from './auth/api';
export * from './auth/types';
export * from './auth/use-auth';

// Trips API
export * from './trips/api';
export * from './trips/types';
export * from './trips/use-trips';
