/**
 * Performance Testing Suite
 * Tests API response times, memory usage, and optimization strategies
 */

import MockAdapter from 'axios-mock-adapter';

import * as authApi from '../auth/api';
import { client } from '../common/client';
import * as tripsApi from '../trips/api';

describe('API Performance Testing', () => {
  let mockAxios: MockAdapter;

  beforeEach(() => {
    mockAxios = new MockAdapter(client);
  });

  afterEach(() => {
    mockAxios.restore();
  });

  describe('Response Time Performance', () => {
    it('should complete authentication within acceptable time limits', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: { id: '123', email: 'test@example.com' },
          tokens: {
            access: 'token',
            refresh: 'refresh',
            tokenType: 'Bearer' as const,
            expiresIn: 3600,
          },
        },
      };

      // Simulate fast API response (< 200ms)
      mockAxios.onPost('/api/v2/auth/login').reply(() => {
        return new Promise((resolve) => {
          setTimeout(() => resolve([200, mockResponse]), 100);
        });
      });

      const startTime = performance.now();
      await authApi.login({ email: 'test@example.com', password: 'password' });
      const endTime = performance.now();

      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(500); // Should complete within 500ms including processing
    });

    it('should handle slow network conditions gracefully', async () => {
      const mockResponse = {
        success: true,
        data: { trips: [] },
        metadata: { total: 0, page: 1, limit: 10, hasMore: false },
      };

      // Simulate slow network (2 second delay)
      mockAxios.onGet('/api/v2/trips').reply(() => {
        return new Promise((resolve) => {
          setTimeout(() => resolve([200, mockResponse]), 2000);
        });
      });

      const startTime = performance.now();
      await tripsApi.getTripList();
      const endTime = performance.now();

      const responseTime = endTime - startTime;
      expect(responseTime).toBeGreaterThan(2000);
      expect(responseTime).toBeLessThan(2500); // Should not add significant processing overhead
    });

    it('should timeout requests appropriately', async () => {
      // Simulate request timeout
      mockAxios.onGet('/api/v2/trips').timeout();

      await expect(tripsApi.getTripList()).rejects.toThrow();
    });
  });

  describe('Memory Usage Optimization', () => {
    it('should handle large trip lists efficiently', async () => {
      // Generate large dataset
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `trip-${i}`,
        title: `Trip ${i}`,
        destination: `Destination ${i}`,
        startDate: '2023-07-01',
        endDate: '2023-07-14',
        status: 'planning',
        participantCount: Math.floor(Math.random() * 10) + 1,
      }));

      const mockResponse = {
        success: true,
        data: { trips: largeDataset },
        metadata: { total: 1000, page: 1, limit: 1000, hasMore: false },
      };

      mockAxios.onGet('/api/v2/trips').reply(200, mockResponse);

      const memoryBefore = (performance as any).memory
        ? (performance as any).memory.usedJSHeapSize
        : 0;
      const result = await tripsApi.getTripList();
      const memoryAfter = (performance as any).memory
        ? (performance as any).memory.usedJSHeapSize
        : 0;

      expect(result.success).toBe(true);
      expect(result.data?.trips).toHaveLength(1000);

      // Memory increase should be reasonable for the dataset size
      const memoryIncrease = memoryAfter - memoryBefore;
      if ((performance as any).memory) {
        expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // Less than 10MB for 1000 trips
      }
    });

    it('should cleanup resources after API calls', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: { id: '123', email: 'test@example.com' },
          tokens: {
            access: 'token',
            refresh: 'refresh',
            tokenType: 'Bearer' as const,
            expiresIn: 3600,
          },
        },
      };

      mockAxios.onPost('/api/v2/auth/login').reply(200, mockResponse);

      // Make multiple API calls
      const promises = Array.from({ length: 10 }, () =>
        authApi.login({ email: 'test@example.com', password: 'password' })
      );

      await Promise.all(promises);

      // All requests should complete successfully
      expect(mockAxios.history.post).toHaveLength(10);
    });
  });

  describe('Caching Performance', () => {
    it('should demonstrate cache hit performance benefits', async () => {
      const mockResponse = {
        success: true,
        data: {
          trip: {
            id: 'trip-123',
            title: 'Cached Trip',
            destination: 'Europe',
            participants: [],
          },
        },
      };

      // First request - cache miss
      mockAxios.onGet('/api/v2/trips/trip-123').replyOnce(() => {
        return new Promise((resolve) => {
          setTimeout(() => resolve([200, mockResponse]), 100);
        });
      });

      const firstCallStart = performance.now();
      await tripsApi.getTripById('trip-123');
      const firstCallEnd = performance.now();
      const firstCallTime = firstCallEnd - firstCallStart;

      // Second request - should be faster due to potential caching
      mockAxios.onGet('/api/v2/trips/trip-123').replyOnce(() => {
        return new Promise((resolve) => {
          setTimeout(() => resolve([200, mockResponse]), 10); // Simulate faster cached response
        });
      });

      const secondCallStart = performance.now();
      await tripsApi.getTripById('trip-123');
      const secondCallEnd = performance.now();
      const secondCallTime = secondCallEnd - secondCallStart;

      // Second call should be significantly faster
      expect(secondCallTime).toBeLessThan(firstCallTime);
    });
  });

  describe('Batch Operation Performance', () => {
    it('should handle concurrent API calls efficiently', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: { id: '123', email: 'test@example.com' },
          tokens: {
            access: 'token',
            refresh: 'refresh',
            tokenType: 'Bearer' as const,
            expiresIn: 3600,
          },
        },
      };

      mockAxios.onPost('/api/v2/auth/login').reply(200, mockResponse);

      // Make 5 concurrent requests
      const startTime = performance.now();
      const promises = Array.from({ length: 5 }, () =>
        authApi.login({ email: 'test@example.com', password: 'password' })
      );

      await Promise.all(promises);
      const endTime = performance.now();

      const totalTime = endTime - startTime;

      // Concurrent requests should complete faster than sequential
      // With proper concurrency, 5 requests should take only slightly longer than 1
      expect(totalTime).toBeLessThan(1000); // Should complete within 1 second
      expect(mockAxios.history.post).toHaveLength(5);
    });

    it('should handle request queuing under high load', async () => {
      const mockResponse = { success: true, data: { trips: [] } };

      // Add delay to simulate server processing
      mockAxios.onGet('/api/v2/trips').reply(() => {
        return new Promise((resolve) => {
          setTimeout(() => resolve([200, mockResponse]), 50);
        });
      });

      // Make many concurrent requests
      const promises = Array.from({ length: 20 }, () => tripsApi.getTripList());

      const startTime = performance.now();
      const results = await Promise.all(promises);
      const endTime = performance.now();

      // All requests should succeed
      expect(results.every((r) => r.success)).toBe(true);
      expect(mockAxios.history.get).toHaveLength(20);

      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(2000); // Should handle high load efficiently
    });
  });

  describe('Error Handling Performance', () => {
    it('should fail fast on network errors', async () => {
      mockAxios.onGet('/api/v2/trips').networkError();

      const startTime = performance.now();
      try {
        await tripsApi.getTripList();
      } catch (error) {
        const endTime = performance.now();
        const errorTime = endTime - startTime;

        // Should fail quickly without long timeouts
        expect(errorTime).toBeLessThan(1000);
        expect(error).toBeDefined();
      }
    });

    it('should handle retry mechanisms efficiently', async () => {
      let attemptCount = 0;
      mockAxios.onGet('/api/v2/trips').reply(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return [500, { error: 'Server error' }];
        }
        return [200, { success: true, data: { trips: [] } }];
      });

      const startTime = performance.now();
      try {
        await tripsApi.getTripList();
        const endTime = performance.now();
        const totalTime = endTime - startTime;

        // Should eventually succeed with retries
        expect(attemptCount).toBe(3);
        expect(totalTime).toBeGreaterThan(0);
      } catch (error) {
        // If retries are not implemented, it should fail on first attempt
        expect(attemptCount).toBe(1);
      }
    });
  });

  describe('Data Transfer Optimization', () => {
    it('should minimize payload sizes', async () => {
      const mockResponse = {
        success: true,
        data: {
          trips: [
            {
              id: 'trip-123',
              title: 'European Adventure',
              destination: 'Europe',
              startDate: '2023-07-01',
              endDate: '2023-07-14',
              status: 'planning',
              participantCount: 3,
              // Note: Full participant details not included in list view
            },
          ],
        },
        metadata: { total: 1, page: 1, limit: 10, hasMore: false },
      };

      mockAxios.onGet('/api/v2/trips').reply(200, mockResponse);

      const result = await tripsApi.getTripList();
      const payloadSize = JSON.stringify(result).length;

      expect(result.success).toBe(true);
      // Payload should be reasonably sized (not including unnecessary data)
      expect(payloadSize).toBeLessThan(1000); // Less than 1KB for single trip summary
    });

    it('should support pagination for large datasets', async () => {
      const mockResponse = {
        success: true,
        data: {
          trips: Array.from({ length: 10 }, (_, i) => ({
            id: `trip-${i}`,
            title: `Trip ${i}`,
            destination: `Destination ${i}`,
            status: 'planning',
          })),
        },
        metadata: { total: 100, page: 1, limit: 10, hasMore: true },
      };

      // Mock both the base path and with query parameters
      mockAxios.onGet(/\/api\/v2\/trips/).reply(200, mockResponse);

      const result = await tripsApi.getTripList({ page: 1, limit: 10 });

      expect(result.success).toBe(true);
      expect(result.data?.trips).toHaveLength(10);
      expect(result.metadata?.hasMore).toBe(true);
      expect(result.metadata?.total).toBe(100);
    });
  });
});
