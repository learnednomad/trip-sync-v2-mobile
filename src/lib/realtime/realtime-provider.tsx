/**
 * Real-time Provider
 * Global real-time connection management for the app
 */

import React, { createContext, useContext, useEffect } from 'react';

import { useAuth } from '@/lib/auth';

import { useRealtimeConnection } from './use-realtime';
import type { ConnectionStatus } from './types';

interface RealtimeContextType {
  status: ConnectionStatus;
  error: Error | null;
  isConnected: boolean;
  isConnecting: boolean;
  isReconnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const useRealtimeContext = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtimeContext must be used within a RealtimeProvider');
  }
  return context;
};

interface RealtimeProviderProps {
  children: React.ReactNode;
}

/**
 * Real-time Provider Component
 * Manages global WebSocket connection and provides context to children
 */
export const RealtimeProvider: React.FC<RealtimeProviderProps> = ({ children }) => {
  const { status: authStatus } = useAuth();
  const realtimeConnection = useRealtimeConnection();

  // Log connection status changes in development
  useEffect(() => {
    if (__DEV__) {
      console.log('[RealtimeProvider] Status:', realtimeConnection.status);
      if (realtimeConnection.error) {
        console.error('[RealtimeProvider] Error:', realtimeConnection.error);
      }
    }
  }, [realtimeConnection.status, realtimeConnection.error]);

  // Auto-reconnect on authentication changes
  useEffect(() => {
    if (authStatus === 'signIn' && realtimeConnection.status === 'disconnected') {
      realtimeConnection.connect().catch((error) => {
        console.error('[RealtimeProvider] Failed to connect:', error);
      });
    }
  }, [authStatus, realtimeConnection.status, realtimeConnection.connect]);

  return (
    <RealtimeContext.Provider value={realtimeConnection}>
      {children}
    </RealtimeContext.Provider>
  );
};