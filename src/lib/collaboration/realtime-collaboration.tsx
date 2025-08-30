/**
 * Real-time Collaboration System
 * Live timeline editing with participant presence and conflict resolution
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

import { useAuth } from '@/lib/auth';
import { useNetworkStatus } from '@/lib/offline/network-detector';

interface CollaborationEvent {
  type: 'cursor-move' | 'activity-edit' | 'presence-update' | 'conflict-detected';
  participantId: string;
  tripId: string;
  data: any;
  timestamp: string;
}

interface ParticipantPresence {
  id: string;
  userId: string;
  name: string;
  avatar?: string;
  status: 'online' | 'away' | 'editing' | 'offline';
  lastSeen: string;
  currentActivity?: string; // Activity being edited
  cursor?: {
    x: number;
    y: number;
    activityId?: string;
  };
}

interface CollaborationState {
  isConnected: boolean;
  participants: ParticipantPresence[];
  activeEditors: string[]; // Activity IDs being edited
  conflicts: CollaborationConflict[];
  lastEventTime: string;
}

interface CollaborationConflict {
  id: string;
  activityId: string;
  participants: string[];
  conflictType: 'simultaneous_edit' | 'version_mismatch' | 'permission_conflict';
  detectedAt: string;
  resolved: boolean;
}

const CollaborationContext = createContext<{
  state: CollaborationState;
  actions: {
    joinTripCollaboration: (tripId: string) => void;
    leaveTripCollaboration: () => void;
    broadcastCursorMove: (position: { x: number; y: number }, activityId?: string) => void;
    startEditingActivity: (activityId: string) => void;
    endEditingActivity: (activityId: string) => void;
    broadcastActivityUpdate: (activityId: string, changes: any) => void;
    resolveConflict: (conflictId: string, resolution: 'accept' | 'reject' | 'merge') => void;
  };
} | null>(null);

/**
 * Real-time collaboration provider
 */
export const CollaborationProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const auth = useAuth.use.token();
  const networkStatus = useNetworkStatus();
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [state, setState] = useState<CollaborationState>({
    isConnected: false,
    participants: [],
    activeEditors: [],
    conflicts: [],
    lastEventTime: new Date().toISOString(),
  });

  // Initialize WebSocket connection
  useEffect(() => {
    if (networkStatus.isOnline && auth?.access) {
      const newSocket = io(process.env.EXPO_PUBLIC_WEBSOCKET_URL || 'ws://localhost:3001', {
        auth: {
          token: auth.access,
        },
        transports: ['websocket'],
      });

      newSocket.on('connect', () => {
        console.log('🔗 Collaboration WebSocket connected');
        setState(prev => ({ ...prev, isConnected: true }));
      });

      newSocket.on('disconnect', () => {
        console.log('📡 Collaboration WebSocket disconnected');
        setState(prev => ({ 
          ...prev, 
          isConnected: false,
          participants: [], // Clear participants on disconnect
        }));
      });

      // Collaboration event handlers
      newSocket.on('participant-join', (data: { participant: ParticipantPresence }) => {
        setState(prev => ({
          ...prev,
          participants: [...prev.participants.filter(p => p.id !== data.participant.id), data.participant],
        }));
      });

      newSocket.on('participant-leave', (data: { participantId: string }) => {
        setState(prev => ({
          ...prev,
          participants: prev.participants.filter(p => p.id !== data.participantId),
        }));
      });

      newSocket.on('presence-update', (data: { participantId: string; status: ParticipantPresence['status']; cursor?: any }) => {
        setState(prev => ({
          ...prev,
          participants: prev.participants.map(p => 
            p.id === data.participantId 
              ? { ...p, status: data.status, cursor: data.cursor, lastSeen: new Date().toISOString() }
              : p
          ),
        }));
      });

      newSocket.on('activity-edit-start', (data: { participantId: string; activityId: string }) => {
        setState(prev => ({
          ...prev,
          activeEditors: [...prev.activeEditors.filter(id => id !== data.activityId), data.activityId],
        }));
      });

      newSocket.on('activity-edit-end', (data: { participantId: string; activityId: string }) => {
        setState(prev => ({
          ...prev,
          activeEditors: prev.activeEditors.filter(id => id !== data.activityId),
        }));
      });

      newSocket.on('conflict-detected', (data: CollaborationConflict) => {
        setState(prev => ({
          ...prev,
          conflicts: [...prev.conflicts, data],
        }));
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [networkStatus.isOnline, auth?.access]);

  const actions = {
    joinTripCollaboration: (tripId: string) => {
      socket?.emit('join-trip-collaboration', { tripId });
    },

    leaveTripCollaboration: () => {
      socket?.emit('leave-trip-collaboration');
    },

    broadcastCursorMove: (position: { x: number; y: number }, activityId?: string) => {
      socket?.emit('cursor-move', { position, activityId });
    },

    startEditingActivity: (activityId: string) => {
      socket?.emit('activity-edit-start', { activityId });
    },

    endEditingActivity: (activityId: string) => {
      socket?.emit('activity-edit-end', { activityId });
    },

    broadcastActivityUpdate: (activityId: string, changes: any) => {
      socket?.emit('activity-update', { activityId, changes });
    },

    resolveConflict: (conflictId: string, resolution: 'accept' | 'reject' | 'merge') => {
      socket?.emit('resolve-conflict', { conflictId, resolution });
      
      // Remove conflict from local state
      setState(prev => ({
        ...prev,
        conflicts: prev.conflicts.filter(c => c.id !== conflictId),
      }));
    },
  };

  return (
    <CollaborationContext.Provider value={{ state, actions }}>
      {children}
    </CollaborationContext.Provider>
  );
};

/**
 * Hook for accessing collaboration features
 */
export const useCollaboration = () => {
  const context = useContext(CollaborationContext);
  
  if (!context) {
    throw new Error('useCollaboration must be used within a CollaborationProvider');
  }
  
  return context;
};

/**
 * Hook for participant presence management
 */
export const useParticipantPresence = (tripId: string) => {
  const { state, actions } = useCollaboration();
  
  useEffect(() => {
    if (tripId) {
      actions.joinTripCollaboration(tripId);
      
      return () => {
        actions.leaveTripCollaboration();
      };
    }
  }, [tripId, actions]);

  return {
    participants: state.participants,
    isConnected: state.isConnected,
    onlineCount: state.participants.filter(p => p.status === 'online').length,
    editingCount: state.participants.filter(p => p.status === 'editing').length,
  };
};

/**
 * Hook for activity editing collaboration
 */
export const useActivityCollaboration = (activityId: string) => {
  const { state, actions } = useCollaboration();
  
  const isBeingEdited = state.activeEditors.includes(activityId);
  const editingParticipants = state.participants.filter(p => p.currentActivity === activityId);
  
  const startEditing = () => {
    actions.startEditingActivity(activityId);
  };
  
  const endEditing = () => {
    actions.endEditingActivity(activityId);
  };
  
  const broadcastChanges = (changes: any) => {
    actions.broadcastActivityUpdate(activityId, changes);
  };

  return {
    isBeingEdited,
    editingParticipants,
    canEdit: !isBeingEdited || editingParticipants.length === 0,
    startEditing,
    endEditing,
    broadcastChanges,
  };
};