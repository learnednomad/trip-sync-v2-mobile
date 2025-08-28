/**
 * Sync Service
 * Coordinates data synchronization between offline storage and remote API
 */

import { type QueryClient } from '@tanstack/react-query';

import { tripKeys } from '@/api/trips';
// TODO: Install @react-native-community/netinfo for network detection
// import NetInfo from '@react-native-community/netinfo';
import * as tripsApi from '@/api/trips/api';

import offlineStorage from './offline-storage';
import type { PendingChange } from './types';

interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  conflictCount: number;
  errors: string[];
}

class SyncService {
  private queryClient: QueryClient | null = null;
  private isOnline = true;
  private syncInProgress = false;
  private autoSyncInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.setupNetworkListener();
  }

  private log(...args: any[]) {
    if (__DEV__) {
      console.log('[SyncService]', ...args);
    }
  }

  setQueryClient(queryClient: QueryClient) {
    this.queryClient = queryClient;
  }

  private setupNetworkListener() {
    // TODO: Implement with @react-native-community/netinfo when available
    // For now, assume online
    this.isOnline = true;

    // Mock network listener - replace with actual implementation
    // NetInfo.addEventListener(state => {
    //   const wasOffline = !this.isOnline;
    //   this.isOnline = state.isConnected ?? false;
    //
    //   this.log('Network status:', this.isOnline ? 'online' : 'offline');
    //
    //   // Auto-sync when coming back online
    //   if (wasOffline && this.isOnline) {
    //     this.log('Network restored, starting sync...');
    //     this.syncPendingChanges().catch(error => {
    //       this.log('Auto-sync failed:', error);
    //     });
    //   }
    // });
  }

  // Start periodic sync
  startAutoSync(intervalMs: number = 30000) {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
    }

    this.autoSyncInterval = setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.syncPendingChanges().catch((error) => {
          this.log('Auto-sync error:', error);
        });
      }
    }, intervalMs) as any;

    this.log('Auto-sync started with interval:', intervalMs);
  }

  stopAutoSync() {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
      this.autoSyncInterval = null;
      this.log('Auto-sync stopped');
    }
  }

  // Main sync method
  async syncPendingChanges(): Promise<SyncResult> {
    if (!this.isOnline) {
      this.log('Cannot sync - offline');
      return {
        success: false,
        syncedCount: 0,
        failedCount: 0,
        conflictCount: 0,
        errors: ['Device is offline'],
      };
    }

    if (this.syncInProgress) {
      this.log('Sync already in progress');
      return {
        success: false,
        syncedCount: 0,
        failedCount: 0,
        conflictCount: 0,
        errors: ['Sync already in progress'],
      };
    }

    this.syncInProgress = true;
    this.log('Starting sync...');

    try {
      const pendingChanges = offlineStorage.getPendingChanges();
      const result: SyncResult = {
        success: true,
        syncedCount: 0,
        failedCount: 0,
        conflictCount: 0,
        errors: [],
      };

      // Process pending changes in batches
      const batchSize = 10;
      for (let i = 0; i < pendingChanges.length; i += batchSize) {
        const batch = pendingChanges.slice(i, i + batchSize);

        for (const change of batch) {
          try {
            const syncResult = await this.syncChange(change);

            if (syncResult.success) {
              result.syncedCount++;
              offlineStorage.removePendingChange(change.id);
            } else if (syncResult.conflict) {
              result.conflictCount++;
              // Conflict handling is done in syncChange
            } else {
              result.failedCount++;
              result.errors.push(
                `Failed to sync ${change.entityType}:${change.entityId} - ${syncResult.error}`
              );
            }
          } catch (error) {
            result.failedCount++;
            result.errors.push(
              `Error syncing ${change.entityType}:${change.entityId} - ${error}`
            );
            this.log('Sync error:', error);
          }
        }
      }

      this.log('Sync completed:', result);
      return result;
    } finally {
      this.syncInProgress = false;
    }
  }

  // Sync individual change
  private async syncChange(change: PendingChange): Promise<{
    success: boolean;
    conflict?: boolean;
    error?: string;
  }> {
    try {
      switch (change.entityType) {
        case 'trip':
          return await this.syncTripChange(change);
        case 'participant':
          return await this.syncParticipantChange(change);
        case 'user':
          return await this.syncUserChange(change);
        default:
          return {
            success: false,
            error: `Unknown entity type: ${change.entityType}`,
          };
      }
    } catch (error) {
      this.log('Sync change error:', error);
      return { success: false, error: String(error) };
    }
  }

  private async syncTripChange(change: PendingChange): Promise<{
    success: boolean;
    conflict?: boolean;
    error?: string;
  }> {
    const { entityId, operation, data } = change;

    try {
      switch (operation) {
        case 'create':
          const createResponse = await tripsApi.createTrip(data);
          if (createResponse.success) {
            // Update local storage with server response
            offlineStorage.storeTrip(
              createResponse.data!.trip.id,
              createResponse.data!.trip,
              {
                syncStatus: 'synced',
                lastSynced: new Date().toISOString(),
              }
            );

            // Update query cache
            this.invalidateTripQueries(createResponse.data!.trip.id);
            return { success: true };
          }
          return { success: false, error: createResponse.error?.message };

        case 'update':
          const updateResponse = await tripsApi.updateTrip(entityId, data);
          if (updateResponse.success) {
            offlineStorage.storeTrip(entityId, updateResponse.data!.trip, {
              syncStatus: 'synced',
              lastSynced: new Date().toISOString(),
            });

            this.invalidateTripQueries(entityId);
            return { success: true };
          } else if (updateResponse.error?.code === 'VERSION_CONFLICT') {
            // Handle version conflict
            await this.handleTripVersionConflict(
              entityId,
              data,
              updateResponse.error.details
            );
            return { success: false, conflict: true };
          }
          return { success: false, error: updateResponse.error?.message };

        case 'delete':
          const deleteResponse = await tripsApi.deleteTrip(entityId);
          if (deleteResponse.success) {
            offlineStorage.delete(`trip:${entityId}`);
            this.invalidateTripQueries(entityId);
            return { success: true };
          }
          return { success: false, error: deleteResponse.error?.message };

        default:
          return { success: false, error: `Unknown operation: ${operation}` };
      }
    } catch (error) {
      this.log('Trip sync error:', error);
      return { success: false, error: String(error) };
    }
  }

  private async syncParticipantChange(change: PendingChange): Promise<{
    success: boolean;
    conflict?: boolean;
    error?: string;
  }> {
    const { entityId, operation, data, metadata } = change;
    const tripId = metadata.tripId;

    if (!tripId) {
      return {
        success: false,
        error: 'Trip ID required for participant operations',
      };
    }

    try {
      switch (operation) {
        case 'create':
          const inviteResponse = await tripsApi.inviteParticipants(tripId, {
            emails: [data.email],
            role: data.role,
          });
          if (inviteResponse.success) {
            // Refresh trip data to get updated participants
            await this.refreshTripFromServer(tripId);
            return { success: true };
          }
          return { success: false, error: inviteResponse.error?.message };

        case 'update':
          const updateResponse = await tripsApi.updateParticipant(
            tripId,
            entityId,
            {
              role: data.role,
            }
          );
          if (updateResponse.success) {
            await this.refreshTripFromServer(tripId);
            return { success: true };
          }
          return { success: false, error: updateResponse.error?.message };

        case 'delete':
          const removeResponse = await tripsApi.removeParticipant(
            tripId,
            entityId
          );
          if (removeResponse.success) {
            await this.refreshTripFromServer(tripId);
            return { success: true };
          }
          return { success: false, error: removeResponse.error?.message };

        default:
          return { success: false, error: `Unknown operation: ${operation}` };
      }
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  private async syncUserChange(change: PendingChange): Promise<{
    success: boolean;
    conflict?: boolean;
    error?: string;
  }> {
    // User profile updates would go here
    // For now, just mark as synced since user profile is read-only from mobile
    return { success: true };
  }

  // Handle version conflicts
  private async handleTripVersionConflict(
    tripId: string,
    localData: any,
    remoteData: any
  ): Promise<void> {
    const localTrip = offlineStorage.getTrip(tripId);
    const localVersion = localTrip?.metadata.version || 0;
    const remoteVersion = remoteData.version || 0;

    offlineStorage.addConflict(
      'trip',
      tripId,
      localData,
      remoteData,
      localVersion,
      remoteVersion
    );

    this.log('Version conflict detected for trip:', tripId);
  }

  // Helper methods
  private invalidateTripQueries(tripId: string) {
    if (!this.queryClient) return;

    this.queryClient.invalidateQueries({ queryKey: tripKeys.detail(tripId) });
    this.queryClient.invalidateQueries({ queryKey: tripKeys.lists() });
  }

  private async refreshTripFromServer(tripId: string): Promise<void> {
    try {
      const response = await tripsApi.getTripById(tripId);
      if (response.success && response.data) {
        offlineStorage.storeTrip(tripId, response.data.trip, {
          syncStatus: 'synced',
          lastSynced: new Date().toISOString(),
        });

        this.invalidateTripQueries(tripId);
      }
    } catch (error) {
      this.log('Failed to refresh trip from server:', error);
    }
  }

  // Utility methods for external use
  async forceSyncTrip(tripId: string): Promise<boolean> {
    if (!this.isOnline) return false;

    try {
      await this.refreshTripFromServer(tripId);
      return true;
    } catch (error) {
      this.log('Force sync failed:', error);
      return false;
    }
  }

  async forceSyncTripsList(): Promise<boolean> {
    if (!this.isOnline) return false;

    try {
      const response = await tripsApi.getTripList();
      if (response.success && response.data) {
        offlineStorage.storeTripsList(
          response.data.trips,
          {},
          {
            page: 1,
            limit: response.data.trips.length,
            total: response.data.total || response.data.trips.length,
            hasMore: response.data.hasMore || false,
          }
        );

        if (this.queryClient) {
          this.queryClient.invalidateQueries({ queryKey: tripKeys.lists() });
        }

        return true;
      }
      return false;
    } catch (error) {
      this.log('Force sync trips list failed:', error);
      return false;
    }
  }

  getStatus() {
    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
      pendingChangesCount: offlineStorage.getPendingChanges().length,
      conflictsCount: offlineStorage.getConflicts().length,
    };
  }
}

// Export singleton instance
export const syncService = new SyncService();
export default syncService;
