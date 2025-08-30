/**
 * API-based Real-time Service
 * HTTP polling and REST API integration for real-time functionality
 * Replaces WebSocket service for backend integration
 */

import { Env } from '@env';

import { client } from '@/api/common/client';
import { getToken } from '@/lib/auth/utils';

import type {
  ConnectionHandler,
  ConnectionStatus,
  ErrorHandler,
  EventHandler,
  EventSubscription,
  RealtimeAuth,
  RealtimeConfig,
  RealtimeEvent,
  RealtimeEventType,
  RealtimeService,
  TripSubscription,
} from './types';

class ApiRealtimeService implements RealtimeService {
  private status: ConnectionStatus = 'disconnected';
  private subscriptions = new Map<string, EventSubscription>();
  private tripSubscriptions = new Map<string, TripSubscription>();
  private connectionHandlers: ConnectionHandler[] = [];
  private errorHandlers: ErrorHandler[] = [];
  private pollingIntervals = new Map<string, NodeJS.Timeout>();
  private config: RealtimeConfig;
  private auth: RealtimeAuth | null = null;
  private activityCursors = new Map<string, string>();

  constructor(config?: Partial<RealtimeConfig>) {
    this.config = {
      url: Env.API_URL,
      reconnectAttempts: 5,
      reconnectDelay: 5000, // 5 seconds for polling
      timeout: 10000,
      debug: __DEV__,
      ...config,
    };
  }

  private log(...args: any[]) {
    if (this.config.debug) {
      console.log('[ApiRealtime]', ...args);
    }
  }

  private updateStatus(status: ConnectionStatus) {
    if (this.status !== status) {
      this.status = status;
      this.log('Status changed:', status);
      this.connectionHandlers.forEach((handler) => handler(status));
    }
  }

  private handleError(error: Error) {
    this.log('Error:', error);
    this.errorHandlers.forEach((handler) => handler(error));
  }

  private async authenticate(): Promise<boolean> {
    try {
      const tokenData = getToken();
      if (!tokenData?.access) {
        this.log('No auth token available');
        return false;
      }

      this.auth = {
        token: tokenData.access,
        userId: '', // Will be extracted from JWT
        refreshToken: tokenData.refresh,
      };

      // Test authentication with a simple API call
      const response = await client.get('/api/v2/realtime/status');
      if (response.data.success) {
        this.log('Authentication successful');
        return true;
      }
    } catch (error) {
      this.log('Authentication failed:', error);
      this.handleError(new Error('Authentication failed'));
    }
    return false;
  }

  private async subscribeToTripUpdates(tripId: string) {
    try {
      // Subscribe to trip updates via REST API
      await client.post('/api/v2/realtime/subscribe', { tripId });
      this.log('Subscribed to trip updates:', tripId);

      // Start polling for presence updates
      this.startPresencePolling(tripId);

      // Start polling for activity feed
      this.startActivityPolling(tripId);
    } catch (error) {
      this.log('Failed to subscribe to trip updates:', error);
      throw error;
    }
  }

  private async unsubscribeFromTripUpdates(tripId: string) {
    try {
      // Unsubscribe from trip updates via REST API
      await client.post('/api/v2/realtime/unsubscribe', { tripId });
      this.log('Unsubscribed from trip updates:', tripId);

      // Stop polling
      this.stopPolling(tripId);
    } catch (error) {
      this.log('Failed to unsubscribe from trip updates:', error);
    }
  }

  private startPresencePolling(tripId: string) {
    const intervalKey = `presence-${tripId}`;

    // Clear existing interval
    if (this.pollingIntervals.has(intervalKey)) {
      clearInterval(this.pollingIntervals.get(intervalKey)!);
    }

    // Poll for presence updates every 10 seconds
    const interval = setInterval(async () => {
      try {
        const response = await client.get(
          `/api/v2/realtime/trips/${tripId}/presence`
        );

        if (response.data.success && response.data.data) {
          const { presence, totalOnline } = response.data.data;

          // Emit presence events
          this.dispatchEvent({
            type: 'user:presence_update',
            data: { presence, totalOnline },
            tripId,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        this.log('Presence polling error:', error);
      }
    }, 10000);

    this.pollingIntervals.set(
      intervalKey,
      interval as unknown as NodeJS.Timeout
    );
  }

  private startActivityPolling(tripId: string) {
    const intervalKey = `activity-${tripId}`;

    // Clear existing interval
    if (this.pollingIntervals.has(intervalKey)) {
      clearInterval(this.pollingIntervals.get(intervalKey)!);
    }

    // Poll for activity updates every 5 seconds
    const interval = setInterval(async () => {
      try {
        const cursor = this.activityCursors.get(tripId);
        const url = cursor
          ? `/api/v2/realtime/trips/${tripId}/activity?cursor=${cursor}&limit=20`
          : `/api/v2/realtime/trips/${tripId}/activity?limit=20`;

        const response = await client.get(url);

        if (response.data.success && response.data.data) {
          const { activities, nextCursor } = response.data.data;

          if (activities.length > 0) {
            // Update cursor for next poll
            if (nextCursor) {
              this.activityCursors.set(tripId, nextCursor);
            }

            // Emit activity events
            activities.forEach((activity: any) => {
              this.dispatchEvent({
                type: 'trip:activity',
                data: activity,
                tripId,
                timestamp: activity.timestamp,
              });
            });
          }
        }
      } catch (error) {
        this.log('Activity polling error:', error);
      }
    }, 5000);

    this.pollingIntervals.set(
      intervalKey,
      interval as unknown as NodeJS.Timeout
    );
  }

  private stopPolling(tripId: string) {
    const presenceKey = `presence-${tripId}`;
    const activityKey = `activity-${tripId}`;

    if (this.pollingIntervals.has(presenceKey)) {
      clearInterval(this.pollingIntervals.get(presenceKey)!);
      this.pollingIntervals.delete(presenceKey);
    }

    if (this.pollingIntervals.has(activityKey)) {
      clearInterval(this.pollingIntervals.get(activityKey)!);
      this.pollingIntervals.delete(activityKey);
    }

    // Clear activity cursor
    this.activityCursors.delete(tripId);
  }

  private dispatchEvent(event: RealtimeEvent) {
    // Find matching subscriptions
    const matchingSubscriptions = Array.from(
      this.subscriptions.values()
    ).filter((subscription) => {
      const typeMatches = subscription.eventType === event.type;
      const tripMatches =
        !subscription.tripId || subscription.tripId === event.tripId;
      return typeMatches && tripMatches;
    });

    // Call handlers
    matchingSubscriptions.forEach((subscription) => {
      try {
        subscription.handler(event);
      } catch (error) {
        this.log('Error in event handler:', error);
        this.handleError(error as Error);
      }
    });
  }

  // Public Interface
  async connect(): Promise<void> {
    if (this.status === 'connected' || this.status === 'connecting') {
      return;
    }

    this.updateStatus('connecting');
    this.log('Connecting to API realtime service...');

    try {
      const authenticated = await this.authenticate();
      if (authenticated) {
        this.updateStatus('connected');
        this.log('Connected to API realtime service');
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      this.updateStatus('error');
      throw error;
    }
  }

  disconnect(): void {
    this.log('Disconnecting...');

    // Stop all polling
    this.pollingIntervals.forEach((interval) => clearInterval(interval));
    this.pollingIntervals.clear();

    // Clear subscriptions
    this.subscriptions.clear();
    this.tripSubscriptions.clear();
    this.activityCursors.clear();

    this.updateStatus('disconnected');
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  on<T>(
    eventType: RealtimeEventType,
    handler: EventHandler<T>,
    tripId?: string
  ): EventSubscription {
    const id = `${eventType}_${tripId || 'global'}_${Date.now()}_${Math.random()}`;

    const subscription: EventSubscription = {
      id,
      eventType,
      handler,
      tripId,
      unsubscribe: () => this.off(id),
    };

    this.subscriptions.set(id, subscription);
    this.log('Added subscription:', id, eventType, tripId);

    return subscription;
  }

  off(subscriptionId: string): void {
    if (this.subscriptions.has(subscriptionId)) {
      this.subscriptions.delete(subscriptionId);
      this.log('Removed subscription:', subscriptionId);
    }
  }

  emit<T>(eventType: RealtimeEventType, data: T, tripId?: string): void {
    // For API-based realtime, we emit via REST endpoints
    this.log('Emitting event:', eventType, data, tripId);

    // Handle specific event types
    if (eventType === 'typing:start' && tripId) {
      // Could implement typing indicators via presence API
      client
        .put('/api/v2/realtime/presence', {
          tripId,
          status: 'online',
          metadata: { typing: true },
        })
        .catch((error) => this.log('Failed to emit typing start:', error));
    }

    if (eventType === 'typing:stop' && tripId) {
      client
        .put('/api/v2/realtime/presence', {
          tripId,
          status: 'online',
          metadata: { typing: false },
        })
        .catch((error) => this.log('Failed to emit typing stop:', error));
    }
  }

  async joinTrip(tripId: string): Promise<TripSubscription> {
    this.log('Joining trip:', tripId);

    try {
      // Subscribe to trip updates
      await this.subscribeToTripUpdates(tripId);

      // Update presence to online
      await client.put('/api/v2/realtime/presence', {
        tripId,
        status: 'online',
        metadata: {
          device: 'mobile',
          joinedAt: new Date().toISOString(),
        },
      });

      const subscription: TripSubscription = {
        tripId,
        subscriptions: [],
        joinedAt: new Date().toISOString(),
        leave: () => this.leaveTrip(tripId),
      };

      this.tripSubscriptions.set(tripId, subscription);
      this.log('Joined trip:', tripId);

      return subscription;
    } catch (error) {
      this.log('Failed to join trip:', error);
      throw error;
    }
  }

  leaveTrip(tripId: string): void {
    const subscription = this.tripSubscriptions.get(tripId);
    if (!subscription) return;

    this.log('Leaving trip:', tripId);

    // Remove trip-specific subscriptions
    subscription.subscriptions.forEach((sub) => this.off(sub.id));

    // Unsubscribe from trip updates
    this.unsubscribeFromTripUpdates(tripId).catch((error) =>
      this.log('Error unsubscribing from trip:', error)
    );

    // Update presence to offline
    client
      .put('/api/v2/realtime/presence', {
        tripId,
        status: 'offline',
      })
      .catch((error) => this.log('Failed to update presence:', error));

    this.tripSubscriptions.delete(tripId);
    this.log('Left trip:', tripId);
  }

  onConnectionChange(handler: ConnectionHandler): () => void {
    this.connectionHandlers.push(handler);

    // Return unsubscribe function
    return () => {
      const index = this.connectionHandlers.indexOf(handler);
      if (index > -1) {
        this.connectionHandlers.splice(index, 1);
      }
    };
  }

  onError(handler: ErrorHandler): () => void {
    this.errorHandlers.push(handler);

    // Return unsubscribe function
    return () => {
      const index = this.errorHandlers.indexOf(handler);
      if (index > -1) {
        this.errorHandlers.splice(index, 1);
      }
    };
  }
}

// Export singleton instance
export const apiRealtimeService = new ApiRealtimeService();
export default apiRealtimeService;
