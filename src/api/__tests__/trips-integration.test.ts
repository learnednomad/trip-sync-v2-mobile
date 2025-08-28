/**
 * Trip Management API Integration Tests
 * Tests the full trip CRUD operations and participant management
 */

import MockAdapter from 'axios-mock-adapter';

import { client } from '../common/client';
import * as tripsApi from '../trips/api';
import type { CreateTripRequest, UpdateTripRequest } from '../trips/types';

describe('Trip Management API Integration', () => {
  let mockAxios: MockAdapter;

  beforeEach(() => {
    mockAxios = new MockAdapter(client);
  });

  afterEach(() => {
    mockAxios.restore();
  });

  describe('Trip CRUD Operations', () => {
    it('should create a trip successfully', async () => {
      const createData: CreateTripRequest = {
        name: 'European Adventure',
        description: 'A 2-week trip through Europe',
        destination: 'Europe',
        startDate: '2023-07-01',
        endDate: '2023-07-14',
        budgetAmount: 5000,
        budgetCurrency: 'USD',
        settings: {
          visibility: 'participants' as const,
        },
      };

      const mockResponse = {
        success: true,
        data: {
          trip: {
            id: 'trip-123',
            name: 'European Adventure',
            description: 'A 2-week trip through Europe',
            destination: 'Europe',
            startDate: '2023-07-01',
            endDate: '2023-07-14',
            budgetAmount: 5000,
            budgetCurrency: 'USD',
            status: 'planning',
            settings: {
          visibility: 'participants' as const,
        },
            createdBy: 'user-123',
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            participants: [
              {
                id: 'user-123',
                email: 'test@example.com',
                firstName: 'John',
                lastName: 'Doe',
                role: 'owner',
                status: 'accepted',
                joinedAt: '2023-01-01T00:00:00Z',
              },
            ],
          },
        },
      };

      mockAxios.onPost('/api/v2/trips').reply(201, mockResponse);

      const result = await tripsApi.createTrip(createData);

      expect(result.success).toBe(true);
      expect(result.data?.trip.name).toBe('European Adventure');
      expect(result.data?.trip.participants).toHaveLength(1);
    });

    it('should get trip list with filtering', async () => {
      const mockResponse = {
        success: true,
        data: {
          trips: [
            {
              id: 'trip-123',
              name: 'European Adventure',
              destination: 'Europe',
              startDate: '2023-07-01',
              endDate: '2023-07-14',
              status: 'planning',
              participantCount: 1,
            },
            {
              id: 'trip-456',
              name: 'Asian Journey',
              destination: 'Asia',
              startDate: '2023-08-01',
              endDate: '2023-08-21',
              status: 'active',
              participantCount: 3,
            },
          ],
        },
        metadata: {
          page: 1,
          limit: 10,
          total: 2,
          hasMore: false,
        },
      };

      mockAxios.onGet('/api/v2/trips').reply(200, mockResponse);

      const result = await tripsApi.getTripList();

      expect(result.success).toBe(true);
      expect(result.data?.trips).toHaveLength(2);
      expect(result.metadata?.total).toBe(2);
    });

    it('should get trip by ID', async () => {
      const mockResponse = {
        success: true,
        data: {
          trip: {
            id: 'trip-123',
            name: 'European Adventure',
            description: 'A 2-week trip through Europe',
            destination: 'Europe',
            startDate: '2023-07-01',
            endDate: '2023-07-14',
            budgetAmount: 5000,
            budgetCurrency: 'USD',
            status: 'planning',
            settings: {
          visibility: 'participants' as const,
        },
            createdBy: 'user-123',
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            participants: [
              {
                id: 'user-123',
                email: 'test@example.com',
                firstName: 'John',
                lastName: 'Doe',
                role: 'owner',
                status: 'accepted',
                joinedAt: '2023-01-01T00:00:00Z',
              },
            ],
          },
        },
      };

      mockAxios.onGet('/api/v2/trips/trip-123').reply(200, mockResponse);

      const result = await tripsApi.getTripById('trip-123');

      expect(result.success).toBe(true);
      expect(result.data?.trip.id).toBe('trip-123');
      expect(result.data?.trip.participants).toHaveLength(1);
    });

    it('should update trip successfully', async () => {
      const updateData: UpdateTripRequest = {
        name: 'Updated European Adventure',
        budgetAmount: 6000,
        version: 1,
      };

      const mockResponse = {
        success: true,
        data: {
          trip: {
            id: 'trip-123',
            name: 'Updated European Adventure',
            description: 'A 2-week trip through Europe',
            destination: 'Europe',
            startDate: '2023-07-01',
            endDate: '2023-07-14',
            budgetAmount: 6000,
            budgetCurrency: 'USD',
            status: 'planning',
            settings: {
          visibility: 'participants' as const,
        },
            createdBy: 'user-123',
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T01:00:00Z',
            participants: [],
          },
        },
      };

      mockAxios.onPut('/api/v2/trips/trip-123').reply(200, mockResponse);

      const result = await tripsApi.updateTrip('trip-123', updateData);

      expect(result.success).toBe(true);
      expect(result.data?.trip.name).toBe('Updated European Adventure');
      expect(result.data?.trip.budgetAmount).toBe(6000);
    });

    it('should delete trip successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          message: 'Trip deleted successfully',
        },
      };

      mockAxios.onDelete('/api/v2/trips/trip-123').reply(200, mockResponse);

      const result = await tripsApi.deleteTrip('trip-123');

      expect(result.success).toBe(true);
      expect(result.data?.message).toBe('Trip deleted successfully');
    });

    it('should handle trip not found', async () => {
      const mockError = {
        success: false,
        error: {
          code: 'TRIP_NOT_FOUND',
          message: 'Trip not found',
          timestamp: '2023-01-01T00:00:00Z',
          path: '/api/v2/trips/invalid-id',
          requestId: 'req-123',
        },
      };

      mockAxios.onGet('/api/v2/trips/invalid-id').reply(404, mockError);

      await expect(tripsApi.getTripById('invalid-id')).rejects.toThrow();
    });
  });

  describe('Participant Management', () => {
    it('should invite participants successfully', async () => {
      const inviteData = {
        emails: ['friend@example.com', 'colleague@example.com'],
        message: 'Join my European adventure!',
        role: 'MEMBER' as const,
      };

      const mockResponse = {
        success: true,
        data: {
          invitations: [
            {
              id: 'invite-123',
              tripId: 'trip-123',
              email: 'friend@example.com',
              role: 'MEMBER',
              status: 'pending',
              invitedBy: 'user-123',
              invitedAt: '2023-01-01T00:00:00Z',
            },
            {
              id: 'invite-456',
              tripId: 'trip-123',
              email: 'colleague@example.com',
              role: 'MEMBER',
              status: 'pending',
              invitedBy: 'user-123',
              invitedAt: '2023-01-01T00:00:00Z',
            },
          ],
        },
      };

      mockAxios
        .onPost('/api/v2/trips/trip-123/participants/invite')
        .reply(200, mockResponse);

      const result = await tripsApi.inviteParticipants('trip-123', inviteData);

      expect(result.success).toBe(true);
      expect(result.data?.invitations).toHaveLength(2);
    });

    it('should update participant role', async () => {
      const updateData = {
        role: 'ADMIN' as const,
      };

      const mockResponse = {
        success: true,
        data: {
          participant: {
            id: 'user-456',
            email: 'friend@example.com',
            firstName: 'Jane',
            lastName: 'Smith',
            role: 'ADMIN',
            status: 'accepted',
            joinedAt: '2023-01-01T00:00:00Z',
          },
        },
      };

      mockAxios
        .onPut('/api/v2/trips/trip-123/participants/user-456')
        .reply(200, mockResponse);

      const result = await tripsApi.updateParticipant(
        'trip-123',
        'user-456',
        updateData
      );

      expect(result.success).toBe(true);
      expect(result.data?.participant.role).toBe('admin');
    });

    it('should remove participant successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          message: 'Participant removed successfully',
        },
      };

      mockAxios
        .onDelete('/api/v2/trips/trip-123/participants/user-456')
        .reply(200, mockResponse);

      const result = await tripsApi.removeParticipant('trip-123', 'user-456');

      expect(result.success).toBe(true);
      expect(result.data?.message).toBe('Participant removed successfully');
    });

    it('should handle permission denied', async () => {
      const mockError = {
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'You do not have permission to perform this action',
          timestamp: '2023-01-01T00:00:00Z',
          path: '/api/v2/trips/trip-123/participants/invite',
          requestId: 'req-123',
        },
      };

      mockAxios
        .onPost('/api/v2/trips/trip-123/participants/invite')
        .reply(403, mockError);

      const inviteData = {
        emails: ['test@example.com'],
        role: 'MEMBER' as const,
      };

      await expect(
        tripsApi.inviteParticipants('trip-123', inviteData)
      ).rejects.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      mockAxios.onGet('/api/v2/trips').networkError();

      await expect(tripsApi.getTripList()).rejects.toThrow();
    });

    it('should handle server errors', async () => {
      const mockError = {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
          timestamp: '2023-01-01T00:00:00Z',
          path: '/api/v2/trips',
          requestId: 'req-123',
        },
      };

      mockAxios.onGet('/api/v2/trips').reply(500, mockError);

      await expect(tripsApi.getTripList()).rejects.toThrow();
    });

    it('should handle validation errors', async () => {
      const createData: CreateTripRequest = {
        name: '',
        destination: '',
        startDate: 'invalid-date',
        endDate: 'invalid-date',
        budgetAmount: -100,
        budgetCurrency: 'INVALID',
        settings: {
          visibility: 'participants' as const,
        },
      };

      const mockError = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid trip data',
          details: {
            name: 'Name is required',
            destination: 'Destination is required',
            startDate: 'Invalid date format',
            endDate: 'Invalid date format',
            budgetAmount: 'Budget must be positive',
            budgetCurrency: 'Invalid currency code',
          },
          timestamp: '2023-01-01T00:00:00Z',
          path: '/api/v2/trips',
          requestId: 'req-123',
        },
      };

      mockAxios.onPost('/api/v2/trips').reply(400, mockError);

      await expect(tripsApi.createTrip(createData)).rejects.toThrow();
    });
  });
});
