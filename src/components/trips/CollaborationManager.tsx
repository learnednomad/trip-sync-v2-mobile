/**
 * Collaboration Manager Component
 * Epic 2: Story 2.1 - Core Trip Management
 * Manage trip participants, roles, and permissions
 */

import React, { useState } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { 
  Users, UserPlus, MoreHorizontal, Crown, Shield, 
  Eye, Trash2, Mail, CheckCircle, XCircle, Clock 
} from '@/components/ui/icons';

import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import type { Trip, TripParticipant, ParticipantRole, ParticipantStatus } from '@/api/trips/types';

interface CollaborationManagerProps {
  trip: Trip;
  onInviteParticipants: () => void;
  onUpdateParticipantRole: (participantId: string, newRole: ParticipantRole) => void;
  onRemoveParticipant: (participantId: string) => void;
  onResendInvitation: (participantId: string) => void;
  currentUserId: string;
}

const roleOptions = [
  { label: 'Owner', value: 'OWNER' },
  { label: 'Admin', value: 'ADMIN' },
  { label: 'Member', value: 'MEMBER' },
  { label: 'Viewer', value: 'VIEWER' },
];

const getRoleIcon = (role: ParticipantRole) => {
  switch (role) {
    case 'OWNER':
      return <Crown width={14} height={14} color="#F59E0B" />;
    case 'ADMIN':
      return <Shield width={14} height={14} color="#3B82F6" />;
    case 'MEMBER':
      return <Users width={14} height={14} color="#10B981" />;
    case 'VIEWER':
      return <Eye width={14} height={14} color="#6B7280" />;
    default:
      return <Users width={14} height={14} color="#6B7280" />;
  }
};

const getStatusIcon = (status: ParticipantStatus) => {
  switch (status) {
    case 'ACCEPTED':
      return <CheckCircle width={16} height={16} color="#10B981" />;
    case 'PENDING':
      return <Clock width={16} height={16} color="#F59E0B" />;
    case 'DECLINED':
      return <XCircle width={16} height={16} color="#EF4444" />;
    default:
      return <Clock width={16} height={16} color="#6B7280" />;
  }
};

const getRoleColor = (role: ParticipantRole) => {
  switch (role) {
    case 'OWNER':
      return 'bg-yellow-100 text-yellow-800';
    case 'ADMIN':
      return 'bg-blue-100 text-blue-800';
    case 'MEMBER':
      return 'bg-green-100 text-green-800';
    case 'VIEWER':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusColor = (status: ParticipantStatus) => {
  switch (status) {
    case 'ACCEPTED':
      return 'bg-green-50 text-green-700';
    case 'PENDING':
      return 'bg-yellow-50 text-yellow-700';
    case 'DECLINED':
      return 'bg-red-50 text-red-700';
    default:
      return 'bg-gray-50 text-gray-700';
  }
};

export function CollaborationManager({
  trip,
  onInviteParticipants,
  onUpdateParticipantRole,
  onRemoveParticipant,
  onResendInvitation,
  currentUserId,
}: CollaborationManagerProps) {
  const [expandedParticipant, setExpandedParticipant] = useState<string | null>(null);

  const currentUserParticipant = trip.participants.find(p => p.userId === currentUserId);
  const isOwnerOrAdmin = currentUserParticipant && ['OWNER', 'ADMIN'].includes(currentUserParticipant.role);

  const sortedParticipants = [...trip.participants].sort((a, b) => {
    // Sort by role priority (Owner > Admin > Member > Viewer), then by name
    const roleOrder = { OWNER: 0, ADMIN: 1, MEMBER: 2, VIEWER: 3 };
    const aOrder = roleOrder[a.role] ?? 4;
    const bOrder = roleOrder[b.role] ?? 4;
    
    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }
    
    const aName = a.user ? `${a.user.firstName} ${a.user.lastName}` : a.userId;
    const bName = b.user ? `${b.user.firstName} ${b.user.lastName}` : b.userId;
    return aName.localeCompare(bName);
  });

  const handleRoleChange = (participantId: string, newRole: ParticipantRole) => {
    if (participantId === currentUserId && newRole !== currentUserParticipant?.role) {
      Alert.alert(
        'Change Your Role',
        'Are you sure you want to change your own role? This may limit your access to trip management.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Change Role', 
            style: 'destructive',
            onPress: () => onUpdateParticipantRole(participantId, newRole)
          },
        ]
      );
    } else {
      onUpdateParticipantRole(participantId, newRole);
    }
  };

  const handleRemoveParticipant = (participantId: string, participantName: string) => {
    Alert.alert(
      'Remove Participant',
      `Are you sure you want to remove ${participantName} from this trip?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => onRemoveParticipant(participantId)
        },
      ]
    );
  };

  const canEditParticipant = (participant: TripParticipant) => {
    if (!isOwnerOrAdmin) return false;
    if (participant.role === 'OWNER') return false;
    if (currentUserParticipant?.role === 'ADMIN' && participant.role === 'ADMIN') return false;
    return true;
  };

  return (
    <View className="bg-white">
      {/* Header */}
      <View className="px-4 py-4 border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Users width={20} height={20} color="#374151" />
            <Text className="text-lg font-semibold text-gray-900 ml-2">
              Trip Participants ({trip.participants.length})
            </Text>
          </View>
          
          {isOwnerOrAdmin && (
            <Button
              onPress={onInviteParticipants}
              size="sm"
              className="bg-blue-600 flex-row items-center"
            >
              <UserPlus width={16} height={16} color="white" />
              <Text className="text-white font-medium ml-2">Invite</Text>
            </Button>
          )}
        </View>
      </View>

      {/* Participants List */}
      <ScrollView className="max-h-[400px]">
        {sortedParticipants.map((participant) => {
          const isExpanded = expandedParticipant === participant.id;
          const participantName = participant.user 
            ? `${participant.user.firstName} ${participant.user.lastName}`
            : participant.userId;
          const canEdit = canEditParticipant(participant);
          const isCurrentUser = participant.userId === currentUserId;

          return (
            <View key={participant.id} className="border-b border-gray-100">
              <View className="px-4 py-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 flex-row items-center">
                    {/* Avatar placeholder */}
                    <View className="w-10 h-10 bg-gray-300 rounded-full mr-3 items-center justify-center">
                      <Text className="text-gray-600 font-medium">
                        {participantName.charAt(0).toUpperCase()}
                      </Text>
                    </View>

                    <View className="flex-1">
                      <View className="flex-row items-center">
                        <Text className="font-medium text-gray-900 mr-2">
                          {participantName}
                          {isCurrentUser && (
                            <Text className="text-blue-600"> (You)</Text>
                          )}
                        </Text>
                        {getStatusIcon(participant.status)}
                      </View>
                      
                      <View className="flex-row items-center mt-1">
                        <View className={`px-2 py-1 rounded-full flex-row items-center mr-2 ${getRoleColor(participant.role)}`}>
                          {getRoleIcon(participant.role)}
                          <Text className="text-xs font-medium ml-1">{participant.role}</Text>
                        </View>
                        
                        <View className={`px-2 py-1 rounded-full ${getStatusColor(participant.status)}`}>
                          <Text className="text-xs">{participant.status}</Text>
                        </View>
                      </View>

                      {participant.user?.email && (
                        <Text className="text-xs text-gray-500 mt-1">
                          {participant.user.email}
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Actions */}
                  <View className="flex-row items-center space-x-2">
                    {participant.status === 'PENDING' && isOwnerOrAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onPress={() => onResendInvitation(participant.id)}
                        className="p-1"
                      >
                        <Mail width={16} height={16} color="#6B7280" />
                      </Button>
                    )}
                    
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onPress={() => setExpandedParticipant(isExpanded ? null : participant.id)}
                        className="p-1"
                      >
                        <MoreHorizontal width={16} height={16} color="#6B7280" />
                      </Button>
                    )}
                  </View>
                </View>

                {/* Expanded Actions */}
                {isExpanded && canEdit && (
                  <View className="mt-4 pt-4 border-t border-gray-100">
                    <View className="space-y-3">
                      {/* Role Change */}
                      <View>
                        <Text className="text-sm font-medium text-gray-700 mb-2">Change Role</Text>
                        <Select
                          value={participant.role}
                          onSelect={(value) => handleRoleChange(participant.id, value as ParticipantRole)}
                          options={roleOptions.filter(option => {
                            if (option.value === 'OWNER') return false;
                            if (currentUserParticipant?.role === 'ADMIN' && option.value === 'ADMIN') return false;
                            return true;
                          })}
                          placeholder="Select role"
                        />
                      </View>

                      {/* Remove Participant */}
                      {participant.role !== 'OWNER' && (
                        <Button
                          variant="outline"
                          onPress={() => handleRemoveParticipant(participant.id, participantName)}
                          className="border-red-200 flex-row items-center justify-center"
                        >
                          <Trash2 width={16} height={16} color="#EF4444" />
                          <Text className="text-red-600 font-medium ml-2">Remove from Trip</Text>
                        </Button>
                      )}
                    </div>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Role Legend */}
      <View className="px-4 py-3 bg-gray-50 border-t border-gray-100">
        <Text className="text-xs font-medium text-gray-600 mb-2">Role Permissions:</Text>
        <View className="space-y-1">
          <Text className="text-xs text-gray-500">
            <Text className="font-medium">Owner:</Text> Full access, can transfer ownership
          </Text>
          <Text className="text-xs text-gray-500">
            <Text className="font-medium">Admin:</Text> Can invite, manage participants, edit trip
          </Text>
          <Text className="text-xs text-gray-500">
            <Text className="font-medium">Member:</Text> Can view and contribute to trip
          </Text>
          <Text className="text-xs text-gray-500">
            <Text className="font-medium">Viewer:</Text> Can only view trip details
          </Text>
        </View>
      </View>
    </View>
  );
}