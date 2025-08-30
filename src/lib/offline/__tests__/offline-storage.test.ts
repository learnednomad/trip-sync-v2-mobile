/**
 * Offline Storage Tests
 * Comprehensive testing for offline data management
 */

import { OfflineTestFixture } from './offline-test-utils';

const { 
  sampleTrip, 
  setupOfflineTest, 
  teardownOfflineTest,
  OfflineStorageMock,
  OfflineTestAssertions
} = OfflineTestFixture;

describe('Offline Storage', () => {
  beforeEach(() => {
    setupOfflineTest();
  });

  afterEach(() => {
    teardownOfflineTest();
  });

  describe('Trip Storage', () => {
    it('should store and retrieve trips with metadata', async () => {
      const { offlineStorage } = await import('../offline-storage');
      
      await offlineStorage.storeTrip(sampleTrip, {
        localModified: true,
        syncStatus: 'pending',
      });

      const retrieved = offlineStorage.getTrip(sampleTrip.id);
      
      expect(retrieved).toBeTruthy();
      expect(retrieved?.id).toBe(sampleTrip.id);
      expect(retrieved?._metadata.localModified).toBe(true);
      expect(retrieved?._metadata.syncStatus).toBe('pending');
    });

    it('should handle storage quota and cleanup', async () => {
      const { offlineStorage } = await import('../offline-storage');
      
      // Create quota scenario
      const scenario = OfflineTestFixture.OfflineScenarioBuilder.createStorageQuotaScenario();
      
      // Store all trips
      for (const trip of scenario.trips) {
        await offlineStorage.storeTrip(trip, trip._metadata);
      }

      // Trigger cleanup
      const result = await offlineStorage.performCleanup();
      
      expect(result.removedCount).toBeGreaterThan(0);
      expect(result.freedBytes).toBeGreaterThan(0);
      
      // Verify quota is respected
      OfflineTestAssertions.assertStorageQuotaRespected(50); // 50MB limit
    });

    it('should prioritize trips correctly', async () => {
      const { offlineStorage } = await import('../offline-storage');
      
      const upcomingTrip = {
        ...sampleTrip,
        id: 'upcoming-trip',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        status: 'CONFIRMED' as const,
      };

      const oldTrip = {
        ...sampleTrip,
        id: 'old-trip',
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
        status: 'COMPLETED' as const,
      };

      await offlineStorage.storeTrip(upcomingTrip);
      await offlineStorage.storeTrip(oldTrip);

      const allTrips = offlineStorage.getAllTrips();
      const upcomingCached = allTrips.find(t => t.id === 'upcoming-trip');
      const oldCached = allTrips.find(t => t.id === 'old-trip');

      expect(upcomingCached?._metadata.priority).toBe('high');
      expect(oldCached?._metadata.priority).toBe('low');
    });
  });

  describe('Sync Queue Management', () => {
    it('should manage sync operations with priority', async () => {
      const { offlineStorage } = await import('../offline-storage');
      
      const operations = OfflineTestFixture.OfflineScenarioBuilder.createSyncOperations(5);
      
      operations.forEach(op => {
        offlineStorage.addSyncOperation(op);
      });

      const queue = offlineStorage.getSyncQueue();
      
      expect(queue).toHaveLength(5);
      // Verify high priority operations come first
      expect(queue[0].priority).toBe('high');
    });

    it('should handle storage statistics correctly', async () => {
      const { offlineStorage } = await import('../offline-storage');
      
      await offlineStorage.storeTrip(sampleTrip);
      
      const stats = await offlineStorage.getStorageStats();
      
      expect(stats.totalTrips).toBe(1);
      expect(stats.totalSize).toBeGreaterThan(0);
      expect(stats.quotaUsage).toBeGreaterThan(0);
      expect(stats.newestTrip).toBe(sampleTrip.name);
    });
  });

  describe('Health Checks', () => {
    it('should detect storage health issues', async () => {
      const { offlineStorage } = await import('../offline-storage');
      
      // Create a scenario with old unsynced data
      await offlineStorage.storeTrip(sampleTrip, {
        localModified: true,
        syncStatus: 'pending',
        lastSyncTime: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
      });

      const health = await offlineStorage.healthCheck();
      
      expect(health.isHealthy).toBe(false);
      expect(health.issues).toContain(expect.stringContaining('old unsynced changes'));
      expect(health.recommendations).toHaveLength(1);
    });

    it('should report healthy storage correctly', async () => {
      const { offlineStorage } = await import('../offline-storage');
      
      await offlineStorage.storeTrip(sampleTrip, {
        syncStatus: 'synced',
        localModified: false,
      });

      const health = await offlineStorage.healthCheck();
      
      expect(health.isHealthy).toBe(true);
      expect(health.issues).toHaveLength(0);
    });
  });
});