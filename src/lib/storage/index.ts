/**
 * Offline-First Storage Module
 * Enhanced storage system with sync capabilities and conflict resolution
 */

// Core storage service
export { default as offlineStorage } from './offline-storage';

// Sync service
export { default as syncService } from './sync-service';

// React hooks
export * from './use-offline-storage';

// Types
export * from './types';

// Legacy compatibility - re-export from original storage
export { getItem, removeItem, setItem, storage } from '../storage';
