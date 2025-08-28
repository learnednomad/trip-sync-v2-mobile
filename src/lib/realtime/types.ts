/**
 * Real-time Communication Types
 * WebSocket/Socket.io integration for live updates
 */

// Event Types
export type RealtimeEventType =
  | 'trip:updated'
  | 'trip:deleted'
  | 'trip:participant_added'
  | 'trip:participant_removed'
  | 'trip:participant_updated'
  | 'itinerary:updated'
  | 'expense:added'
  | 'expense:updated'
  | 'expense:deleted'
  | 'message:new'
  | 'document:added'
  | 'document:removed'
  | 'user:online'
  | 'user:offline'
  | 'typing:start'
  | 'typing:stop';

// Event Data Interfaces
export interface TripUpdatedEvent {
  tripId: string;
  updatedBy: string;
  changes: Partial<any>; // Trip updates
  version: number;
  timestamp: string;
}

export interface TripDeletedEvent {
  tripId: string;
  deletedBy: string;
  timestamp: string;
}

export interface ParticipantEvent {
  tripId: string;
  participantId: string;
  userId: string;
  role?: string;
  status?: string;
  updatedBy: string;
  timestamp: string;
}

export interface MessageEvent {
  tripId: string;
  messageId: string;
  content: string;
  senderId: string;
  senderName: string;
  timestamp: string;
}

export interface TypingEvent {
  tripId: string;
  userId: string;
  userName: string;
}

export interface UserPresenceEvent {
  userId: string;
  userName: string;
  status: 'online' | 'offline';
  lastSeen?: string;
}

// Generic Real-time Event
export interface RealtimeEvent<T = any> {
  type: RealtimeEventType;
  data: T;
  tripId?: string;
  userId?: string;
  timestamp: string;
  requestId?: string;
}

// Connection States
export type ConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'reconnecting'
  | 'error';

// Real-time Service Configuration
export interface RealtimeConfig {
  url: string;
  reconnectAttempts: number;
  reconnectDelay: number;
  timeout: number;
  debug: boolean;
}

// Event Handlers
export type EventHandler<T = any> = (event: RealtimeEvent<T>) => void;
export type ConnectionHandler = (status: ConnectionStatus) => void;
export type ErrorHandler = (error: Error) => void;

// Subscription Management
export interface EventSubscription {
  id: string;
  eventType: RealtimeEventType;
  handler: EventHandler;
  tripId?: string;
  unsubscribe: () => void;
}

export interface TripSubscription {
  tripId: string;
  subscriptions: EventSubscription[];
  joinedAt: string;
  leave: () => void;
}

// Real-time Service Interface
export interface RealtimeService {
  // Connection Management
  connect(): Promise<void>;
  disconnect(): void;
  getStatus(): ConnectionStatus;

  // Event Management
  on<T>(
    eventType: RealtimeEventType,
    handler: EventHandler<T>,
    tripId?: string
  ): EventSubscription;
  off(subscriptionId: string): void;
  emit<T>(eventType: RealtimeEventType, data: T, tripId?: string): void;

  // Trip-specific subscriptions
  joinTrip(tripId: string): Promise<TripSubscription>;
  leaveTrip(tripId: string): void;

  // Connection status
  onConnectionChange(handler: ConnectionHandler): () => void;
  onError(handler: ErrorHandler): () => void;
}

// Authentication for WebSocket
export interface RealtimeAuth {
  token: string;
  userId: string;
  refreshToken?: string;
}
