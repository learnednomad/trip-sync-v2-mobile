/**
 * Presence Indicators
 * Shows participant presence and live editing status
 */

import React from 'react';
import { View } from 'react-native';

import { 
  Avatar, 
  AvatarGroup, 
  Badge, 
  Text 
} from '@/components/ui';
import { useParticipantPresence } from '@/lib/collaboration/realtime-collaboration';

interface PresenceIndicatorsProps {
  tripId: string;
  maxVisible?: number;
  className?: string;
}

/**
 * Participant presence indicators for navigation/header
 */
export const PresenceIndicators: React.FC<PresenceIndicatorsProps> = ({
  tripId,
  maxVisible = 4,
  className = '',
}) => {
  const { participants, isConnected, onlineCount } = useParticipantPresence(tripId);

  if (!isConnected || participants.length === 0) {
    return null;
  }

  const onlineParticipants = participants.filter(p => p.status !== 'offline');

  return (
    <View className={`flex-row items-center ${className}`}>
      <AvatarGroup max={maxVisible} spacing="tight">
        {onlineParticipants.map(participant => (
          <Avatar
            key={participant.id}
            src={participant.avatar}
            name={participant.name}
            size="sm"
            online={participant.status === 'online' || participant.status === 'editing'}
            border={true}
          />
        ))}
      </AvatarGroup>
      
      {onlineCount > 0 && (
        <Badge 
          variant="success" 
          size="sm" 
          className="ml-2"
        >
          {onlineCount} online
        </Badge>
      )}
    </View>
  );
};

/**
 * Live editing indicator for activities
 */
export const LiveEditingIndicator: React.FC<{
  activityId: string;
  className?: string;
}> = ({ activityId, className = '' }) => {
  const { participants } = useParticipantPresence(''); // Would get from context
  
  const editingParticipants = participants.filter(p => 
    p.currentActivity === activityId && p.status === 'editing'
  );

  if (editingParticipants.length === 0) return null;

  return (
    <View className={`flex-row items-center ${className}`}>
      <View className="flex-row -space-x-1">
        {editingParticipants.slice(0, 3).map(participant => (
          <Avatar
            key={participant.id}
            src={participant.avatar}
            name={participant.name}
            size="xs"
            variant="primary"
            border={true}
          />
        ))}
      </View>
      
      <Text className="ml-2 text-xs text-primary-600 dark:text-primary-400 animate-pulse">
        {editingParticipants.length === 1 
          ? `${editingParticipants[0].name} is editing...`
          : `${editingParticipants.length} people editing...`
        }
      </Text>
    </View>
  );
};

/**
 * Typing indicator for real-time text editing
 */
export const TypingIndicator: React.FC<{
  participants: string[];
  className?: string;
}> = ({ participants, className = '' }) => {
  if (participants.length === 0) return null;

  return (
    <View className={`flex-row items-center ${className}`}>
      <View className="flex-row space-x-1">
        {[0, 1, 2].map(i => (
          <View 
            key={i}
            className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"
            style={{
              animationDelay: `${i * 200}ms`,
            }}
          />
        ))}
      </View>
      
      <Text className="ml-2 text-xs text-neutral-600 dark:text-neutral-400">
        {participants.length === 1 
          ? `${participants[0]} is typing...`
          : `${participants.length} people are typing...`
        }
      </Text>
    </View>
  );
};

/**
 * Live cursor overlay for collaborative editing
 */
export const LiveCursors: React.FC<{
  participantCursors: Array<{
    participantId: string;
    name: string;
    position: { x: number; y: number };
    color: string;
  }>;
}> = ({ participantCursors }) => {
  return (
    <View className="absolute inset-0 pointer-events-none">
      {participantCursors.map(cursor => (
        <View
          key={cursor.participantId}
          style={{
            position: 'absolute',
            left: cursor.position.x,
            top: cursor.position.y,
            zIndex: 1000,
          }}
        >
          {/* Cursor pointer */}
          <View 
            className="w-4 h-4 rounded-full border-2 border-white"
            style={{ backgroundColor: cursor.color }}
          />
          
          {/* Participant name label */}
          <View 
            className="mt-1 px-2 py-1 rounded-md"
            style={{ backgroundColor: cursor.color }}
          >
            <Text className="text-xs text-white font-medium">
              {cursor.name}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
};

/**
 * Conflict resolution notification
 */
export const ConflictNotification: React.FC<{
  conflict: CollaborationConflict;
  onResolve: (resolution: 'accept' | 'reject' | 'merge') => void;
  onDismiss: () => void;
}> = ({ conflict, onResolve, onDismiss }) => {
  return (
    <View className="m-4 p-4 bg-warning-50 dark:bg-warning-900 border border-warning-200 dark:border-warning-700 rounded-lg">
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1">
          <Text className="text-sm font-medium text-warning-800 dark:text-warning-200 mb-1">
            Editing Conflict Detected
          </Text>
          <Text className="text-xs text-warning-700 dark:text-warning-300">
            Multiple people are editing the same activity
          </Text>
        </View>
        
        <Button
          variant="ghost"
          size="sm"
          onPress={onDismiss}
          className="p-1"
        >
          <Text className="text-warning-600 dark:text-warning-400">✕</Text>
        </Button>
      </View>
      
      <View className="flex-row space-x-2">
        <Button
          variant="outline"
          size="sm"
          onPress={() => onResolve('accept')}
          className="flex-1 border-warning-400"
        >
          <Text className="text-warning-700 dark:text-warning-300 text-xs">
            Accept Changes
          </Text>
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onPress={() => onResolve('merge')}
          className="flex-1 border-warning-400"
        >
          <Text className="text-warning-700 dark:text-warning-300 text-xs">
            Merge Both
          </Text>
        </Button>
      </View>
    </View>
  );
};