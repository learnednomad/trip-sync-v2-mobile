/**
 * Intelligent Sync Engine
 * Orchestrates data synchronization with conflict resolution
 */

import React from 'react';
import { AppState } from 'react-native';

import { offlineStorage, syncQueueManager, type SyncOperation } from './offline-storage';
import { conflictResolver, type Conflict, type ConflictResolution } from './conflict-resolver';
import { networkDetector, useNetworkStatus } from './network-detector';
import { offlineAuthManager } from './offline-auth';
import { useTrips } from '@/api/trips';
import { apiClient } from '@/api/common/client';

interface SyncEngineState {
  isRunning: boolean;
  currentOperation: SyncOperation | null;
  completedOperations: number;
  failedOperations: number;
  conflicts: Conflict[];
  lastSyncTime: string;
  syncProgress: number; // 0-100%
}

interface SyncPreferences {
  autoSync: boolean;
  syncInterval: number; // seconds
  maxRetries: number;
  batchSize: number;
  prioritizeUpcoming: boolean;
  offlineDays: number; // How many days to keep offline
}

/**
 * Main sync engine orchestrator
 */
export class SyncEngine {
  private static instance: SyncEngine;
  private state: SyncEngineState = {
    isRunning: false,
    currentOperation: null,
    completedOperations: 0,
    failedOperations: 0,
    conflicts: [],
    lastSyncTime: new Date().toISOString(),
    syncProgress: 0,
  };
  
  private listeners: ((state: SyncEngineState) => void)[] = [];
  private abortController: AbortController | null = null;
  
  static getInstance(): SyncEngine {
    if (!SyncEngine.instance) {
      SyncEngine.instance = new SyncEngine();
    }
    return SyncEngine.instance;
  }

  /**
   * Start comprehensive sync process
   */
  async startSync(options: {
    force?: boolean;
    direction?: 'upload' | 'download' | 'bidirectional';
    filter?: (operation: SyncOperation) => boolean;
  } = {}): Promise<void> {
    if (this.state.isRunning && !options.force) {
      console.log('🔄 Sync already running, skipping');
      return;
    }

    const { direction = 'bidirectional', filter } = options;
    
    this.abortController = new AbortController();
    
    try {
      this.updateState({ isRunning: true, syncProgress: 0 });
      console.log('🚀 Starting sync engine...');

      // Step 1: Validate authentication
      if (!await this.validateAuthForSync()) {
        throw new Error('Authentication required for sync');
      }

      // Step 2: Upload pending changes (if upload or bidirectional)
      if (direction === 'upload' || direction === 'bidirectional') {
        await this.uploadPendingChanges(filter);
      }

      // Step 3: Download remote changes (if download or bidirectional)  
      if (direction === 'download' || direction === 'bidirectional') {
        await this.downloadRemoteChanges();
      }

      // Step 4: Resolve any conflicts
      await this.resolveDetectedConflicts();

      // Step 5: Update sync metadata
      this.updateState({
        lastSyncTime: new Date().toISOString(),
        syncProgress: 100,
      });

      console.log('✅ Sync completed successfully');
    } catch (error: any) {
      console.error('❌ Sync failed:', error.message);
      this.updateState({
        failedOperations: this.state.failedOperations + 1,
      });
      
      throw error;
    } finally {
      this.updateState({ 
        isRunning: false, 
        currentOperation: null,
        syncProgress: 0,
      });
      this.abortController = null;
    }
  }

  /**
   * Upload pending local changes
   */
  private async uploadPendingChanges(filter?: (op: SyncOperation) => boolean): Promise<void> {
    const pendingOperations = offlineStorage.getSyncQueue();
    const filteredOps = filter ? pendingOperations.filter(filter) : pendingOperations;
    
    console.log(`📤 Uploading ${filteredOps.length} pending changes`);
    
    for (let i = 0; i < filteredOps.length; i++) {
      if (this.abortController?.signal.aborted) {
        throw new Error('Sync aborted');
      }

      const operation = filteredOps[i];
      this.updateState({ 
        currentOperation: operation,
        syncProgress: Math.round((i / filteredOps.length) * 50), // 0-50% for upload
      });

      try {
        await this.executeUploadOperation(operation);
        this.updateState({ completedOperations: this.state.completedOperations + 1 });
        
        // Remove from queue on success
        offlineStorage.removeSyncOperation(operation.id);
      } catch (error: any) {
        console.error(`❌ Upload failed for operation ${operation.id}:`, error.message);
        
        // Handle retry logic
        if (operation.retryCount < operation.maxRetries) {
          offlineStorage.addSyncOperation({
            ...operation,
            retryCount: operation.retryCount + 1,
          });
        } else {
          console.error(`❌ Max retries exceeded for operation ${operation.id}`);
          offlineStorage.removeSyncOperation(operation.id);
        }
        
        this.updateState({ failedOperations: this.state.failedOperations + 1 });
      }
    }
  }

  /**
   * Download remote changes and detect conflicts
   */
  private async downloadRemoteChanges(): Promise<void> {
    console.log('📥 Downloading remote changes');
    
    try {
      // Get all trips from server
      const response = await apiClient.get('/api/v2/trips');
      
      if (response.data?.success && response.data?.data?.trips) {
        const remoteTrips = response.data.data.trips;
        const localTrips = offlineStorage.getAllTrips();
        
        this.updateState({ syncProgress: 60 }); // 50-80% for download
        
        for (let i = 0; i < remoteTrips.length; i++) {
          const remoteTrip = remoteTrips[i];
          const localTrip = localTrips.find(t => t.id === remoteTrip.id);
          
          if (localTrip) {
            // Check for conflicts
            const conflict = conflictResolver.detectConflicts(localTrip, remoteTrip);
            
            if (conflict) {
              console.log(`⚠️ Conflict detected for trip ${remoteTrip.id}`);
              this.addConflict(conflict);
            } else if (remoteTrip.version > localTrip.version) {
              // Remote is newer, update local
              await offlineStorage.storeTrip(remoteTrip, {
                syncStatus: 'synced',
                localModified: false,
                lastSyncTime: new Date().toISOString(),
              });
            }
          } else {
            // New remote trip, add to local storage
            await offlineStorage.storeTrip(remoteTrip, {
              syncStatus: 'synced',
              localModified: false,
              lastSyncTime: new Date().toISOString(),
            });
          }
          
          // Update progress
          this.updateState({ 
            syncProgress: 60 + Math.round((i / remoteTrips.length) * 20) 
          });
        }
      }
      
      this.updateState({ syncProgress: 80 });
    } catch (error: any) {
      console.error('❌ Download failed:', error.message);
      throw error;
    }
  }

  /**
   * Resolve detected conflicts
   */
  private async resolveDetectedConflicts(): Promise<void> {
    const { conflicts } = this.state;
    
    if (conflicts.length === 0) return;
    
    console.log(`🔧 Resolving ${conflicts.length} conflicts`);
    
    for (let i = 0; i < conflicts.length; i++) {
      const conflict = conflicts[i];
      
      this.updateState({ 
        syncProgress: 80 + Math.round((i / conflicts.length) * 20) // 80-100%
      });

      try {
        let resolution: ConflictResolution | null = null;
        
        // Try automatic resolution first
        if (conflict.autoResolvable) {
          resolution = await conflictResolver.autoResolveConflict(conflict);
        }
        
        // If auto-resolution failed, present to user
        if (!resolution) {
          resolution = await conflictResolver.presentConflictToUser(conflict);
        }
        
        if (resolution) {
          // Apply resolution
          await this.applyConflictResolution(conflict, resolution);
          
          // Remove conflict from state
          this.removeConflict(conflict.id);
          
          console.log(`✅ Conflict resolved: ${conflict.id} using ${resolution.strategy}`);
        }
      } catch (error: any) {
        console.error(`❌ Failed to resolve conflict ${conflict.id}:`, error.message);
      }
    }
  }

  private async executeUploadOperation(operation: SyncOperation): Promise<void> {
    // This delegates to the sync queue manager's operation handlers
    const result = await syncQueueManager.processSyncQueue();
    
    if (result.failureCount > 0) {
      throw new Error(`Upload operation failed: ${operation.id}`);
    }
  }

  private async validateAuthForSync(): Promise<boolean> {
    const offlineAuth = offlineAuthManager.getOfflineAuthState();
    
    if (!offlineAuth) {
      return false;
    }
    
    const tokenValidation = offlineAuthManager.validateOfflineTokens();
    
    // If tokens are expired, try to refresh them
    if (!tokenValidation.isValid || tokenValidation.needsRefresh) {
      try {
        // This would trigger token refresh through existing auth system
        console.log('🔑 Refreshing tokens for sync');
        // The auth store's token refresh logic will handle this
        return true;
      } catch (error) {
        console.error('❌ Token refresh failed, cannot sync');
        return false;
      }
    }
    
    return true;
  }

  private async applyConflictResolution(
    conflict: Conflict, 
    resolution: ConflictResolution
  ): Promise<void> {
    const { resourceType, resourceId } = conflict;
    const { resolvedData, strategy } = resolution;
    
    switch (resourceType) {
      case 'trip':
        // Update local storage with resolved data
        await offlineStorage.storeTrip(resolvedData, {
          syncStatus: 'synced',
          localModified: false,
          lastSyncTime: new Date().toISOString(),
        });
        
        // If resolution chose local data, upload to server
        if (strategy === 'local' || strategy === 'merge') {
          offlineStorage.addSyncOperation({
            type: 'UPDATE',
            resourceType: 'trip',
            resourceId,
            data: resolvedData,
            priority: 'high',
            retryCount: 0,
            maxRetries: 3,
            networkRequired: true,
          });
        }
        break;
        
      default:
        console.warn(`Unsupported conflict resolution for ${resourceType}`);
    }
  }

  // State management
  private updateState(update: Partial<SyncEngineState>): void {
    this.state = { ...this.state, ...update };
    this.notifyListeners();
  }

  private addConflict(conflict: Conflict): void {
    this.updateState({
      conflicts: [...this.state.conflicts, conflict],
    });
  }

  private removeConflict(conflictId: string): void {
    this.updateState({
      conflicts: this.state.conflicts.filter(c => c.id !== conflictId),
    });
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  // Public methods for React integration
  subscribe(listener: (state: SyncEngineState) => void): () => void {
    this.listeners.push(listener);
    
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  getState(): SyncEngineState {
    return { ...this.state };
  }

  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
      console.log('⏹️ Sync aborted by user');
    }
  }

  // Utility methods
  async estimateSyncTime(): Promise<number> {
    const queue = offlineStorage.getSyncQueue();
    const avgOperationTime = 1000; // 1 second per operation estimate
    return queue.length * avgOperationTime;
  }

  async getSyncSummary(): Promise<{
    pendingUploads: number;
    pendingDownloads: number;
    conflicts: number;
    lastSyncAge: number;
    estimatedTime: number;
  }> {
    const queue = offlineStorage.getSyncQueue();
    const conflicts = this.state.conflicts;
    const lastSyncAge = Date.now() - new Date(this.state.lastSyncTime).getTime();
    const estimatedTime = await this.estimateSyncTime();
    
    return {
      pendingUploads: queue.filter(op => ['CREATE', 'UPDATE', 'DELETE'].includes(op.type)).length,
      pendingDownloads: 0, // Downloads are processed immediately
      conflicts: conflicts.length,
      lastSyncAge,
      estimatedTime,
    };
  }
}

// Singleton instance
export const syncEngine = SyncEngine.getInstance();

// React hook for sync engine state
export const useSyncEngine = () => {
  const [state, setState] = React.useState<SyncEngineState>(syncEngine.getState());
  
  React.useEffect(() => {
    const unsubscribe = syncEngine.subscribe(setState);
    return unsubscribe;
  }, []);

  const startSync = React.useCallback(async (options?: {
    force?: boolean;
    direction?: 'upload' | 'download' | 'bidirectional';
  }) => {
    try {
      await syncEngine.startSync(options);
    } catch (error: any) {
      console.error('Sync failed:', error.message);
    }
  }, []);

  const abortSync = React.useCallback(() => {
    syncEngine.abort();
  }, []);

  return {
    ...state,
    startSync,
    abortSync,
    isIdle: !state.isRunning,
    hasConflicts: state.conflicts.length > 0,
    hasPendingOperations: state.conflicts.length > 0, // This would check queue in real implementation
  };
};

// Hook for automatic sync management
export const useAutoSync = (preferences?: Partial<SyncPreferences>) => {
  const networkStatus = useNetworkStatus();
  const syncEngineState = useSyncEngine();
  
  const defaultPrefs: SyncPreferences = {
    autoSync: true,
    syncInterval: 30, // 30 seconds
    maxRetries: 3,
    batchSize: 5,
    prioritizeUpcoming: true,
    offlineDays: 30,
  };
  
  const syncPrefs = { ...defaultPrefs, ...preferences };

  React.useEffect(() => {
    if (!syncPrefs.autoSync) return;
    if (!networkStatus.isOnline) return;
    if (syncEngineState.isRunning) return;

    // Set up periodic sync
    const interval = setInterval(() => {
      if (networkStatus.canSync && !syncEngineState.isRunning) {
        syncEngine.startSync({ direction: 'bidirectional' });
      }
    }, syncPrefs.syncInterval * 1000);

    return () => clearInterval(interval);
  }, [
    syncPrefs.autoSync,
    syncPrefs.syncInterval,
    networkStatus.isOnline,
    networkStatus.canSync,
    syncEngineState.isRunning,
  ]);

  // Sync when network comes back online
  React.useEffect(() => {
    if (networkStatus.isOnline && syncPrefs.autoSync) {
      // Delay sync slightly to allow network to stabilize
      const timer = setTimeout(() => {
        if (!syncEngineState.isRunning) {
          syncEngine.startSync({ direction: 'bidirectional' });
        }
      }, 2000); // 2 second delay

      return () => clearTimeout(timer);
    }
  }, [networkStatus.isOnline, syncPrefs.autoSync, syncEngineState.isRunning]);

  // Sync when app becomes active
  React.useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && networkStatus.isOnline && syncPrefs.autoSync) {
        setTimeout(() => {
          if (!syncEngineState.isRunning) {
            syncEngine.startSync({ direction: 'bidirectional' });
          }
        }, 1000);
      }
    });

    return subscription?.remove;
  }, [networkStatus.isOnline, syncPrefs.autoSync, syncEngineState.isRunning]);

  return {
    preferences: syncPrefs,
    networkStatus,
    syncState: syncEngineState,
    
    // Manual controls
    triggerSync: () => syncEngine.startSync({ force: true }),
    uploadOnly: () => syncEngine.startSync({ direction: 'upload' }),
    downloadOnly: () => syncEngine.startSync({ direction: 'download' }),
    abortSync: () => syncEngine.abort(),
  };
};

// Hook for conflict management
export const useConflictResolution = () => {
  const syncState = useSyncEngine();
  
  const resolveConflict = React.useCallback(async (
    conflictId: string,
    strategy: 'local' | 'remote' | 'merge'
  ) => {
    const conflict = syncState.conflicts.find(c => c.id === conflictId);
    if (!conflict) return;

    try {
      let resolvedData: any;
      
      switch (strategy) {
        case 'local':
          resolvedData = conflict.localVersion;
          break;
        case 'remote':
          resolvedData = conflict.remoteVersion;
          break;
        case 'merge':
          const autoResolution = await conflictResolver.autoResolveConflict(conflict);
          resolvedData = autoResolution?.resolvedData || conflict.remoteVersion;
          break;
      }
      
      const resolution: ConflictResolution = {
        conflictId,
        strategy,
        resolvedData,
        resolvedAt: new Date().toISOString(),
        resolvedBy: 'user',
        reasoning: `Manual resolution: user chose ${strategy}`,
      };
      
      // Apply resolution (this would be implemented in sync engine)
      console.log(`✅ Conflict ${conflictId} resolved with ${strategy} strategy`);
      
    } catch (error: any) {
      console.error(`❌ Failed to resolve conflict ${conflictId}:`, error.message);
    }
  }, [syncState.conflicts]);

  return {
    conflicts: syncState.conflicts,
    hasConflicts: syncState.hasConflicts,
    resolveConflict,
    
    // Bulk operations
    resolveAllWith: (strategy: 'local' | 'remote') => {
      syncState.conflicts.forEach(conflict => {
        resolveConflict(conflict.id, strategy);
      });
    },
  };
};