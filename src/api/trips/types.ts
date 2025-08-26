/**
 * Trip Management API Types
 * Matching the Backend-3.1 Core Trip Management endpoints
 */

import type { ApiResponse, SearchParams } from '@/api/common/types';

// Enums
export type TripStatus = 'PLANNING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type ParticipantRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
export type ParticipantStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';

// Core Data Types
export interface TripSettings {
  visibility: 'public' | 'participants' | 'private';
  permissions: {
    canInvite: 'all' | 'admins' | 'owner';
    canEditItinerary: 'all' | 'admins' | 'owner';
    canAddExpenses: 'all' | 'admins';
    canSeeExpenses: 'all' | 'involved';
  };
  notifications: {
    dailyDigest: boolean;
    instantUpdates: boolean;
    reminderDaysBefore: number;
  };
}

export interface Trip {
  id: string;
  name: string;
  description?: string;
  startDate: string; // ISO date string
  endDate: string;   // ISO date string
  destination: string;
  coverImageUrl?: string;
  status: TripStatus;
  budgetAmount?: number;
  budgetCurrency: string;
  settings: TripSettings;
  ownerId: string;
  participants: TripParticipant[];
  itineraryItems?: ItineraryItem[];
  expenses?: Expense[];
  messages?: Message[];
  documents?: Document[];
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface TripParticipant {
  id: string;
  tripId: string;
  userId: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
  role: ParticipantRole;
  status: ParticipantStatus;
  joinedAt?: string;
  invitedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// Supporting entities (basic definitions)
export interface ItineraryItem {
  id: string;
  tripId: string;
  title: string;
  description?: string;
  startTime: string;
  endTime?: string;
  location?: string;
  order: number;
}

export interface Expense {
  id: string;
  tripId: string;
  title: string;
  amount: number;
  currency: string;
  category: string;
  paidBy: string;
  splitBetween: string[];
}

export interface Message {
  id: string;
  tripId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

export interface Document {
  id: string;
  tripId: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

// Request Types
export interface CreateTripRequest {
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  destination: string;
  coverImageUrl?: string;
  budgetAmount?: number;
  budgetCurrency?: string;
  settings?: Partial<TripSettings>;
  participantEmails?: string[];
}

export interface UpdateTripRequest extends Partial<CreateTripRequest> {
  version: number; // For optimistic locking
}

export interface TripListParams extends SearchParams {
  status?: TripStatus;
  upcoming?: boolean;
  role?: ParticipantRole;
}

export interface InviteParticipantRequest {
  emails: string[];
  role?: ParticipantRole;
  message?: string;
}

export interface UpdateParticipantRequest {
  role: ParticipantRole;
}

// Response Types
export interface TripListResponse {
  trips: Trip[];
  total: number;
  hasMore: boolean;
}

export interface TripDetailResponse {
  trip: Trip;
}

export interface CreateTripResponse extends TripDetailResponse {}

export interface UpdateTripResponse extends TripDetailResponse {}

export interface InviteParticipantResponse {
  message: string;
  invitations: {
    email: string;
    status: 'sent' | 'already_member' | 'failed';
    reason?: string;
  }[];
}

export interface UpdateParticipantResponse {
  participant: TripParticipant;
}

export interface DeleteTripResponse {
  message: string;
}

export interface RemoveParticipantResponse {
  message: string;
}

// API Response Wrappers
export type TripListApiResponse = ApiResponse<TripListResponse>;
export type TripDetailApiResponse = ApiResponse<TripDetailResponse>;
export type CreateTripApiResponse = ApiResponse<CreateTripResponse>;
export type UpdateTripApiResponse = ApiResponse<UpdateTripResponse>;
export type InviteParticipantApiResponse = ApiResponse<InviteParticipantResponse>;
export type UpdateParticipantApiResponse = ApiResponse<UpdateParticipantResponse>;
export type DeleteTripApiResponse = ApiResponse<DeleteTripResponse>;
export type RemoveParticipantApiResponse = ApiResponse<RemoveParticipantResponse>;