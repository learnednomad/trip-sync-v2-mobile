/**
 * WebSocket Real-time Service
 * Native WebSocket implementation for real-time communication
 * TODO: Replace with Socket.io client when dependency is added
 */

import { Env } from '@env';

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

class WebSocketRealtimeService implements RealtimeService {
  private ws: WebSocket | null = null;
  private status: ConnectionStatus = 'disconnected';
  private subscriptions = new Map<string, EventSubscription>();
  private tripSubscriptions = new Map<string, TripSubscription>();
  private connectionHandlers: ConnectionHandler[] = [];
  private errorHandlers: ErrorHandler[] = [];
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private config: RealtimeConfig;
  private auth: RealtimeAuth | null = null;

  constructor(config?: Partial<RealtimeConfig>) {
    this.config = {
      url: this.getWebSocketUrl(),
      reconnectAttempts: 5,
      reconnectDelay: 1000,
      timeout: 10000,
      debug: __DEV__,
      ...config,
    };
  }

  private getWebSocketUrl(): string {
    // Convert HTTP URL to WebSocket URL
    const apiUrl = Env.API_URL;
    const wsUrl = apiUrl.replace('http://', 'ws://').replace('https://', 'wss://');
    return `${wsUrl}/api/v2/realtime`;
  }

  private log(...args: any[]) {
    if (this.config.debug) {
      console.log('[WebSocket]', ...args);
    }
  }

  private updateStatus(status: ConnectionStatus) {
    if (this.status !== status) {
      this.status = status;
      this.log('Status changed:', status);
      this.connectionHandlers.forEach(handler => handler(status));
    }
  }

  private handleError(error: Error) {
    this.log('Error:', error);
    this.errorHandlers.forEach(handler => handler(error));
  }

  private setupEventListeners() {
    if (!this.ws) return;

    this.ws.onopen = () => {
      this.log('Connected to WebSocket');
      this.updateStatus('connected');
      this.reconnectAttempts = 0;
      
      // Authenticate if we have tokens
      this.authenticate();
    };

    this.ws.onclose = (event) => {
      this.log('WebSocket closed:', event.code, event.reason);
      this.updateStatus('disconnected');
      
      // Attempt reconnection if not manually closed
      if (event.code !== 1000) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (event) => {
      this.log('WebSocket error:', event);
      this.updateStatus('error');
      this.handleError(new Error('WebSocket connection error'));
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        this.log('Failed to parse message:', event.data);
        this.handleError(new Error('Invalid message format'));
      }
    };
  }

  private handleMessage(message: any) {
    this.log('Received message:', message);
    
    // Handle system messages
    if (message.type === 'system') {
      this.handleSystemMessage(message);
      return;
    }

    // Handle real-time events
    if (message.type && message.data) {
      const event: RealtimeEvent = {
        type: message.type,
        data: message.data,
        tripId: message.tripId,
        userId: message.userId,
        timestamp: message.timestamp || new Date().toISOString(),
        requestId: message.requestId,
      };

      this.dispatchEvent(event);
    }
  }

  private handleSystemMessage(message: any) {
    switch (message.event) {
      case 'authenticated':
        this.log('Authentication successful');
        break;
      case 'authentication_failed':
        this.log('Authentication failed:', message.reason);
        this.handleError(new Error('Authentication failed'));
        break;
      case 'trip_joined':
        this.log('Joined trip:', message.tripId);
        break;
      case 'trip_left':
        this.log('Left trip:', message.tripId);
        break;
      default:
        this.log('Unknown system message:', message);
    }
  }

  private dispatchEvent(event: RealtimeEvent) {
    // Find matching subscriptions
    const matchingSubscriptions = Array.from(this.subscriptions.values()).filter(
      (subscription) => {
        const typeMatches = subscription.eventType === event.type;
        const tripMatches = !subscription.tripId || subscription.tripId === event.tripId;
        return typeMatches && tripMatches;
      }
    );

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

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.config.reconnectAttempts) {
      this.log('Max reconnect attempts reached');
      this.updateStatus('error');
      return;
    }

    const delay = this.config.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;
    
    this.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
    this.updateStatus('reconnecting');
    
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private authenticate() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    // Get current auth token
    const tokenData = getToken();
    if (!tokenData?.access) {
      this.log('No auth token available');
      return;
    }

    this.auth = {
      token: tokenData.access,
      userId: '', // Will be set by server response
      refreshToken: tokenData.refresh,
    };

    // Send authentication message
    this.send({
      type: 'authenticate',
      token: this.auth.token,
      refreshToken: this.auth.refreshToken,
    });
  }

  private send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
      this.log('Sent message:', data);
    } else {
      this.log('Cannot send message - WebSocket not ready');
    }
  }

  // Public Interface
  async connect(): Promise<void> {
    if (this.status === 'connected' || this.status === 'connecting') {
      return;
    }

    this.updateStatus('connecting');
    this.log('Connecting to:', this.config.url);

    try {
      this.ws = new WebSocket(this.config.url);
      this.setupEventListeners();
      
      // Wait for connection or timeout
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, this.config.timeout);

        const onOpen = () => {
          clearTimeout(timeout);
          resolve();
        };

        const onError = (error: any) => {
          clearTimeout(timeout);
          reject(error);
        };

        this.ws!.addEventListener('open', onOpen, { once: true });
        this.ws!.addEventListener('error', onError, { once: true });
      });
    } catch (error) {
      this.updateStatus('error');
      throw error;
    }
  }

  disconnect(): void {
    this.log('Disconnecting...');
    
    // Clear reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Close WebSocket
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }

    // Clear subscriptions
    this.subscriptions.clear();
    this.tripSubscriptions.clear();
    
    this.updateStatus('disconnected');
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  on<T>(eventType: RealtimeEventType, handler: EventHandler<T>, tripId?: string): EventSubscription {
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
    this.send({
      type: eventType,
      data,
      tripId,
      timestamp: new Date().toISOString(),
    });
  }

  async joinTrip(tripId: string): Promise<TripSubscription> {
    // Send join message
    this.send({
      type: 'join_trip',
      tripId,
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
  }

  leaveTrip(tripId: string): void {
    const subscription = this.tripSubscriptions.get(tripId);
    if (!subscription) return;

    // Remove all trip-specific subscriptions
    subscription.subscriptions.forEach(sub => this.off(sub.id));

    // Send leave message
    this.send({
      type: 'leave_trip',
      tripId,
    });

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
export const realtimeService = new WebSocketRealtimeService();
export default realtimeService;