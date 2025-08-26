/**
 * Real-time React Hooks
 * React integration for WebSocket real-time communication
 */

import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/lib/auth';
import { tripKeys } from '@/api/trips';

import realtimeService from './websocket-service';
import type {
  ConnectionStatus,
  EventHandler,
  EventSubscription,
  RealtimeEventType,
  TripSubscription,
} from './types';

/**
 * Hook to manage real-time connection status
 */
export const useRealtimeConnection = () => {
  const [status, setStatus] = useState<ConnectionStatus>(realtimeService.getStatus());
  const [error, setError] = useState<Error | null>(null);
  const { token, status: authStatus } = useAuth();

  useEffect(() => {
    // Subscribe to connection changes
    const unsubscribeConnection = realtimeService.onConnectionChange(setStatus);
    const unsubscribeError = realtimeService.onError(setError);

    // Auto-connect when authenticated
    if (authStatus === 'signIn' && token?.access) {
      realtimeService.connect().catch(setError);
    }

    // Disconnect when not authenticated
    if (authStatus === 'signOut') {
      realtimeService.disconnect();
    }

    return () => {
      unsubscribeConnection();
      unsubscribeError();
    };
  }, [authStatus, token]);

  const connect = async () => {
    try {
      setError(null);
      await realtimeService.connect();
    } catch (err) {
      setError(err as Error);
    }
  };

  const disconnect = () => {
    realtimeService.disconnect();
  };

  return {
    status,
    error,
    isConnected: status === 'connected',
    isConnecting: status === 'connecting',
    isReconnecting: status === 'reconnecting',
    connect,
    disconnect,
  };
};

/**
 * Hook to subscribe to specific real-time events
 */
export const useRealtimeEvent = <T = any>(
  eventType: RealtimeEventType,
  handler: EventHandler<T>,
  tripId?: string,
  options?: {
    enabled?: boolean;
  }
) => {
  const subscriptionRef = useRef<EventSubscription | null>(null);
  const enabled = options?.enabled ?? true;

  useEffect(() => {
    if (!enabled) return;

    subscriptionRef.current = realtimeService.on(eventType, handler, tripId);

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [eventType, handler, tripId, enabled]);

  return {
    unsubscribe: () => subscriptionRef.current?.unsubscribe(),
  };
};

/**
 * Hook to automatically sync trip data with real-time updates
 */
export const useTripRealtime = (tripId: string, options?: { enabled?: boolean }) => {
  const queryClient = useQueryClient();
  const [tripSubscription, setTripSubscription] = useState<TripSubscription | null>(null);
  const enabled = options?.enabled ?? true;

  // Join trip room
  useEffect(() => {
    if (!enabled || !tripId) return;

    let subscription: TripSubscription;

    const joinTrip = async () => {
      try {
        subscription = await realtimeService.joinTrip(tripId);
        setTripSubscription(subscription);
      } catch (error) {
        console.error('Failed to join trip realtime:', error);
      }
    };

    joinTrip();

    return () => {
      if (subscription) {
        subscription.leave();
        setTripSubscription(null);
      }
    };
  }, [tripId, enabled]);

  // Handle trip updates
  useRealtimeEvent(
    'trip:updated',
    (event) => {
      console.log('Trip updated:', event);
      // Invalidate and refetch trip data
      queryClient.invalidateQueries({ queryKey: tripKeys.detail(tripId) });
    },
    tripId,
    { enabled }
  );

  // Handle trip deletion
  useRealtimeEvent(
    'trip:deleted',
    (event) => {
      console.log('Trip deleted:', event);
      // Remove from cache and invalidate lists
      queryClient.removeQueries({ queryKey: tripKeys.detail(tripId) });
      queryClient.invalidateQueries({ queryKey: tripKeys.lists() });
    },
    tripId,
    { enabled }
  );

  // Handle participant changes
  useRealtimeEvent(
    'trip:participant_added',
    (event) => {
      console.log('Participant added:', event);
      queryClient.invalidateQueries({ queryKey: tripKeys.detail(tripId) });
    },
    tripId,
    { enabled }
  );

  useRealtimeEvent(
    'trip:participant_removed',
    (event) => {
      console.log('Participant removed:', event);
      queryClient.invalidateQueries({ queryKey: tripKeys.detail(tripId) });
    },
    tripId,
    { enabled }
  );

  useRealtimeEvent(
    'trip:participant_updated',
    (event) => {
      console.log('Participant updated:', event);
      queryClient.invalidateQueries({ queryKey: tripKeys.detail(tripId) });
    },
    tripId,
    { enabled }
  );

  return {
    isJoined: !!tripSubscription,
    leave: () => tripSubscription?.leave(),
  };
};

/**
 * Hook to handle real-time messages
 */
export const useTripMessages = (tripId: string, options?: { enabled?: boolean }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const enabled = options?.enabled ?? true;

  // Handle new messages
  useRealtimeEvent(
    'message:new',
    (event) => {
      setMessages(prev => [...prev, event.data]);
    },
    tripId,
    { enabled }
  );

  // Handle typing indicators
  useRealtimeEvent(
    'typing:start',
    (event) => {
      setTypingUsers(prev => new Set(prev).add(event.data.userName));
    },
    tripId,
    { enabled }
  );

  useRealtimeEvent(
    'typing:stop',
    (event) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(event.data.userName);
        return newSet;
      });
    },
    tripId,
    { enabled }
  );

  const sendMessage = (content: string) => {
    realtimeService.emit('message:new', { content }, tripId);
  };

  const startTyping = () => {
    realtimeService.emit('typing:start', { tripId }, tripId);
  };

  const stopTyping = () => {
    realtimeService.emit('typing:stop', { tripId }, tripId);
  };

  return {
    messages,
    typingUsers: Array.from(typingUsers),
    sendMessage,
    startTyping,
    stopTyping,
  };
};

/**
 * Hook to track user presence
 */
export const useUserPresence = (tripId?: string) => {
  const [onlineUsers, setOnlineUsers] = useState<Map<string, any>>(new Map());

  useRealtimeEvent(
    'user:online',
    (event) => {
      setOnlineUsers(prev => new Map(prev).set(event.data.userId, event.data));
    },
    tripId
  );

  useRealtimeEvent(
    'user:offline',
    (event) => {
      setOnlineUsers(prev => {
        const newMap = new Map(prev);
        newMap.delete(event.data.userId);
        return newMap;
      });
    },
    tripId
  );

  return {
    onlineUsers: Array.from(onlineUsers.values()),
    isUserOnline: (userId: string) => onlineUsers.has(userId),
  };
};

/**
 * Hook to emit real-time events
 */
export const useRealtimeEmit = () => {
  const emit = <T>(eventType: RealtimeEventType, data: T, tripId?: string) => {
    realtimeService.emit(eventType, data, tripId);
  };

  return { emit };
};