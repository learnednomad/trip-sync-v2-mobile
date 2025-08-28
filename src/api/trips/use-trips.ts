/**
 * Trip Management React Query Hooks
 * TanStack Query integration for trip operations
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as tripsApi from './api';
import type {
  CreateTripRequest,
  InviteParticipantRequest,
  TripListParams,
  UpdateParticipantRequest,
  UpdateTripRequest,
} from './types';

// Query Keys
export const tripKeys = {
  all: ['trips'] as const,
  lists: () => [...tripKeys.all, 'list'] as const,
  list: (params?: TripListParams) => [...tripKeys.lists(), params] as const,
  details: () => [...tripKeys.all, 'detail'] as const,
  detail: (id: string) => [...tripKeys.details(), id] as const,
  participants: (tripId: string) =>
    [...tripKeys.detail(tripId), 'participants'] as const,
};

/**
 * Get list of trips with optional filtering
 */
export const useTrips = (params?: TripListParams) => {
  return useQuery({
    queryKey: tripKeys.list(params),
    queryFn: () => tripsApi.getTripList(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
};

/**
 * Get upcoming trips
 */
export const useUpcomingTrips = (limit = 10) => {
  return useTrips({
    upcoming: true,
    limit,
    sort: 'startDate',
    order: 'asc',
  });
};

/**
 * Get trip details by ID
 */
export const useTrip = (tripId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: tripKeys.detail(tripId),
    queryFn: () => tripsApi.getTripById(tripId),
    enabled: options?.enabled ?? !!tripId,
    staleTime: 1000 * 60 * 2, // 2 minutes for details
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};

/**
 * Create a new trip
 */
export const useCreateTrip = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTripRequest) => tripsApi.createTrip(data),
    onSuccess: (response) => {
      if (response.success && response.data) {
        // Invalidate trip lists
        queryClient.invalidateQueries({ queryKey: tripKeys.lists() });

        // Cache the new trip
        queryClient.setQueryData(
          tripKeys.detail(response.data.trip.id),
          response
        );
      }
    },
    onError: (error) => {
      console.error('Failed to create trip:', error);
    },
  });
};

/**
 * Update an existing trip
 */
export const useUpdateTrip = (tripId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateTripRequest) => tripsApi.updateTrip(tripId, data),
    onSuccess: (response) => {
      if (response.success && response.data) {
        // Update cached trip details
        queryClient.setQueryData(tripKeys.detail(tripId), response);

        // Invalidate trip lists to ensure consistency
        queryClient.invalidateQueries({ queryKey: tripKeys.lists() });
      }
    },
    onError: (error) => {
      console.error('Failed to update trip:', error);
    },
  });
};

/**
 * Delete a trip
 */
export const useDeleteTrip = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tripId: string) => tripsApi.deleteTrip(tripId),
    onSuccess: (response, tripId) => {
      if (response.success) {
        // Remove from cache
        queryClient.removeQueries({ queryKey: tripKeys.detail(tripId) });

        // Invalidate lists to update UI
        queryClient.invalidateQueries({ queryKey: tripKeys.lists() });
      }
    },
    onError: (error) => {
      console.error('Failed to delete trip:', error);
    },
  });
};

/**
 * Invite participants to a trip
 */
export const useInviteParticipants = (tripId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InviteParticipantRequest) =>
      tripsApi.inviteParticipants(tripId, data),
    onSuccess: (response) => {
      if (response.success) {
        // Invalidate trip details to refresh participant list
        queryClient.invalidateQueries({ queryKey: tripKeys.detail(tripId) });

        // Invalidate participants cache
        queryClient.invalidateQueries({
          queryKey: tripKeys.participants(tripId),
        });
      }
    },
    onError: (error) => {
      console.error('Failed to invite participants:', error);
    },
  });
};

/**
 * Update participant role
 */
export const useUpdateParticipant = (tripId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: string;
      data: UpdateParticipantRequest;
    }) => tripsApi.updateParticipant(tripId, userId, data),
    onSuccess: (response) => {
      if (response.success) {
        // Invalidate trip details to refresh participant list
        queryClient.invalidateQueries({ queryKey: tripKeys.detail(tripId) });

        // Invalidate participants cache
        queryClient.invalidateQueries({
          queryKey: tripKeys.participants(tripId),
        });
      }
    },
    onError: (error) => {
      console.error('Failed to update participant:', error);
    },
  });
};

/**
 * Remove participant from trip
 */
export const useRemoveParticipant = (tripId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => tripsApi.removeParticipant(tripId, userId),
    onSuccess: (response) => {
      if (response.success) {
        // Invalidate trip details to refresh participant list
        queryClient.invalidateQueries({ queryKey: tripKeys.detail(tripId) });

        // Invalidate participants cache
        queryClient.invalidateQueries({
          queryKey: tripKeys.participants(tripId),
        });
      }
    },
    onError: (error) => {
      console.error('Failed to remove participant:', error);
    },
  });
};

/**
 * Optimistic update helper for trip modifications
 */
export const useOptimisticTripUpdate = (tripId: string) => {
  const queryClient = useQueryClient();

  const updateTripOptimistically = (updater: (currentTrip: any) => any) => {
    queryClient.setQueryData(tripKeys.detail(tripId), (old: any) => {
      if (!old?.data?.trip) return old;

      return {
        ...old,
        data: {
          ...old.data,
          trip: updater(old.data.trip),
        },
      };
    });
  };

  return { updateTripOptimistically };
};
