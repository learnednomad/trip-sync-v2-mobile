/**
 * Offline Storage Abstraction Layer
 * Comprehensive offline data management with sync metadata
 */

import { MMKV } from 'react-native-mmkv';

import type { Trip, TripParticipant } from '@/api/trips/types';
import type { User } from '@/api/auth/types';

// Storage instances for different data types
const tripStorage = new MMKV({ id: 'trip-storage', encryptionKey: 'trip-data-key' });
const userStorage = new MMKV({ id: 'user-storage', encryptionKey: 'user-data-key' });
const syncStorage = new MMKV({ id: 'sync-storage', encryptionKey: 'sync-meta-key' });
const authStorage = new MMKV({ id: 'auth-storage', encryptionKey: 'auth-data-key' });

// Type definitions
export interface CachedTrip extends Trip {
  _metadata: {
    lastSyncTime: string;
    localModified: boolean;
    version: number;
    syncStatus: 'synced' | 'pending' | 'conflict' | 'error';
    size: number; // bytes
    priority: 'high' | 'normal' | 'low';
    retryCount: number;
    lastAccessTime: string;
  };
}

export interface CachedUser extends User {
  _metadata: {
    lastSyncTime: string;
    cacheExpiry: string;
    isOfflineProfile: boolean;
  };
}

export interface SyncOperation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  resourceType: 'trip' | 'participant' | 'user';
  resourceId: string;
  data: any;
  timestamp: string;
  priority: 'high' | 'normal' | 'low';
  retryCount: number;
  maxRetries: number;
  networkRequired: boolean;
}

export interface StorageMetadata {
  totalSize: number;
  tripCount: number;
  lastCleanup: string;
  version: string;
  quotaUsed: number;
  quotaLimit: number;
}

export interface OfflineSettings {
  maxStorageMB: number;
  autoSync: boolean;
  syncOnCellular: boolean;
  imageCaching: boolean;
  maxImageCacheMB: number;
  syncRetries: number;
  backgroundSync: boolean;
}

/**
 * Comprehensive offline storage manager
 */
export class OfflineStorageManager {
  private static instance: OfflineStorageManager;
  
  static getInstance(): OfflineStorageManager {
    if (!OfflineStorageManager.instance) {
      OfflineStorageManager.instance = new OfflineStorageManager();
    }
    return OfflineStorageManager.instance;
  }

  // Trip Management
  async storeTrip(trip: Trip, metadata?: Partial<CachedTrip['_metadata']>): Promise<void> {
    const cachedTrip: CachedTrip = {
      ...trip,
      _metadata: {
        lastSyncTime: new Date().toISOString(),
        localModified: false,
        version: trip.version || 1,
        syncStatus: 'synced',
        size: this.calculateObjectSize(trip),
        priority: this.determinePriority(trip),
        retryCount: 0,
        lastAccessTime: new Date().toISOString(),
        ...metadata,
      },
    };

    const key = `trip:${trip.id}`;
    tripStorage.set(key, JSON.stringify(cachedTrip));
    
    // Update metadata
    await this.updateStorageMetadata();
  }

  getTrip(tripId: string): CachedTrip | null {
    const key = `trip:${tripId}`;
    const stored = tripStorage.getString(key);
    
    if (!stored) return null;
    
    try {
      const cachedTrip = JSON.parse(stored) as CachedTrip;
      
      // Update last access time
      cachedTrip._metadata.lastAccessTime = new Date().toISOString();
      tripStorage.set(key, JSON.stringify(cachedTrip));
      
      return cachedTrip;
    } catch (error) {
      console.error('Error parsing cached trip:', error);
      return null;
    }
  }

  getAllTrips(): CachedTrip[] {
    const keys = tripStorage.getAllKeys().filter(key => key.startsWith('trip:'));
    const trips: CachedTrip[] = [];
    
    for (const key of keys) {
      const stored = tripStorage.getString(key);
      if (stored) {
        try {
          trips.push(JSON.parse(stored));
        } catch (error) {
          console.error('Error parsing trip:', key, error);
        }
      }
    }
    
    // Sort by last access time (most recent first)
    return trips.sort((a, b) => 
      new Date(b._metadata.lastAccessTime).getTime() - 
      new Date(a._metadata.lastAccessTime).getTime()
    );
  }

  getModifiedTrips(): CachedTrip[] {
    return this.getAllTrips().filter(trip => trip._metadata.localModified);
  }

  removeTrip(tripId: string): void {
    tripStorage.delete(`trip:${tripId}`);
    this.updateStorageMetadata();
  }

  // User Management
  async storeUser(user: User, isOfflineProfile: boolean = false): Promise<void> {
    const cachedUser: CachedUser = {
      ...user,
      _metadata: {
        lastSyncTime: new Date().toISOString(),
        cacheExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        isOfflineProfile,
      },
    };

    userStorage.set(`user:${user.id}`, JSON.stringify(cachedUser));
  }

  getUser(userId: string): CachedUser | null {
    const stored = userStorage.getString(`user:${userId}`);
    if (!stored) return null;
    
    try {
      const cachedUser = JSON.parse(stored) as CachedUser;
      
      // Check expiry
      if (new Date(cachedUser._metadata.cacheExpiry) < new Date()) {
        userStorage.delete(`user:${userId}`);
        return null;
      }
      
      return cachedUser;
    } catch (error) {
      console.error('Error parsing cached user:', error);
      return null;
    }
  }

  // Sync Queue Management
  addSyncOperation(operation: Omit<SyncOperation, 'id' | 'timestamp'>): void {
    const syncOp: SyncOperation = {
      ...operation,
      id: this.generateId(),
      timestamp: new Date().toISOString(),
    };
    
    const key = `sync:${syncOp.id}`;
    syncStorage.set(key, JSON.stringify(syncOp));
  }

  getSyncQueue(): SyncOperation[] {
    const keys = syncStorage.getAllKeys().filter(key => key.startsWith('sync:'));
    const operations: SyncOperation[] = [];
    
    for (const key of keys) {
      const stored = syncStorage.getString(key);
      if (stored) {
        try {
          operations.push(JSON.parse(stored));
        } catch (error) {
          console.error('Error parsing sync operation:', key, error);
        }
      }
    }
    
    // Sort by priority and timestamp
    return operations.sort((a, b) => {
      const priorityOrder = { high: 3, normal: 2, low: 1 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority; // Higher priority first
      }
      
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });
  }

  removeSyncOperation(operationId: string): void {
    syncStorage.delete(`sync:${operationId}`);
  }

  clearSyncQueue(): void {
    const keys = syncStorage.getAllKeys().filter(key => key.startsWith('sync:'));
    keys.forEach(key => syncStorage.delete(key));
  }

  // Storage Management
  async getStorageMetadata(): Promise<StorageMetadata> {
    const stored = syncStorage.getString('metadata');
    
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error('Error parsing storage metadata:', error);
      }
    }
    
    // Calculate fresh metadata
    return this.calculateStorageMetadata();
  }

  private async updateStorageMetadata(): Promise<void> {
    const metadata = await this.calculateStorageMetadata();
    syncStorage.set('metadata', JSON.stringify(metadata));
  }

  private async calculateStorageMetadata(): Promise<StorageMetadata> {
    const trips = this.getAllTrips();
    const totalSize = trips.reduce((size, trip) => size + trip._metadata.size, 0);
    
    return {
      totalSize,
      tripCount: trips.length,
      lastCleanup: new Date().toISOString(),
      version: '1.0',
      quotaUsed: totalSize,
      quotaLimit: this.getSettings().maxStorageMB * 1024 * 1024, // Convert to bytes
    };
  }

  // Settings Management
  getSettings(): OfflineSettings {
    const stored = syncStorage.getString('settings');
    
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error('Error parsing offline settings:', error);
      }
    }
    
    // Default settings
    return {
      maxStorageMB: 500,
      autoSync: true,
      syncOnCellular: false,
      imageCaching: true,
      maxImageCacheMB: 100,
      syncRetries: 3,
      backgroundSync: true,
    };
  }

  updateSettings(settings: Partial<OfflineSettings>): void {
    const currentSettings = this.getSettings();
    const newSettings = { ...currentSettings, ...settings };
    syncStorage.set('settings', JSON.stringify(newSettings));
  }

  // Storage Cleanup
  async performCleanup(): Promise<{ removedCount: number; freedBytes: number }> {
    const trips = this.getAllTrips();
    const settings = this.getSettings();
    const maxSizeBytes = settings.maxStorageMB * 1024 * 1024;
    
    let currentSize = trips.reduce((size, trip) => size + trip._metadata.size, 0);
    
    if (currentSize <= maxSizeBytes) {
      return { removedCount: 0, freedBytes: 0 };
    }
    
    // Sort trips by priority and last access (remove least important first)
    const tripsToRemove = trips
      .sort((a, b) => {
        // Lower priority first
        const priorityOrder = { low: 1, normal: 2, high: 3 };
        const aPriority = priorityOrder[a._metadata.priority];
        const bPriority = priorityOrder[b._metadata.priority];
        
        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }
        
        // Older access first
        return new Date(a._metadata.lastAccessTime).getTime() - 
               new Date(b._metadata.lastAccessTime).getTime();
      });
    
    let removedCount = 0;
    let freedBytes = 0;
    
    for (const trip of tripsToRemove) {
      if (currentSize <= maxSizeBytes * 0.8) break; // Target 80% usage
      
      freedBytes += trip._metadata.size;
      currentSize -= trip._metadata.size;
      removedCount++;
      
      this.removeTrip(trip.id);
    }
    
    await this.updateStorageMetadata();
    
    return { removedCount, freedBytes };
  }

  // Utility Methods
  private calculateObjectSize(obj: any): number {
    return new Blob([JSON.stringify(obj)]).size;
  }

  private determinePriority(trip: Trip): 'high' | 'normal' | 'low' {
    const now = new Date();
    const startDate = new Date(trip.startDate);
    const daysDiff = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    
    // Upcoming trips (within 30 days) are high priority
    if (daysDiff > 0 && daysDiff <= 30) return 'high';
    
    // Current trips are high priority
    if (trip.status === 'IN_PROGRESS') return 'high';
    
    // Recent trips (within 7 days) are normal priority
    if (daysDiff > -7 && daysDiff <= 0) return 'normal';
    
    // Everything else is low priority
    return 'low';
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Data Export/Import (for debugging and migration)
  async exportAllData(): Promise<{
    trips: CachedTrip[];
    syncQueue: SyncOperation[];
    metadata: StorageMetadata;
    settings: OfflineSettings;
  }> {
    return {
      trips: this.getAllTrips(),
      syncQueue: this.getSyncQueue(),
      metadata: await this.getStorageMetadata(),
      settings: this.getSettings(),
    };
  }

  async importData(data: {
    trips?: CachedTrip[];
    settings?: OfflineSettings;
  }): Promise<void> {
    if (data.trips) {
      for (const trip of data.trips) {
        await this.storeTrip(trip, trip._metadata);
      }
    }
    
    if (data.settings) {
      this.updateSettings(data.settings);
    }
    
    await this.updateStorageMetadata();
  }

  // Storage Statistics
  async getStorageStats(): Promise<{
    totalTrips: number;
    totalSize: number;
    pendingSync: number;
    conflicts: number;
    quotaUsage: number;
    oldestTrip: string;
    newestTrip: string;
  }> {
    const trips = this.getAllTrips();
    const syncQueue = this.getSyncQueue();
    const metadata = await this.getStorageMetadata();
    
    const conflictTrips = trips.filter(t => t._metadata.syncStatus === 'conflict');
    
    return {
      totalTrips: trips.length,
      totalSize: metadata.totalSize,
      pendingSync: syncQueue.length,
      conflicts: conflictTrips.length,
      quotaUsage: (metadata.quotaUsed / metadata.quotaLimit) * 100,
      oldestTrip: trips.length > 0 
        ? trips.sort((a, b) => 
            new Date(a._metadata.lastAccessTime).getTime() - 
            new Date(b._metadata.lastAccessTime).getTime()
          )[0].name
        : 'None',
      newestTrip: trips.length > 0
        ? trips.sort((a, b) => 
            new Date(b._metadata.lastAccessTime).getTime() - 
            new Date(a._metadata.lastAccessTime).getTime()
          )[0].name
        : 'None',
    };
  }

  // Clear all data (for logout or reset)
  async clearAllData(): Promise<void> {
    tripStorage.clearAll();
    userStorage.clearAll();
    syncStorage.clearAll();
    // Keep authStorage for token management
  }

  // Health check
  async healthCheck(): Promise<{
    isHealthy: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    try {
      const metadata = await this.getStorageMetadata();
      const settings = this.getSettings();
      
      // Check quota usage
      if (metadata.quotaUsed / metadata.quotaLimit > 0.9) {
        issues.push('Storage quota >90% full');
        recommendations.push('Run storage cleanup or increase quota');
      }
      
      // Check for old unsynced data
      const modifiedTrips = this.getModifiedTrips();
      const oldModified = modifiedTrips.filter(trip => {
        const age = Date.now() - new Date(trip._metadata.lastSyncTime).getTime();
        return age > 7 * 24 * 60 * 60 * 1000; // 7 days
      });
      
      if (oldModified.length > 0) {
        issues.push(`${oldModified.length} trips with old unsynced changes`);
        recommendations.push('Check network connection and trigger manual sync');
      }
      
      // Check sync queue size
      const syncQueue = this.getSyncQueue();
      if (syncQueue.length > 50) {
        issues.push('Large sync queue may indicate sync issues');
        recommendations.push('Review failed sync operations and network connectivity');
      }
      
      return {
        isHealthy: issues.length === 0,
        issues,
        recommendations,
      };
    } catch (error) {
      return {
        isHealthy: false,
        issues: ['Storage health check failed'],
        recommendations: ['Check storage permissions and available space'],
      };
    }
  }
}

// Singleton instance
export const offlineStorage = OfflineStorageManager.getInstance();

// Convenience hooks for React components
export const useOfflineTrip = (tripId: string) => {
  const [trip, setTrip] = React.useState<CachedTrip | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  
  React.useEffect(() => {
    const loadTrip = async () => {
      setIsLoading(true);
      const cachedTrip = offlineStorage.getTrip(tripId);
      setTrip(cachedTrip);
      setIsLoading(false);
    };
    
    if (tripId) {
      loadTrip();
    }
  }, [tripId]);
  
  return { trip, isLoading };
};

export const useOfflineTrips = () => {
  const [trips, setTrips] = React.useState<CachedTrip[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  
  React.useEffect(() => {
    const loadTrips = async () => {
      setIsLoading(true);
      const allTrips = offlineStorage.getAllTrips();
      setTrips(allTrips);
      setIsLoading(false);
    };
    
    loadTrips();
  }, []);
  
  const refresh = React.useCallback(async () => {
    const allTrips = offlineStorage.getAllTrips();
    setTrips(allTrips);
  }, []);
  
  return { trips, isLoading, refresh };
};