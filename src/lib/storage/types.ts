/**
 * Storage Types for Offline-First Architecture
 * Data structures and types for local storage operations
 */

// Storage Keys
export enum StorageKeys {
  // Authentication
  AUTH_TOKEN = 'auth_token',
  USER_PROFILE = 'user_profile',
  
  // Trips
  TRIPS_LIST = 'trips_list',
  TRIP_DETAILS = 'trip_details',
  TRIP_PARTICIPANTS = 'trip_participants',
  
  // Sync State
  SYNC_METADATA = 'sync_metadata',
  PENDING_CHANGES = 'pending_changes',
  CONFLICT_QUEUE = 'conflict_queue',
  
  // Cache
  CACHE_METADATA = 'cache_metadata',
  
  // App State
  APP_SETTINGS = 'app_settings',
  THEME_SETTINGS = 'theme_settings',
  ONBOARDING_STATE = 'onboarding_state',
}

// Sync States
export type SyncStatus = 'synced' | 'pending' | 'syncing' | 'conflict' | 'error';

// Change Operations
export type ChangeOperation = 'create' | 'update' | 'delete';

// Storage Metadata
export interface StorageMetadata {
  key: string;
  lastModified: string;
  lastSynced?: string;
  version: number;
  syncStatus: SyncStatus;
  etag?: string;
}

// Pending Change
export interface PendingChange {
  id: string;
  entityType: string;
  entityId: string;
  operation: ChangeOperation;
  data: any;
  timestamp: string;
  retryCount: number;
  lastError?: string;
  metadata: Record<string, any>;
}

// Conflict Resolution
export interface ConflictEntry {
  id: string;
  entityType: string;
  entityId: string;
  localData: any;
  remoteData: any;
  localVersion: number;
  remoteVersion: number;
  timestamp: string;
  resolutionStrategy?: 'local' | 'remote' | 'merge' | 'manual';
}

// Cache Entry
export interface CacheEntry<T = any> {
  key: string;
  data: T;
  timestamp: string;
  expiresAt: string;
  tags: string[];
  version: number;
  etag?: string;
}

// Sync Configuration
export interface SyncConfig {
  maxRetries: number;
  retryDelay: number;
  batchSize: number;
  conflictResolution: 'auto' | 'manual';
  autoSyncInterval: number;
  offlineQueueSize: number;
}

// Storage Statistics
export interface StorageStats {
  totalKeys: number;
  totalSize: number;
  pendingChanges: number;
  conflicts: number;
  cacheHitRate: number;
  lastSyncTime?: string;
}

// Trip-specific storage types
export interface StoredTrip {
  data: any; // Trip data from API
  metadata: StorageMetadata;
  participants?: any[];
  itinerary?: any[];
  expenses?: any[];
  messages?: any[];
  documents?: any[];
}

export interface StoredTripsList {
  trips: any[];
  metadata: StorageMetadata;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  filters: Record<string, any>;
}

// User-specific storage types
export interface StoredUserProfile {
  data: any; // User data from API
  metadata: StorageMetadata;
  preferences: Record<string, any>;
  settings: Record<string, any>;
}