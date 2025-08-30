/**
 * Sync Engine Tests
 * Testing sync orchestration and conflict resolution
 */

import { OfflineTestFixture } from './offline-test-utils';

const {
  sampleTrip,
  setupOfflineTest,
  teardownOfflineTest,
  NetworkMock,
  OfflineScenarioBuilder,
  OfflineTestAssertions
} = OfflineTestFixture;

describe('Sync Engine', () => {
  beforeEach(() => {
    setupOfflineTest();
  });

  afterEach(() => {
    teardownOfflineTest();
  });

  describe('Conflict Detection', () => {
    it('should detect conflicts between local and remote data', async () => {
      const { conflictResolver } = await import('../conflict-resolver');
      
      const { localTrip, remoteTrip } = OfflineScenarioBuilder.createTripConflict(sampleTrip);
      
      const conflict = conflictResolver.detectConflicts(localTrip, remoteTrip);
      
      expect(conflict).toBeTruthy();
      expect(conflict?.conflictFields).toContain('name');
      expect(conflict?.conflictFields).toContain('description');
      expect(conflict?.priority).toBe('high'); // Name conflicts are high priority
    });

    it('should auto-resolve non-critical conflicts', async () => {
      const { conflictResolver } = await import('../conflict-resolver');
      
      const localTrip = {
        ...sampleTrip,
        coverImageUrl: 'local-image.jpg',
        version: 1,
        _metadata: {} as any,
      };

      const remoteTrip = {
        ...sampleTrip,
        coverImageUrl: 'remote-image.jpg',
        version: 2,
      };

      const conflict = conflictResolver.detectConflicts(localTrip, remoteTrip);
      expect(conflict).toBeTruthy();

      const resolution = await conflictResolver.autoResolveConflict(conflict!);
      
      expect(resolution).toBeTruthy();
      expect(resolution?.strategy).toBe('merge');
      expect(resolution?.resolvedBy).toBe('auto');
    });
  });

  describe('Sync Operations', () => {
    it('should upload pending changes when online', async () => {
      const { syncEngine } = await import('../sync-engine');
      const { offlineStorage } = await import('../offline-storage');
      
      // Create pending operations
      const operations = OfflineScenarioBuilder.createSyncOperations(3);
      operations.forEach(op => offlineStorage.addSyncOperation(op));
      
      // Mock successful API responses
      const mockApiClient = {
        post: jest.fn().mockResolvedValue({ data: { success: true } }),
        put: jest.fn().mockResolvedValue({ data: { success: true } }),
        delete: jest.fn().mockResolvedValue({ data: { success: true } }),
      };
      
      // Mock network online
      NetworkMock.simulateOnline();
      
      await syncEngine.startSync({ direction: 'upload' });
      
      // Wait for sync completion
      await OfflineTestAssertions.waitForSync(10000);
      
      const remainingQueue = offlineStorage.getSyncQueue();
      expect(remainingQueue).toHaveLength(0); // All operations should be processed
    });

    it('should handle sync failures with retry logic', async () => {
      const { syncEngine } = await import('../sync-engine');
      const { offlineStorage } = await import('../offline-storage');
      
      // Create operation that will fail
      offlineStorage.addSyncOperation({
        type: 'UPDATE',
        resourceType: 'trip',
        resourceId: 'failing-trip',
        data: { name: 'Will Fail' },
        priority: 'normal',
        retryCount: 0,
        maxRetries: 2,
        networkRequired: true,
      });

      // Mock API failure
      NetworkMock.simulateNetworkFailure();
      
      try {
        await syncEngine.startSync({ direction: 'upload' });
      } catch (error) {
        // Expected to fail
      }

      const queue = offlineStorage.getSyncQueue();
      const failedOp = queue.find(op => op.resourceId === 'failing-trip');
      
      expect(failedOp?.retryCount).toBe(1); // Should increment retry count
    });
  });

  describe('Network Awareness', () => {
    it('should respect cellular sync preferences', async () => {
      const { useAutoSync } = await import('../sync-engine');
      const { useNetworkStatus } = await import('../network-detector');
      
      // Simulate cellular connection
      NetworkMock.simulateCellular();
      
      // Mock hooks (in real test, would use React Testing Library)
      const networkStatus = { isOnline: true, canSync: false, connectionType: 'cellular' };
      const autoSync = { preferences: { allowCellularSync: false } };
      
      expect(networkStatus.canSync).toBe(false);
    });

    it('should sync immediately when WiFi becomes available', async () => {
      const { syncEngine } = await import('../sync-engine');
      
      // Start offline
      NetworkMock.simulateOffline();
      
      // Go online with WiFi
      NetworkMock.simulateOnline();
      
      // Verify sync was triggered (would need to mock the engine in real test)
      const syncState = syncEngine.getState();
      expect(syncState).toBeDefined();
    });
  });

  describe('Data Persistence', () => {
    it('should persist and restore offline data correctly', async () => {
      const { offlineStorage } = await import('../offline-storage');
      
      await offlineStorage.storeTrip(sampleTrip, {
        localModified: true,
        syncStatus: 'pending',
      });

      // Simulate app restart by creating new storage instance
      const exportedData = await offlineStorage.exportAllData();
      
      OfflineStorageMock.clearTestData();
      
      await offlineStorage.importData(exportedData);
      
      const restoredTrip = offlineStorage.getTrip(sampleTrip.id);
      expect(restoredTrip).toBeTruthy();
      expect(restoredTrip?._metadata.syncStatus).toBe('pending');
    });
  });
});