/**
 * Collaboration Manager Component
 * Epic 2: Story 2.1 - Core Trip Management
 * Manage trip participants, roles, and permissions
 */

import React, { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';

import type {
  ParticipantRole,
  ParticipantStatus,
  Trip,
  TripParticipant,
} from '@/api/trips/types';
import { Button } from '@/components/ui/button';
import {
  CheckCircle,
  Clock,
  Crown,
  Eye,
  Mail,
  MoreHorizontal,
  Shield,
  Trash2,
  UserPlus,
  Users,
  XCircle,
} from '@/components/ui/icons';
import { Select } from '@/components/ui/select';
import { Text } from '@/components/ui/text';

interface CollaborationManagerProps {
  trip: Trip;
  onInviteParticipants: () => void;
  onUpdateParticipantRole: (
    participantId: string,
    newRole: ParticipantRole
  ) => void;
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
  const [expandedParticipant, setExpandedParticipant] = useState<string | null>(
    null
  );

  const currentUserParticipant = trip.participants.find(
    (p) => p.userId === currentUserId
  );
  const isOwnerOrAdmin =
    currentUserParticipant &&
    ['OWNER', 'ADMIN'].includes(currentUserParticipant.role);

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

  const handleRoleChange = (
    participantId: string,
    newRole: ParticipantRole
  ) => {
    if (
      participantId === currentUserId &&
      newRole !== currentUserParticipant?.role
    ) {
      Alert.alert(
        'Change Your Role',
        'Are you sure you want to change your own role? This may limit your access to trip management.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Change Role',
            style: 'destructive',
            onPress: () => onUpdateParticipantRole(participantId, newRole),
          },
        ]
      );
    } else {
      onUpdateParticipantRole(participantId, newRole);
    }
  };

  const handleRemoveParticipant = (
    participantId: string,
    participantName: string
  ) => {
    Alert.alert(
      'Remove Participant',
      `Are you sure you want to remove ${participantName} from this trip?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => onRemoveParticipant(participantId),
        },
      ]
    );
  };

  const canEditParticipant = (participant: TripParticipant) => {
    if (!isOwnerOrAdmin) return false;
    if (participant.role === 'OWNER') return false;
    if (
      currentUserParticipant?.role === 'ADMIN' &&
      participant.role === 'ADMIN'
    )
      return false;
    return true;
  };

  return (
    <View className="bg-white">
      {/* Header */}
      <View className="border-b border-gray-100 p-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Users width={20} height={20} color="#374151" />
            <Text className="ml-2 text-lg font-semibold text-gray-900">
              Trip Participants ({trip.participants.length})
            </Text>
          </View>

          {isOwnerOrAdmin && (
            <Button
              onPress={onInviteParticipants}
              size="sm"
              className="flex-row items-center bg-blue-600"
            >
              <UserPlus width={16} height={16} color="white" />
              <Text className="ml-2 font-medium text-white">Invite</Text>
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
              <View className="p-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 flex-row items-center">
                    {/* Avatar placeholder */}
                    <View className="mr-3 size-10 items-center justify-center rounded-full bg-gray-300">
                      <Text className="font-medium text-gray-600">
                        {participantName.charAt(0).toUpperCase()}
                      </Text>
                    </View>

                    <View className="flex-1">
                      <View className="flex-row items-center">
                        <Text className="mr-2 font-medium text-gray-900">
                          {participantName}
                          {isCurrentUser && (
                            <Text className="text-blue-600"> (You)</Text>
                          )}
                        </Text>
                        {getStatusIcon(participant.status)}
                      </View>

                      <View className="mt-1 flex-row items-center">
                        <View
                          className={`mr-2 flex-row items-center rounded-full px-2 py-1 ${getRoleColor(participant.role)}`}
                        >
                          {getRoleIcon(participant.role)}
                          <Text className="ml-1 text-xs font-medium">
                            {participant.role}
                          </Text>
                        </View>

                        <View
                          className={`rounded-full px-2 py-1 ${getStatusColor(participant.status)}`}
                        >
                          <Text className="text-xs">{participant.status}</Text>
                        </View>
                      </View>

                      {participant.user?.email && (
                        <Text className="mt-1 text-xs text-gray-500">
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
                        onPress={() =>
                          setExpandedParticipant(
                            isExpanded ? null : participant.id
                          )
                        }
                        className="p-1"
                      >
                        <MoreHorizontal
                          width={16}
                          height={16}
                          color="#6B7280"
                        />
                      </Button>
                    )}
                  </View>
                </View>

                {/* Expanded Actions */}
                {isExpanded && canEdit && (
                  <View className="mt-4 border-t border-gray-100 pt-4">
                    <View className="space-y-3">
                      {/* Role Change */}
                      <View>
                        <Text className="mb-2 text-sm font-medium text-gray-700">
                          Change Role
                        </Text>
                        <Select
                          value={participant.role}
                          onSelect={(value) =>
                            handleRoleChange(
                              participant.id,
                              value as ParticipantRole
                            )
                          }
                          options={roleOptions.filter((option) => {
                            if (option.value === 'OWNER') return false;
                            if (
                              currentUserParticipant?.role === 'ADMIN' &&
                              option.value === 'ADMIN'
                            )
                              return false;
                            return true;
                          })}
                          placeholder="Select role"
                        />
                      </View>

                      {/* Remove Participant */}
                      {participant.role !== 'OWNER' && (
                        <Button
                          variant="outline"
                          onPress={() =>
                            handleRemoveParticipant(
                              participant.id,
                              participantName
                            )
                          }
                          className="flex-row items-center justify-center border-red-200"
                        >
                          <Trash2 width={16} height={16} color="#EF4444" />
                          <Text className="ml-2 font-medium text-red-600">
                            Remove from Trip
                          </Text>
                        </Button>
                      )}
                    </View>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Role Legend */}
      <View className="border-t border-gray-100 bg-gray-50 px-4 py-3">
        <Text className="mb-2 text-xs font-medium text-gray-600">
          Role Permissions:
        </Text>
        <View className="space-y-1">
          <Text className="text-xs text-gray-500">
            <Text className="font-medium">Owner:</Text> Full access, can
            transfer ownership
          </Text>
          <Text className="text-xs text-gray-500">
            <Text className="font-medium">Admin:</Text> Can invite, manage
            participants, edit trip
          </Text>
          <Text className="text-xs text-gray-500">
            <Text className="font-medium">Member:</Text> Can view and contribute
            to trip
          </Text>
          <Text className="text-xs text-gray-500">
            <Text className="font-medium">Viewer:</Text> Can only view trip
            details
          </Text>
        </View>
      </View>
    </View>
  );
}
