/**
 * Trip Management API Service
 * Direct API calls to backend trip management endpoints
 */

import { client } from '@/api/common/client';

import type {
  CreateTripApiResponse,
  CreateTripRequest,
  DeleteTripApiResponse,
  InviteParticipantApiResponse,
  InviteParticipantRequest,
  RemoveParticipantApiResponse,
  TripDetailApiResponse,
  TripListApiResponse,
  TripListParams,
  UpdateParticipantApiResponse,
  UpdateParticipantRequest,
  UpdateTripApiResponse,
  UpdateTripRequest,
} from './types';

const TRIPS_BASE = '/api/v2/trips';

/**
 * Get list of user trips with filtering and pagination
 */
export const getTripList = async (
  params?: TripListParams
): Promise<TripListApiResponse> => {
  const searchParams = new URLSearchParams();

  if (params?.page) searchParams.append('page', params.page.toString());
  if (params?.limit) searchParams.append('limit', params.limit.toString());
  if (params?.query) searchParams.append('query', params.query);
  if (params?.status) searchParams.append('status', params.status);
  if (params?.upcoming !== undefined)
    searchParams.append('upcoming', params.upcoming.toString());
  if (params?.role) searchParams.append('role', params.role);
  if (params?.sort) searchParams.append('sort', params.sort);
  if (params?.order) searchParams.append('order', params.order);

  const queryString = searchParams.toString();
  const url = queryString ? `${TRIPS_BASE}?${queryString}` : TRIPS_BASE;

  const response = await client.get<TripListApiResponse>(url);
  return response.data;
};

/**
 * Get detailed trip information by ID
 */
export const getTripById = async (
  tripId: string
): Promise<TripDetailApiResponse> => {
  const response = await client.get<TripDetailApiResponse>(
    `${TRIPS_BASE}/${tripId}`
  );
  return response.data;
};

/**
 * Create a new trip
 */
export const createTrip = async (
  data: CreateTripRequest
): Promise<CreateTripApiResponse> => {
  const response = await client.post<CreateTripApiResponse>(TRIPS_BASE, data);
  return response.data;
};

/**
 * Update an existing trip
 */
export const updateTrip = async (
  tripId: string,
  data: UpdateTripRequest
): Promise<UpdateTripApiResponse> => {
  const response = await client.put<UpdateTripApiResponse>(
    `${TRIPS_BASE}/${tripId}`,
    data
  );
  return response.data;
};

/**
 * Delete a trip (soft delete)
 */
export const deleteTrip = async (
  tripId: string
): Promise<DeleteTripApiResponse> => {
  const response = await client.delete<DeleteTripApiResponse>(
    `${TRIPS_BASE}/${tripId}`
  );
  return response.data;
};

/**
 * Invite participants to a trip
 */
export const inviteParticipants = async (
  tripId: string,
  data: InviteParticipantRequest
): Promise<InviteParticipantApiResponse> => {
  const response = await client.post<InviteParticipantApiResponse>(
    `${TRIPS_BASE}/${tripId}/participants`,
    data
  );
  return response.data;
};

/**
 * Update participant role
 */
export const updateParticipant = async (
  tripId: string,
  userId: string,
  data: UpdateParticipantRequest
): Promise<UpdateParticipantApiResponse> => {
  const response = await client.put<UpdateParticipantApiResponse>(
    `${TRIPS_BASE}/${tripId}/participants/${userId}`,
    data
  );
  return response.data;
};

/**
 * Remove participant from trip
 */
export const removeParticipant = async (
  tripId: string,
  userId: string
): Promise<RemoveParticipantApiResponse> => {
  const response = await client.delete<RemoveParticipantApiResponse>(
    `${TRIPS_BASE}/${tripId}/participants/${userId}`
  );
  return response.data;
};
