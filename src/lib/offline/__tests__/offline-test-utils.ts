/**
 * Offline Testing Utilities
 * Comprehensive testing framework for offline-first functionality
 */

import { MMKV } from 'react-native-mmkv';
import NetInfo from '@react-native-community/netinfo';

import type { Trip } from '@/api/trips/types';
import type { CachedTrip, SyncOperation } from '../offline-storage';
import { offlineStorage } from '../offline-storage';
import { syncEngine } from '../sync-engine';
import { conflictResolver } from '../conflict-resolver';

// Mock network conditions
export class NetworkMock {
  private static originalFetch: typeof global.fetch;
  private static networkState = {
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi' as const,
  };

  static simulateOffline(): void {
    this.networkState = {
      isConnected: false,
      isInternetReachable: false,
      type: 'none' as const,
    };
    
    // Mock NetInfo
    jest.spyOn(NetInfo, 'fetch').mockResolvedValue(this.networkState as any);
    jest.spyOn(NetInfo, 'addEventListener').mockImplementation((listener) => {
      // Immediately call with current state
      listener(this.networkState as any);
      // Return unsubscribe function
      return jest.fn();
    });
  }

  static simulateOnline(): void {
    this.networkState = {
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi' as const,
    };
    
    jest.spyOn(NetInfo, 'fetch').mockResolvedValue(this.networkState as any);
    jest.spyOn(NetInfo, 'addEventListener').mockImplementation((listener) => {
      listener(this.networkState as any);
      return jest.fn();
    });
  }

  static simulateCellular(): void {
    this.networkState = {
      isConnected: true,
      isInternetReachable: true,
      type: 'cellular' as const,
    };
    
    jest.spyOn(NetInfo, 'fetch').mockResolvedValue({
      ...this.networkState,
      details: { cellularGeneration: '4g', isConnectionExpensive: true },
    } as any);
  }

  static simulateSlowNetwork(): void {
    this.originalFetch = global.fetch;
    
    global.fetch = jest.fn().mockImplementation(async (...args) => {
      // Add artificial delay to simulate slow network
      await new Promise(resolve => setTimeout(resolve, 2000));
      return this.originalFetch(...args);
    });
  }

  static simulateNetworkFailure(): void {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network request failed'));
  }

  static restoreNetwork(): void {
    if (this.originalFetch) {
      global.fetch = this.originalFetch;
    }
    
    jest.restoreAllMocks();
  }
}

// Mock offline storage for testing
export class OfflineStorageMock {
  private static mockStorage = new Map<string, string>();

  static mockMMKV(): void {
    jest.mock('react-native-mmkv', () => ({
      MMKV: jest.fn().mockImplementation(() => ({
        set: jest.fn((key: string, value: string) => {
          this.mockStorage.set(key, value);
        }),
        getString: jest.fn((key: string) => {
          return this.mockStorage.get(key) || null;
        }),
        delete: jest.fn((key: string) => {
          this.mockStorage.delete(key);
        }),
        getAllKeys: jest.fn(() => {
          return Array.from(this.mockStorage.keys());
        }),
        clearAll: jest.fn(() => {
          this.mockStorage.clear();
        }),
      })),
    }));
  }

  static seedTestData(trips: Trip[]): void {
    trips.forEach(trip => {
      const cachedTrip: CachedTrip = {
        ...trip,
        _metadata: {
          lastSyncTime: new Date().toISOString(),
          localModified: false,
          version: trip.version || 1,
          syncStatus: 'synced',
          size: JSON.stringify(trip).length,
          priority: 'normal',
          retryCount: 0,
          lastAccessTime: new Date().toISOString(),
        },
      };
      
      this.mockStorage.set(`trip:${trip.id}`, JSON.stringify(cachedTrip));
    });
  }

  static clearTestData(): void {
    this.mockStorage.clear();
  }

  static getStorageContents(): any[] {
    const contents = [];
    for (const [key, value] of this.mockStorage.entries()) {
      try {
        contents.push({ key, data: JSON.parse(value) });
      } catch (error) {
        contents.push({ key, data: value });
      }
    }
    return contents;
  }
}

// Test scenario builders
export class OfflineScenarioBuilder {
  static createTripConflict(baseTrip: Trip): {
    localTrip: CachedTrip;
    remoteTrip: Trip;
  } {
    const localTrip: CachedTrip = {
      ...baseTrip,
      name: `${baseTrip.name} (Local Edit)`,
      description: 'Edited offline',
      version: baseTrip.version || 1,
      _metadata: {
        lastSyncTime: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
        localModified: true,
        version: baseTrip.version || 1,
        syncStatus: 'pending',
        size: 1024,
        priority: 'normal',
        retryCount: 0,
        lastAccessTime: new Date().toISOString(),
      },
    };

    const remoteTrip: Trip = {
      ...baseTrip,
      name: `${baseTrip.name} (Remote Edit)`,
      description: 'Edited on server',
      version: (baseTrip.version || 1) + 1,
      updatedAt: new Date().toISOString(),
    };

    return { localTrip, remoteTrip };
  }

  static createSyncOperations(count: number = 5): SyncOperation[] {
    return Array.from({ length: count }, (_, i) => ({
      id: `sync-op-${i}`,
      type: i % 3 === 0 ? 'CREATE' : i % 3 === 1 ? 'UPDATE' : 'DELETE',
      resourceType: 'trip',
      resourceId: `trip-${i}`,
      data: { name: `Test Trip ${i}` },
      timestamp: new Date(Date.now() - i * 60000).toISOString(),
      priority: i < 2 ? 'high' : 'normal',
      retryCount: 0,
      maxRetries: 3,
      networkRequired: true,
    }));
  }

  static createStorageQuotaScenario(): {
    trips: CachedTrip[];
    quotaExceeded: boolean;
  } {
    const trips: CachedTrip[] = [];
    let totalSize = 0;
    const quotaLimit = 50 * 1024 * 1024; // 50MB

    // Create trips until quota is exceeded
    for (let i = 0; i < 200; i++) {
      const trip: CachedTrip = {
        id: `quota-trip-${i}`,
        name: `Quota Test Trip ${i}`,
        description: 'A' * 1000, // Large description
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        destination: 'Test Destination',
        tripType: 'LEISURE',
        status: 'PLANNING',
        budgetCurrency: 'USD',
        settings: { visibility: 'private', permissions: {}, notifications: {}, features: {} },
        ownerId: 'test-user',
        participants: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
        _metadata: {
          lastSyncTime: new Date().toISOString(),
          localModified: false,
          version: 1,
          syncStatus: 'synced',
          size: 2048, // 2KB per trip
          priority: 'low',
          retryCount: 0,
          lastAccessTime: new Date(Date.now() - i * 60000).toISOString(),
        },
      };

      trips.push(trip);
      totalSize += trip._metadata.size;

      if (totalSize > quotaLimit) {
        break;
      }
    }

    return {
      trips,
      quotaExceeded: totalSize > quotaLimit,
    };
  }
}

// Test assertions and helpers
export class OfflineTestAssertions {
  static async waitForSync(timeoutMs: number = 5000): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      const syncState = syncEngine.getState();
      if (!syncState.isRunning) {
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    throw new Error('Sync did not complete within timeout');
  }

  static assertTripSynced(tripId: string): void {
    const trip = offlineStorage.getTrip(tripId);
    expect(trip).toBeTruthy();
    expect(trip?._metadata.syncStatus).toBe('synced');
    expect(trip?._metadata.localModified).toBe(false);
  }

  static assertTripPending(tripId: string): void {
    const trip = offlineStorage.getTrip(tripId);
    expect(trip).toBeTruthy();
    expect(trip?._metadata.syncStatus).toBe('pending');
    expect(trip?._metadata.localModified).toBe(true);
  }

  static assertConflictExists(tripId: string): void {
    const syncState = syncEngine.getState();
    const conflict = syncState.conflicts.find(c => c.resourceId === tripId);
    expect(conflict).toBeTruthy();
  }

  static assertStorageQuotaRespected(maxSizeMB: number): void {
    const stats = offlineStorage.getStorageStats();
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    expect(stats.totalSize).toBeLessThanOrEqual(maxSizeBytes);
  }

  static assertNetworkBehavior(
    expectedCalls: number,
    mockApiClient: any
  ): void {
    expect(mockApiClient.get).toHaveBeenCalledTimes(expectedCalls);
  }
}

// Complete test fixture
export const OfflineTestFixture = {
  // Sample data
  sampleTrip: {
    id: 'test-trip-1',
    name: 'Test Trip',
    description: 'A test trip for offline functionality',
    startDate: '2024-06-01',
    endDate: '2024-06-05',
    destination: 'Test Destination',
    tripType: 'LEISURE' as const,
    status: 'PLANNING' as const,
    budgetCurrency: 'USD',
    settings: {
      visibility: 'private' as const,
      permissions: {
        canInvite: 'owner' as const,
        canEditItinerary: 'admins' as const,
        canAddExpenses: 'all' as const,
        canSeeExpenses: 'all' as const,
      },
      notifications: {
        dailyDigest: true,
        instantUpdates: true,
        reminderDaysBefore: 1,
      },
      features: {
        expenses: true,
        itinerary: true,
        messages: true,
        documents: true,
        polls: false,
      },
    },
    ownerId: 'test-user-1',
    participants: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    version: 1,
  } as Trip,

  // Test utilities
  setupOfflineTest: () => {
    NetworkMock.simulateOffline();
    OfflineStorageMock.mockMMKV();
    OfflineStorageMock.clearTestData();
  },

  teardownOfflineTest: () => {
    NetworkMock.restoreNetwork();
    OfflineStorageMock.clearTestData();
    jest.restoreAllMocks();
  },

  // Scenario builders
  NetworkMock,
  OfflineStorageMock,
  OfflineScenarioBuilder,
  OfflineTestAssertions,
};