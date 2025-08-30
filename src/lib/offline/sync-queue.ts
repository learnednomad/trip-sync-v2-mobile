/**
 * Sync Queue Management
 * Handles offline operation queuing and sync coordination
 */

import React from 'react';
import { AppState, AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

import { offlineStorage, type SyncOperation } from './offline-storage';
import { apiClient } from '@/api/common/client';
import { useAuth } from '@/lib/auth';

interface SyncResult {
  success: boolean;
  operation: SyncOperation;
  error?: string;
  data?: any;
}

interface SyncStats {
  totalOperations: number;
  successCount: number;
  failureCount: number;
  retryCount: number;
  lastSyncTime: string;
  estimatedTimeRemaining: number;
}

/**
 * Background sync service
 */
export class SyncQueueManager {
  private static instance: SyncQueueManager;
  private isRunning = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private appStateSubscription: any = null;
  private netInfoSubscription: any = null;
  
  static getInstance(): SyncQueueManager {
    if (!SyncQueueManager.instance) {
      SyncQueueManager.instance = new SyncQueueManager();
    }
    return SyncQueueManager.instance;
  }

  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.setupEventListeners();
    this.schedulePeriodicSync();
    
    console.log('🔄 Sync queue manager started');
  }

  stop(): void {
    this.isRunning = false;
    
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    
    this.appStateSubscription?.();
    this.netInfoSubscription?.();
    
    console.log('⏹️ Sync queue manager stopped');
  }

  private setupEventListeners(): void {
    // Listen for network state changes
    this.netInfoSubscription = NetInfo.addEventListener(state => {
      if (state.isConnected && state.isInternetReachable) {
        console.log('🌐 Network restored, triggering sync');
        this.triggerSync();
      }
    });

    // Listen for app state changes
    this.appStateSubscription = AppState.addEventListener(
      'change',
      (nextAppState: AppStateStatus) => {
        if (nextAppState === 'active') {
          // App became active, check for pending sync
          this.triggerSync();
        }
      }
    );
  }

  private schedulePeriodicSync(): void {
    this.syncInterval = setInterval(() => {
      this.triggerSync();
    }, 30000); // Every 30 seconds when app is active
  }

  async triggerSync(): Promise<SyncStats> {
    if (!this.isRunning) {
      return this.getEmptySyncStats();
    }

    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected || !networkState.isInternetReachable) {
      console.log('📵 No network connection, skipping sync');
      return this.getEmptySyncStats();
    }

    const settings = offlineStorage.getSettings();
    
    // Check if sync is allowed on current network
    if (networkState.type === 'cellular' && !settings.syncOnCellular) {
      console.log('📱 Cellular sync disabled, skipping');
      return this.getEmptySyncStats();
    }

    return this.processSyncQueue();
  }

  private async processSyncQueue(): Promise<SyncStats> {
    const queue = offlineStorage.getSyncQueue();
    const startTime = Date.now();
    
    if (queue.length === 0) {
      return {
        totalOperations: 0,
        successCount: 0,
        failureCount: 0,
        retryCount: 0,
        lastSyncTime: new Date().toISOString(),
        estimatedTimeRemaining: 0,
      };
    }

    console.log(`🔄 Processing ${queue.length} sync operations`);
    
    let successCount = 0;
    let failureCount = 0;
    let retryCount = 0;

    // Process operations in batches of 5
    const batchSize = 5;
    for (let i = 0; i < queue.length; i += batchSize) {
      const batch = queue.slice(i, i + batchSize);
      
      const results = await Promise.allSettled(
        batch.map(operation => this.processOperation(operation))
      );
      
      for (let j = 0; j < results.length; j++) {
        const result = results[j];
        const operation = batch[j];
        
        if (result.status === 'fulfilled' && result.value.success) {
          successCount++;
          offlineStorage.removeSyncOperation(operation.id);
        } else {
          failureCount++;
          
          if (operation.retryCount < operation.maxRetries) {
            // Update retry count
            const updatedOp = { ...operation, retryCount: operation.retryCount + 1 };
            offlineStorage.removeSyncOperation(operation.id);
            offlineStorage.addSyncOperation(updatedOp);
            retryCount++;
          } else {
            // Max retries exceeded, remove from queue
            console.error('❌ Max retries exceeded for operation:', operation.id);
            offlineStorage.removeSyncOperation(operation.id);
          }
        }
      }
    }

    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ Sync complete: ${successCount} success, ${failureCount} failures in ${duration}ms`);
    
    return {
      totalOperations: queue.length,
      successCount,
      failureCount,
      retryCount,
      lastSyncTime: new Date().toISOString(),
      estimatedTimeRemaining: 0,
    };
  }

  private async processOperation(operation: SyncOperation): Promise<SyncResult> {
    try {
      console.log(`🔄 Processing ${operation.type} ${operation.resourceType}:${operation.resourceId}`);
      
      let result: any;
      
      switch (operation.type) {
        case 'CREATE':
          result = await this.handleCreate(operation);
          break;
        case 'UPDATE':
          result = await this.handleUpdate(operation);
          break;
        case 'DELETE':
          result = await this.handleDelete(operation);
          break;
        default:
          throw new Error(`Unknown operation type: ${operation.type}`);
      }
      
      return {
        success: true,
        operation,
        data: result,
      };
    } catch (error: any) {
      console.error(`❌ Sync operation failed:`, operation.id, error.message);
      
      return {
        success: false,
        operation,
        error: error.message,
      };
    }
  }

  private async handleCreate(operation: SyncOperation): Promise<any> {
    const { resourceType, data } = operation;
    
    switch (resourceType) {
      case 'trip':
        const response = await apiClient.post('/api/v2/trips', data);
        return response.data;
      default:
        throw new Error(`Unsupported create operation for ${resourceType}`);
    }
  }

  private async handleUpdate(operation: SyncOperation): Promise<any> {
    const { resourceType, resourceId, data } = operation;
    
    switch (resourceType) {
      case 'trip':
        const response = await apiClient.put(`/api/v2/trips/${resourceId}`, data);
        
        // Update local cache with server response
        if (response.data?.success && response.data?.data) {
          await offlineStorage.storeTrip(response.data.data, {
            syncStatus: 'synced',
            localModified: false,
            lastSyncTime: new Date().toISOString(),
          });
        }
        
        return response.data;
      default:
        throw new Error(`Unsupported update operation for ${resourceType}`);
    }
  }

  private async handleDelete(operation: SyncOperation): Promise<any> {
    const { resourceType, resourceId } = operation;
    
    switch (resourceType) {
      case 'trip':
        const response = await apiClient.delete(`/api/v2/trips/${resourceId}`);
        
        // Remove from local cache
        offlineStorage.removeTrip(resourceId);
        
        return response.data;
      default:
        throw new Error(`Unsupported delete operation for ${resourceType}`);
    }
  }

  private getEmptySyncStats(): SyncStats {
    return {
      totalOperations: 0,
      successCount: 0,
      failureCount: 0,
      retryCount: 0,
      lastSyncTime: new Date().toISOString(),
      estimatedTimeRemaining: 0,
    };
  }

  // Manual sync trigger
  async forcSync(): Promise<SyncStats> {
    return this.processSyncQueue();
  }

  // Get sync status
  getSyncStats(): Promise<SyncStats> {
    const queue = offlineStorage.getSyncQueue();
    return Promise.resolve({
      totalOperations: queue.length,
      successCount: 0,
      failureCount: 0,
      retryCount: queue.filter(op => op.retryCount > 0).length,
      lastSyncTime: new Date().toISOString(),
      estimatedTimeRemaining: queue.length * 1000, // Estimate 1s per operation
    });
  }
}

// Singleton instance
export const syncQueueManager = SyncQueueManager.getInstance();

// React hooks for sync management
export const useSyncQueue = () => {
  const [stats, setStats] = React.useState<SyncStats>({
    totalOperations: 0,
    successCount: 0,
    failureCount: 0,
    retryCount: 0,
    lastSyncTime: new Date().toISOString(),
    estimatedTimeRemaining: 0,
  });
  
  const [isActive, setIsActive] = React.useState(false);

  React.useEffect(() => {
    const updateStats = async () => {
      const currentStats = await syncQueueManager.getSyncStats();
      setStats(currentStats);
    };

    updateStats();
    const interval = setInterval(updateStats, 5000); // Update every 5 seconds
    
    return () => clearInterval(interval);
  }, []);

  const triggerSync = React.useCallback(async () => {
    setIsActive(true);
    try {
      const result = await syncQueueManager.forcSync();
      setStats(result);
    } finally {
      setIsActive(false);
    }
  }, []);

  return {
    stats,
    isActive,
    triggerSync,
    hasPendingOperations: stats.totalOperations > 0,
  };
};

// Auto-start sync manager
React.useEffect(() => {
  syncQueueManager.start();
  
  return () => {
    syncQueueManager.stop();
  };
}, []);