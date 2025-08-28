/**
 * Offline Storage React Hooks
 * React integration for offline-first storage with automatic sync
 */

import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';

import { tripKeys } from '@/api/trips';
import { useAuth } from '@/lib/auth';

import offlineStorage from './offline-storage';
import type {
  ConflictEntry,
  PendingChange,
  StorageStats,
  StoredTrip,
  StoredTripsList,
  StoredUserProfile,
  SyncStatus,
} from './types';

/**
 * Hook to manage offline storage for a specific entity
 */
export const useOfflineEntity = <T>(key: string, initialData?: T) => {
  const [data, setData] = useState<T | null>(
    () => offlineStorage.getData<T>(key) ?? initialData ?? null
  );
  const [metadata, setMetadata] = useState(() =>
    offlineStorage.getMetadata(key)
  );

  const store = useCallback(
    (newData: T, syncStatus: SyncStatus = 'pending') => {
      offlineStorage.set(key, newData, { syncStatus });
      setData(newData);
      setMetadata(offlineStorage.getMetadata(key));
    },
    [key]
  );

  const remove = useCallback(() => {
    offlineStorage.delete(key);
    setData(null);
    setMetadata(null);
  }, [key]);

  const refresh = useCallback(() => {
    const storedData = offlineStorage.getData<T>(key);
    const storedMetadata = offlineStorage.getMetadata(key);
    setData(storedData);
    setMetadata(storedMetadata);
  }, [key]);

  const updateSyncStatus = useCallback(
    (status: SyncStatus, lastSynced?: string) => {
      offlineStorage.updateSyncStatus(key, status, lastSynced);
      setMetadata(offlineStorage.getMetadata(key));
    },
    [key]
  );

  return {
    data,
    metadata,
    exists: !!data,
    isStale: metadata?.syncStatus === 'pending',
    isSynced: metadata?.syncStatus === 'synced',
    hasConflict: metadata?.syncStatus === 'conflict',
    store,
    remove,
    refresh,
    updateSyncStatus,
  };
};

/**
 * Hook to manage offline trip data
 */
export const useOfflineTrip = (tripId: string) => {
  const key = `trip:${tripId}`;
  const {
    data: trip,
    metadata,
    store,
    remove,
    updateSyncStatus,
  } = useOfflineEntity<StoredTrip>(key);

  const storeTrip = useCallback(
    (tripData: any, syncStatus: SyncStatus = 'pending') => {
      offlineStorage.storeTrip(tripId, tripData, { syncStatus });
      // Refresh local state
      const refreshedData = offlineStorage.getData<StoredTrip>(key);
      store(refreshedData as StoredTrip, syncStatus);
    },
    [tripId, key, store]
  );

  return {
    trip: trip?.data,
    participants: trip?.participants,
    itinerary: trip?.itinerary,
    expenses: trip?.expenses,
    messages: trip?.messages,
    documents: trip?.documents,
    metadata,
    exists: !!trip,
    isStale: metadata?.syncStatus === 'pending',
    isSynced: metadata?.syncStatus === 'synced',
    hasConflict: metadata?.syncStatus === 'conflict',
    storeTrip,
    remove,
    updateSyncStatus,
  };
};

/**
 * Hook to manage offline trips list
 */
export const useOfflineTripsList = () => {
  const {
    data: tripsList,
    metadata,
    store,
    remove,
    updateSyncStatus,
  } = useOfflineEntity<StoredTripsList>('trips:list');

  const storeTripsList = useCallback(
    (
      trips: any[],
      filters?: Record<string, any>,
      pagination?: any,
      syncStatus: SyncStatus = 'pending'
    ) => {
      offlineStorage.storeTripsList(trips, filters, pagination);
      // Update local state
      const refreshedData =
        offlineStorage.getData<StoredTripsList>('trips:list');
      store(refreshedData as StoredTripsList, syncStatus);
    },
    [store]
  );

  return {
    trips: tripsList?.trips || [],
    pagination: tripsList?.pagination,
    filters: tripsList?.filters,
    metadata,
    exists: !!tripsList,
    isStale: metadata?.syncStatus === 'pending',
    isSynced: metadata?.syncStatus === 'synced',
    hasConflict: metadata?.syncStatus === 'conflict',
    storeTripsList,
    remove,
    updateSyncStatus,
  };
};

/**
 * Hook to manage offline user profile
 */
export const useOfflineUserProfile = () => {
  const {
    data: userProfile,
    metadata,
    store,
    remove,
    updateSyncStatus,
  } = useOfflineEntity<StoredUserProfile>('user:profile');

  const storeUserProfile = useCallback(
    (userData: any, syncStatus: SyncStatus = 'pending') => {
      offlineStorage.storeUserProfile(userData, { syncStatus });
      // Update local state
      const refreshedData =
        offlineStorage.getData<StoredUserProfile>('user:profile');
      store(refreshedData as StoredUserProfile, syncStatus);
    },
    [store]
  );

  return {
    user: userProfile?.data,
    preferences: userProfile?.preferences,
    settings: userProfile?.settings,
    metadata,
    exists: !!userProfile,
    isStale: metadata?.syncStatus === 'pending',
    isSynced: metadata?.syncStatus === 'synced',
    hasConflict: metadata?.syncStatus === 'conflict',
    storeUserProfile,
    remove,
    updateSyncStatus,
  };
};

/**
 * Hook to manage pending changes for sync
 */
export const usePendingChanges = () => {
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);

  const refreshPendingChanges = useCallback(() => {
    const changes = offlineStorage.getPendingChanges();
    setPendingChanges(changes);
  }, []);

  const addPendingChange = useCallback(
    (
      entityType: string,
      entityId: string,
      operation: 'create' | 'update' | 'delete',
      data: any,
      metadata: Record<string, any> = {}
    ) => {
      offlineStorage.addPendingChange(
        entityType,
        entityId,
        operation,
        data,
        metadata
      );
      refreshPendingChanges();
    },
    [refreshPendingChanges]
  );

  const removePendingChange = useCallback(
    (changeId: string) => {
      offlineStorage.removePendingChange(changeId);
      refreshPendingChanges();
    },
    [refreshPendingChanges]
  );

  useEffect(() => {
    refreshPendingChanges();
  }, [refreshPendingChanges]);

  return {
    pendingChanges,
    count: pendingChanges.length,
    addPendingChange,
    removePendingChange,
    refreshPendingChanges,
  };
};

/**
 * Hook to manage conflict resolution
 */
export const useConflictResolution = () => {
  const [conflicts, setConflicts] = useState<ConflictEntry[]>([]);

  const refreshConflicts = useCallback(() => {
    const conflictList = offlineStorage.getConflicts();
    setConflicts(conflictList);
  }, []);

  const resolveConflict = useCallback(
    (
      conflictId: string,
      resolution: 'local' | 'remote' | 'merge',
      mergedData?: any
    ) => {
      offlineStorage.resolveConflict(conflictId, resolution, mergedData);
      refreshConflicts();
    },
    [refreshConflicts]
  );

  useEffect(() => {
    refreshConflicts();
  }, [refreshConflicts]);

  return {
    conflicts,
    count: conflicts.length,
    hasConflicts: conflicts.length > 0,
    resolveConflict,
    refreshConflicts,
  };
};

/**
 * Hook to get storage statistics and manage cleanup
 */
export const useStorageManagement = () => {
  const [stats, setStats] = useState<StorageStats>(() =>
    offlineStorage.getStats()
  );

  const refreshStats = useCallback(() => {
    const newStats = offlineStorage.getStats();
    setStats(newStats);
  }, []);

  const cleanup = useCallback(() => {
    offlineStorage.cleanup();
    refreshStats();
  }, [refreshStats]);

  const clearAll = useCallback(() => {
    offlineStorage.clear();
    refreshStats();
  }, [refreshStats]);

  useEffect(() => {
    // Refresh stats periodically
    const interval = setInterval(refreshStats, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [refreshStats]);

  return {
    stats,
    cleanup,
    clearAll,
    refreshStats,
  };
};

/**
 * Hook to integrate offline storage with TanStack Query
 */
export const useOfflineQuerySync = () => {
  const queryClient = useQueryClient();
  const { status: authStatus } = useAuth();

  const syncTripToQuery = useCallback(
    (tripId: string) => {
      const offlineTrip = offlineStorage.getTrip(tripId);
      if (offlineTrip && offlineTrip.metadata.syncStatus === 'synced') {
        // Update query cache with offline data
        queryClient.setQueryData(tripKeys.detail(tripId), {
          success: true,
          data: { trip: offlineTrip.data },
        });
      }
    },
    [queryClient]
  );

  const syncTripsListToQuery = useCallback(() => {
    const offlineTripsList = offlineStorage.getTripsList();
    if (offlineTripsList && offlineTripsList.metadata.syncStatus === 'synced') {
      // Update query cache with offline data
      queryClient.setQueryData(tripKeys.list(), {
        success: true,
        data: {
          trips: offlineTripsList.trips,
          total: offlineTripsList.pagination.total,
          hasMore: offlineTripsList.pagination.hasMore,
        },
      });
    }
  }, [queryClient]);

  const syncQueryToOffline = useCallback(
    (queryKey: readonly unknown[], data: any) => {
      // Store query data offline
      const key = queryKey.join(':');
      offlineStorage.set(key, data, { syncStatus: 'synced' });
    },
    []
  );

  return {
    syncTripToQuery,
    syncTripsListToQuery,
    syncQueryToOffline,
  };
};
