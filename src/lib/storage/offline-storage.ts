/**
 * Offline-First Storage Service
 * Enhanced MMKV storage with sync capabilities and conflict resolution
 */

import { MMKV } from 'react-native-mmkv';

import type {
  CacheEntry,
  ChangeOperation,
  ConflictEntry,
  PendingChange,
  StorageMetadata,
  StorageStats,
  StoredTrip,
  StoredTripsList,
  StoredUserProfile,
  SyncConfig,
  SyncStatus,
} from './types';

class OfflineStorageService {
  private storage: MMKV;
  private syncConfig: SyncConfig;

  constructor(config?: Partial<SyncConfig>) {
    this.storage = new MMKV({ id: 'trip-sync-offline' });
    this.syncConfig = {
      maxRetries: 3,
      retryDelay: 1000,
      batchSize: 50,
      conflictResolution: 'auto',
      autoSyncInterval: 30000, // 30 seconds
      offlineQueueSize: 1000,
      ...config,
    };
  }

  private log(...args: any[]) {
    if (__DEV__) {
      console.log('[OfflineStorage]', ...args);
    }
  }

  // Core Storage Operations
  private setRaw(key: string, value: string): void {
    this.storage.set(key, value);
  }

  private getRaw(key: string): string | undefined {
    return this.storage.getString(key);
  }

  private deleteRaw(key: string): void {
    this.storage.delete(key);
  }

  private getAllKeys(): string[] {
    return this.storage.getAllKeys();
  }

  // JSON Storage Operations
  set<T>(key: string, data: T, metadata?: Partial<StorageMetadata>): void {
    const now = new Date().toISOString();
    const storageMetadata: StorageMetadata = {
      key,
      lastModified: now,
      version: (metadata?.version ?? 0) + 1,
      syncStatus: 'pending',
      ...metadata,
    };

    const entry = {
      data,
      metadata: storageMetadata,
    };

    this.setRaw(key, JSON.stringify(entry));
    this.setRaw(`${key}:metadata`, JSON.stringify(storageMetadata));

    this.log('Stored data:', key, 'version:', storageMetadata.version);
  }

  get<T>(key: string): { data: T; metadata: StorageMetadata } | null {
    const raw = this.getRaw(key);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw);
      return parsed;
    } catch (error) {
      this.log('Failed to parse stored data:', key, error);
      return null;
    }
  }

  getData<T>(key: string): T | null {
    const entry = this.get<T>(key);
    return entry?.data ?? null;
  }

  getMetadata(key: string): StorageMetadata | null {
    const entry = this.get(key);
    return entry?.metadata ?? null;
  }

  delete(key: string): void {
    this.deleteRaw(key);
    this.deleteRaw(`${key}:metadata`);
    this.log('Deleted:', key);
  }

  exists(key: string): boolean {
    return this.getRaw(key) !== undefined;
  }

  // Trip-specific storage
  storeTrip(tripId: string, trip: any, metadata?: Partial<StorageMetadata>): void {
    const key = `trip:${tripId}`;
    const storedTrip: StoredTrip = {
      data: trip,
      metadata: this.createMetadata(key, metadata),
      participants: trip.participants,
      itinerary: trip.itineraryItems,
      expenses: trip.expenses,
      messages: trip.messages,
      documents: trip.documents,
    };

    this.set(key, storedTrip, metadata);
  }

  getTrip(tripId: string): StoredTrip | null {
    return this.getData<StoredTrip>(`trip:${tripId}`);
  }

  storeTripsList(trips: any[], filters?: Record<string, any>, pagination?: any): void {
    const now = new Date().toISOString();
    const key = 'trips:list';
    
    const storedList: StoredTripsList = {
      trips,
      metadata: this.createMetadata(key),
      pagination: pagination || {
        page: 1,
        limit: trips.length,
        total: trips.length,
        hasMore: false,
      },
      filters: filters || {},
    };

    this.set(key, storedList);
  }

  getTripsList(): StoredTripsList | null {
    return this.getData<StoredTripsList>('trips:list');
  }

  // User storage
  storeUserProfile(user: any, metadata?: Partial<StorageMetadata>): void {
    const key = 'user:profile';
    const storedUser: StoredUserProfile = {
      data: user,
      metadata: this.createMetadata(key, metadata),
      preferences: {},
      settings: {},
    };

    this.set(key, storedUser, metadata);
  }

  getUserProfile(): StoredUserProfile | null {
    return this.getData<StoredUserProfile>('user:profile');
  }

  // Cache Management
  setCache<T>(key: string, data: T, ttl: number = 300000, tags: string[] = []): void {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttl);
    
    const cacheEntry: CacheEntry<T> = {
      key,
      data,
      timestamp: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      tags,
      version: 1,
    };

    this.setRaw(`cache:${key}`, JSON.stringify(cacheEntry));
    this.log('Cached data:', key, 'expires:', expiresAt.toISOString());
  }

  getCache<T>(key: string): T | null {
    const raw = this.getRaw(`cache:${key}`);
    if (!raw) return null;

    try {
      const entry: CacheEntry<T> = JSON.parse(raw);
      
      // Check expiration
      if (new Date() > new Date(entry.expiresAt)) {
        this.deleteRaw(`cache:${key}`);
        this.log('Cache expired:', key);
        return null;
      }

      this.log('Cache hit:', key);
      return entry.data;
    } catch (error) {
      this.log('Cache parse error:', key, error);
      return null;
    }
  }

  invalidateCache(pattern?: string | RegExp): void {
    const keys = this.getAllKeys().filter(key => key.startsWith('cache:'));
    
    if (!pattern) {
      // Clear all cache
      keys.forEach(key => this.deleteRaw(key));
      this.log('Cleared all cache');
      return;
    }

    // Pattern matching
    const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
    keys.filter(key => regex.test(key)).forEach(key => {
      this.deleteRaw(key);
      this.log('Invalidated cache:', key);
    });
  }

  // Sync Operations
  addPendingChange(
    entityType: string,
    entityId: string,
    operation: ChangeOperation,
    data: any,
    metadata: Record<string, any> = {}
  ): void {
    const changeId = `${entityType}:${entityId}:${operation}:${Date.now()}`;
    const change: PendingChange = {
      id: changeId,
      entityType,
      entityId,
      operation,
      data,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      metadata,
    };

    const key = `pending:${changeId}`;
    this.set(key, change);
    this.log('Added pending change:', changeId);
  }

  getPendingChanges(): PendingChange[] {
    const keys = this.getAllKeys().filter(key => key.startsWith('pending:'));
    return keys
      .map(key => this.getData<PendingChange>(key))
      .filter(Boolean) as PendingChange[];
  }

  removePendingChange(changeId: string): void {
    this.delete(`pending:${changeId}`);
    this.log('Removed pending change:', changeId);
  }

  updateSyncStatus(key: string, status: SyncStatus, lastSynced?: string): void {
    const metadata = this.getMetadata(key);
    if (!metadata) return;

    metadata.syncStatus = status;
    if (lastSynced) {
      metadata.lastSynced = lastSynced;
    }

    this.setRaw(`${key}:metadata`, JSON.stringify(metadata));
  }

  // Conflict Resolution
  addConflict(
    entityType: string,
    entityId: string,
    localData: any,
    remoteData: any,
    localVersion: number,
    remoteVersion: number
  ): void {
    const conflictId = `${entityType}:${entityId}:${Date.now()}`;
    const conflict: ConflictEntry = {
      id: conflictId,
      entityType,
      entityId,
      localData,
      remoteData,
      localVersion,
      remoteVersion,
      timestamp: new Date().toISOString(),
    };

    const key = `conflict:${conflictId}`;
    this.set(key, conflict);
    this.log('Added conflict:', conflictId);
  }

  getConflicts(): ConflictEntry[] {
    const keys = this.getAllKeys().filter(key => key.startsWith('conflict:'));
    return keys
      .map(key => this.getData<ConflictEntry>(key))
      .filter(Boolean) as ConflictEntry[];
  }

  resolveConflict(conflictId: string, resolution: 'local' | 'remote' | 'merge', mergedData?: any): void {
    const key = `conflict:${conflictId}`;
    const conflict = this.getData<ConflictEntry>(key);
    
    if (!conflict) return;

    let resolvedData: any;
    switch (resolution) {
      case 'local':
        resolvedData = conflict.localData;
        break;
      case 'remote':
        resolvedData = conflict.remoteData;
        break;
      case 'merge':
        resolvedData = mergedData || { ...conflict.localData, ...conflict.remoteData };
        break;
    }

    // Update the entity with resolved data
    const entityKey = `${conflict.entityType}:${conflict.entityId}`;
    this.set(entityKey, resolvedData, {
      syncStatus: 'synced',
      version: Math.max(conflict.localVersion, conflict.remoteVersion) + 1,
    });

    // Remove the conflict
    this.delete(key);
    this.log('Resolved conflict:', conflictId, 'using:', resolution);
  }

  // Storage Statistics
  getStats(): StorageStats {
    const allKeys = this.getAllKeys();
    const pendingChanges = this.getPendingChanges().length;
    const conflicts = this.getConflicts().length;
    
    // Calculate total size (approximate)
    let totalSize = 0;
    allKeys.forEach(key => {
      const value = this.getRaw(key);
      if (value) {
        totalSize += value.length;
      }
    });

    return {
      totalKeys: allKeys.length,
      totalSize,
      pendingChanges,
      conflicts,
      cacheHitRate: 0, // Would need to track cache hits/misses
    };
  }

  // Maintenance Operations
  cleanup(): void {
    // Remove expired cache entries
    this.invalidateCache();
    
    // Clean up old pending changes (older than 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const pendingChanges = this.getPendingChanges();
    
    pendingChanges.forEach(change => {
      if (new Date(change.timestamp) < sevenDaysAgo) {
        this.removePendingChange(change.id);
      }
    });

    this.log('Cleanup completed');
  }

  // Clear all data (use with caution)
  clear(): void {
    this.storage.clearAll();
    this.log('Cleared all storage');
  }

  // Helper Methods
  private createMetadata(key: string, partial?: Partial<StorageMetadata>): StorageMetadata {
    const now = new Date().toISOString();
    return {
      key,
      lastModified: now,
      version: 1,
      syncStatus: 'pending',
      ...partial,
    };
  }

  // Legacy compatibility with existing storage interface
  getItem<T>(key: string): T | null {
    return this.getData<T>(key);
  }

  setItem<T>(key: string, value: T): void {
    this.set(key, value);
  }

  removeItem(key: string): void {
    this.delete(key);
  }
}

// Export singleton instance
export const offlineStorage = new OfflineStorageService();
export default offlineStorage;