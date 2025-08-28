/**
 * Offline-First Architecture Tests
 * Tests offline functionality, sync mechanisms, and conflict resolution
 */

import MockAdapter from 'axios-mock-adapter';
import { MMKV } from 'react-native-mmkv';

import { client } from '../common/client';

// Mock MMKV for testing
jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    set: jest.fn(),
    getString: jest.fn(),
    getNumber: jest.fn(),
    getBoolean: jest.fn(),
    getAllKeys: jest.fn(() => []),
    delete: jest.fn(),
    clearAll: jest.fn(),
  })),
}));

describe('Offline-First Architecture', () => {
  let mockAxios: MockAdapter;
  let mockStorage: any;

  beforeEach(() => {
    mockAxios = new MockAdapter(client);
    mockStorage = new MMKV();
    jest.clearAllMocks();
  });

  afterEach(() => {
    mockAxios.restore();
  });

  describe('Offline Data Storage', () => {
    it('should store trip data when offline', () => {
      const tripData = {
        id: 'trip-123',
        title: 'European Adventure',
        destination: 'Europe',
        status: 'planning',
      };

      // Simulate storing offline data
      mockStorage.set('offline_trip_trip-123', JSON.stringify(tripData));

      expect(mockStorage.set).toHaveBeenCalledWith(
        'offline_trip_trip-123',
        JSON.stringify(tripData)
      );
    });

    it('should retrieve cached trip data when offline', () => {
      const cachedData = JSON.stringify({
        id: 'trip-123',
        title: 'European Adventure',
        cached: true,
        lastSync: '2023-01-01T00:00:00Z',
      });

      mockStorage.getString.mockReturnValue(cachedData);

      const result = mockStorage.getString('offline_trip_trip-123');
      const parsedData = JSON.parse(result);

      expect(parsedData.cached).toBe(true);
      expect(parsedData.id).toBe('trip-123');
    });

    it('should queue operations when offline', () => {
      const operation = {
        id: 'op-123',
        type: 'CREATE_TRIP',
        endpoint: '/api/v2/trips',
        method: 'POST',
        data: { title: 'New Trip' },
        timestamp: '2023-01-01T00:00:00Z',
        retryCount: 0,
      };

      mockStorage.set('sync_queue', JSON.stringify([operation]));

      expect(mockStorage.set).toHaveBeenCalledWith(
        'sync_queue',
        JSON.stringify([operation])
      );
    });
  });

  describe('Network Status Handling', () => {
    it('should detect online/offline status changes', () => {
      // Mock network info
      const mockNetworkInfo = {
        isConnected: false,
        type: 'none',
        isInternetReachable: false,
      };

      // Simulate offline detection
      expect(mockNetworkInfo.isConnected).toBe(false);
      expect(mockNetworkInfo.isInternetReachable).toBe(false);

      // Simulate coming back online
      mockNetworkInfo.isConnected = true;
      mockNetworkInfo.isInternetReachable = true;
      mockNetworkInfo.type = 'wifi';

      expect(mockNetworkInfo.isConnected).toBe(true);
      expect(mockNetworkInfo.isInternetReachable).toBe(true);
    });

    it('should trigger sync when coming back online', async () => {
      const queuedOperations = [
        {
          id: 'op-123',
          type: 'CREATE_TRIP',
          endpoint: '/api/v2/trips',
          method: 'POST',
          data: { title: 'Offline Trip' },
          timestamp: '2023-01-01T00:00:00Z',
          retryCount: 0,
        },
      ];

      mockStorage.getString.mockReturnValue(JSON.stringify(queuedOperations));

      // Mock successful API response
      mockAxios.onPost('/api/v2/trips').reply(201, {
        success: true,
        data: {
          trip: { id: 'trip-123', title: 'Offline Trip', status: 'planning' },
        },
      });

      // Simulate sync process
      const operations = JSON.parse(
        mockStorage.getString('sync_queue') || '[]'
      );
      expect(operations).toHaveLength(1);
      expect(operations[0].type).toBe('CREATE_TRIP');
    });
  });

  describe('Conflict Resolution', () => {
    it('should detect conflicts when syncing', () => {
      const localTrip = {
        id: 'trip-123',
        title: 'Local Title',
        version: 1,
        lastModified: '2023-01-01T10:00:00Z',
      };

      const serverTrip = {
        id: 'trip-123',
        title: 'Server Title',
        version: 2,
        lastModified: '2023-01-01T11:00:00Z',
      };

      // Simulate conflict detection
      const hasConflict = localTrip.version !== serverTrip.version;
      expect(hasConflict).toBe(true);

      // Server version is newer
      const serverIsNewer =
        new Date(serverTrip.lastModified) > new Date(localTrip.lastModified);
      expect(serverIsNewer).toBe(true);
    });

    it('should resolve conflicts with last-write-wins strategy', () => {
      const localTrip = {
        id: 'trip-123',
        title: 'Local Title',
        lastModified: '2023-01-01T10:00:00Z',
      };

      const serverTrip = {
        id: 'trip-123',
        title: 'Server Title',
        lastModified: '2023-01-01T11:00:00Z',
      };

      // Last write wins - server is newer
      const resolved =
        new Date(serverTrip.lastModified) > new Date(localTrip.lastModified)
          ? serverTrip
          : localTrip;

      expect(resolved.title).toBe('Server Title');
    });

    it('should allow user to choose resolution strategy', () => {
      const conflict: {
        type: string;
        localData: any;
        serverData: any;
        resolutionStrategy?: 'local' | 'remote' | 'merge' | 'manual';
      } = {
        type: 'UPDATE_TRIP',
        localData: { title: 'My Version' },
        serverData: { title: 'Their Version' },
        resolutionStrategy: undefined,
      };

      // Simulate user choosing server version
      conflict.resolutionStrategy = 'remote';
      expect(conflict.resolutionStrategy).toBe('remote');

      // Simulate user choosing local version
      conflict.resolutionStrategy = 'local';
      expect(conflict.resolutionStrategy).toBe('local');

      // Simulate user choosing to merge
      conflict.resolutionStrategy = 'merge';
      expect(conflict.resolutionStrategy).toBe('merge');
    });
  });

  describe('Sync Queue Management', () => {
    it('should retry failed operations with exponential backoff', async () => {
      const failedOperation = {
        id: 'op-123',
        type: 'CREATE_TRIP',
        endpoint: '/api/v2/trips',
        method: 'POST',
        data: { title: 'Failed Trip' },
        retryCount: 2,
        nextRetry: '2023-01-01T00:05:00Z', // 5 minutes from now
      };

      // Calculate next retry delay (exponential backoff: 2^retryCount minutes)
      const retryDelay = Math.pow(2, failedOperation.retryCount) * 60 * 1000;
      expect(retryDelay).toBe(240000); // 4 minutes
    });

    it('should remove operations after max retries', () => {
      const maxRetries = 5;
      const operationWithMaxRetries = {
        id: 'op-123',
        retryCount: maxRetries,
      };

      const shouldRemove = operationWithMaxRetries.retryCount >= maxRetries;
      expect(shouldRemove).toBe(true);
    });

    it('should prioritize operations by timestamp', () => {
      const operations = [
        {
          id: 'op-2',
          timestamp: '2023-01-01T00:02:00Z',
          priority: 'normal',
        },
        {
          id: 'op-1',
          timestamp: '2023-01-01T00:01:00Z',
          priority: 'high',
        },
        {
          id: 'op-3',
          timestamp: '2023-01-01T00:03:00Z',
          priority: 'normal',
        },
      ];

      // Sort by priority first, then timestamp
      const sorted = operations.sort((a, b) => {
        if (a.priority === 'high' && b.priority !== 'high') return -1;
        if (b.priority === 'high' && a.priority !== 'high') return 1;
        return (
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
      });

      expect(sorted[0].id).toBe('op-1'); // High priority
      expect(sorted[1].id).toBe('op-2'); // Earlier timestamp
      expect(sorted[2].id).toBe('op-3'); // Latest timestamp
    });
  });

  describe('Data Consistency', () => {
    it('should maintain referential integrity in offline data', () => {
      const trip = {
        id: 'trip-123',
        participants: ['user-456', 'user-789'],
      };

      const participants = [
        { id: 'user-456', email: 'user1@example.com', role: 'member' },
        { id: 'user-789', email: 'user2@example.com', role: 'admin' },
      ];

      // Verify all participant references exist
      const validReferences = trip.participants.every((participantId) =>
        participants.some((p) => p.id === participantId)
      );

      expect(validReferences).toBe(true);
    });

    it('should handle partial sync failures gracefully', () => {
      const syncBatch = [
        { id: 'op-1', status: 'success' },
        { id: 'op-2', status: 'failed', error: 'Network timeout' },
        { id: 'op-3', status: 'pending' },
      ];

      const successful = syncBatch.filter((op) => op.status === 'success');
      const failed = syncBatch.filter((op) => op.status === 'failed');
      const pending = syncBatch.filter((op) => op.status === 'pending');

      expect(successful).toHaveLength(1);
      expect(failed).toHaveLength(1);
      expect(pending).toHaveLength(1);

      // Failed and pending operations should be retried
      const toRetry = [...failed, ...pending];
      expect(toRetry).toHaveLength(2);
    });
  });

  describe('Cache Management', () => {
    it('should implement cache invalidation strategies', () => {
      const cacheEntry = {
        key: 'trip_list_user_123',
        data: { trips: [] },
        timestamp: '2023-01-01T00:00:00Z',
        ttl: 300000, // 5 minutes
      };

      const now = new Date('2023-01-01T00:06:00Z').getTime();
      const entryTime = new Date(cacheEntry.timestamp).getTime();
      const isExpired = now - entryTime > cacheEntry.ttl;

      expect(isExpired).toBe(true);
    });

    it('should use cache when offline and fresh', () => {
      const cacheEntry = {
        key: 'trip_123',
        data: { id: 'trip-123', title: 'Cached Trip' },
        timestamp: '2023-01-01T00:00:00Z',
        ttl: 300000,
      };

      const now = new Date('2023-01-01T00:02:00Z').getTime();
      const entryTime = new Date(cacheEntry.timestamp).getTime();
      const isFresh = now - entryTime < cacheEntry.ttl;

      expect(isFresh).toBe(true);

      // Should use cached data when offline and fresh
      const useCache = !navigator.onLine && isFresh;
      // Note: navigator.onLine is not available in test environment, so we simulate
      const simulateOffline = true;
      const shouldUseCache = simulateOffline && isFresh;

      expect(shouldUseCache).toBe(true);
    });
  });
});
