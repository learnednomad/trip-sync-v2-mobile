/**
 * Trip Detail View
 * Epic 2: Story 2.1 - Core Trip Management
 * Comprehensive trip information display with real-time collaboration
 */

import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, RefreshControl, ScrollView, View } from 'react-native';

import type {
  CreateTripRequest,
  ParticipantRole,
  TripStatus,
} from '@/api/trips/types';
import { useDeleteTrip, useTrip, useUpdateTrip } from '@/api/trips/use-trips';
import { CollaborationManager } from '@/components/trips/CollaborationManager';
import { TripSharingModal } from '@/components/trips/TripSharingModal';
import { TripStatusManager } from '@/components/trips/TripStatusManager';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Archive,
  Calendar,
  MapPin,
  MoreHorizontal,
  Settings,
  Share,
  Users,
} from '@/components/ui/icons';
import { Image } from '@/components/ui/image';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/lib/auth';

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const authState = useAuth();

  const [showCollaboration, setShowCollaboration] = useState(false);
  const [showStatusManager, setShowStatusManager] = useState(false);
  const [showSharing, setShowSharing] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'itinerary' | 'participants' | 'expenses'
  >('overview');

  // API hooks
  const {
    data: tripResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useTrip(id!);

  const updateTripMutation = useUpdateTrip(id!);
  const deleteTripMutation = useDeleteTrip();

  const trip = tripResponse?.data?.trip;

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleEditTrip = useCallback(() => {
    router.push(`/trips/${id}/edit`);
  }, [id]);

  const handleStatusChange = useCallback(
    (newStatus: TripStatus, reason?: string) => {
      if (!trip) return;

      updateTripMutation.mutate(
        { version: trip.version },
        {
          onSuccess: () => {
            Alert.alert('Success', `Trip status updated to ${newStatus}`);
          },
          onError: () => {
            Alert.alert('Error', 'Failed to update trip status');
          },
        }
      );
    },
    [trip, updateTripMutation]
  );

  const handleArchiveTrip = useCallback(() => {
    Alert.alert('Archive Trip', 'Are you sure you want to archive this trip?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive',
        onPress: () => {
          if (trip) {
            updateTripMutation.mutate(
              { version: trip.version },
              {
                onSuccess: () => router.back(),
                onError: () => Alert.alert('Error', 'Failed to archive trip'),
              }
            );
          }
        },
      },
    ]);
  }, [trip, updateTripMutation]);

  const handleDuplicateTrip = useCallback(() => {
    if (!trip) return;

    const duplicateData: CreateTripRequest = {
      name: `${trip.name} (Copy)`,
      description: trip.description,
      destination: trip.destination,
      tripType: trip.tripType,
      startDate: trip.startDate,
      endDate: trip.endDate,
      budgetAmount: trip.budgetAmount,
      budgetCurrency: trip.budgetCurrency,
      settings: trip.settings,
    };

    router.push({
      pathname: '/trips/create',
      params: { template: JSON.stringify(duplicateData) },
    });
  }, [trip]);

  const handleDeleteTrip = useCallback(() => {
    Alert.alert(
      'Delete Trip',
      'Are you sure you want to permanently delete this trip? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (id) {
              deleteTripMutation.mutate(id, {
                onSuccess: () => {
                  Alert.alert('Success', 'Trip deleted successfully');
                  router.replace('/');
                },
                onError: () => {
                  Alert.alert('Error', 'Failed to delete trip');
                },
              });
            }
          },
        },
      ]
    );
  }, [id, deleteTripMutation]);

  // User permissions - TODO: Get actual user ID from auth context
  const currentUserId = authState.token ? 'current-user' : '';
  const currentUserParticipant = trip?.participants.find(
    (p) => p.userId === currentUserId
  );
  const userRole = currentUserParticipant?.role || 'VIEWER';
  const isOwner = userRole === 'OWNER';
  const canEdit = ['OWNER', 'ADMIN'].includes(userRole);
  const canManage = ['OWNER', 'ADMIN'].includes(userRole);

  // Loading state
  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50">
        <Stack.Screen options={{ title: 'Loading...' }} />
        <LoadingSkeleton.Skeleton width="100%" height="400px" />
      </View>
    );
  }

  // Error state
  if (isError || !trip) {
    return (
      <View className="flex-1 bg-gray-50">
        <Stack.Screen options={{ title: 'Error' }} />
        <EmptyState
          title="Trip Not Found"
          description="This trip may have been deleted or you don't have permission to view it."
          action={{
            label: 'Go Back',
            onPress: () => router.back(),
          }}
        />
      </View>
    );
  }

  // Helper functions
  const getStatusColor = (status: TripStatus) => {
    const colors = {
      PLANNING: 'bg-blue-100 text-blue-800',
      CONFIRMED: 'bg-green-100 text-green-800',
      IN_PROGRESS: 'bg-purple-100 text-purple-800',
      COMPLETED: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDurationDays = () => {
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: trip.name,
          headerRight: () => (
            <Button
              variant="ghost"
              size="sm"
              onPress={() => setShowSharing(true)}
              className="mr-2"
            >
              <Share width={20} height={20} color="#374151" />
            </Button>
          ),
        }}
      />

      <ScrollView
        className="flex-1 bg-gray-50"
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
      >
        {/* Trip Header */}
        <View className="bg-white">
          {/* Cover Image */}
          {trip.coverImageUrl && (
            <Image
              source={{ uri: trip.coverImageUrl }}
              className="h-48 w-full"
              resizeMode="cover"
            />
          )}

          {/* Trip Info */}
          <View className="p-4">
            <View className="mb-3 flex-row items-start justify-between">
              <View className="flex-1">
                <Text className="text-xl font-bold text-gray-900">
                  {trip.name}
                </Text>
                {trip.description && (
                  <Text className="mt-1 text-gray-600">{trip.description}</Text>
                )}
              </View>

              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onPress={handleEditTrip}
                  className="ml-3"
                >
                  <Settings width={16} height={16} color="#374151" />
                </Button>
              )}
            </View>

            {/* Status Badge */}
            <View
              className={`mb-3 self-start rounded-full px-3 py-1 ${getStatusColor(trip.status)}`}
            >
              <Text className="text-sm font-medium">{trip.status}</Text>
            </View>

            {/* Trip Details Grid */}
            <View className="space-y-3">
              <View className="flex-row items-center">
                <MapPin width={16} height={16} color="#6B7280" />
                <Text className="ml-2 text-gray-700">{trip.destination}</Text>
              </View>

              <View className="flex-row items-center">
                <Calendar width={16} height={16} color="#6B7280" />
                <Text className="ml-2 text-gray-700">
                  {formatDate(trip.startDate)} - {formatDate(trip.endDate)} (
                  {getDurationDays()} days)
                </Text>
              </View>

              <View className="flex-row items-center">
                <Users width={16} height={16} color="#6B7280" />
                <Text className="ml-2 text-gray-700">
                  {trip.participants.length} participant
                  {trip.participants.length !== 1 ? 's' : ''}
                </Text>
              </View>

              {trip.budgetAmount && (
                <View className="flex-row items-center">
                  <Text className="text-gray-700">
                    💰 {trip.budgetCurrency}{' '}
                    {trip.budgetAmount.toLocaleString()}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Tab Navigation */}
        <View className="mt-3 bg-white">
          <View className="flex-row border-b border-gray-200">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'itinerary', label: 'Itinerary' },
              { key: 'participants', label: 'People' },
              { key: 'expenses', label: 'Expenses' },
            ].map((tab) => (
              <Button
                key={tab.key}
                variant="ghost"
                onPress={() => setActiveTab(tab.key as any)}
                className={`flex-1 py-3 ${
                  activeTab === tab.key ? 'border-b-2 border-blue-500' : ''
                }`}
              >
                <Text
                  className={`text-sm ${
                    activeTab === tab.key
                      ? 'font-semibold text-blue-600'
                      : 'text-gray-600'
                  }`}
                >
                  {tab.label}
                </Text>
              </Button>
            ))}
          </View>

          {/* Tab Content */}
          <View className="p-4">
            {activeTab === 'overview' && (
              <View className="space-y-4">
                <Text className="text-lg font-semibold text-gray-900">
                  Trip Overview
                </Text>

                {/* Quick Actions */}
                <View className="flex-row space-x-2">
                  {canManage && (
                    <Button
                      variant="outline"
                      size="sm"
                      onPress={() => setShowStatusManager(true)}
                      className="flex-row items-center"
                    >
                      <Settings width={16} height={16} color="#374151" />
                      <Text className="ml-2 text-gray-700">Manage</Text>
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onPress={() => setShowCollaboration(true)}
                    className="flex-row items-center"
                  >
                    <Users width={16} height={16} color="#374151" />
                    <Text className="ml-2 text-gray-700">Collaborate</Text>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onPress={() => setShowSharing(true)}
                    className="flex-row items-center"
                  >
                    <Share width={16} height={16} color="#374151" />
                    <Text className="ml-2 text-gray-700">Share</Text>
                  </Button>
                </View>

                {/* Trip Progress */}
                <View className="rounded-lg bg-gray-50 p-3">
                  <Text className="mb-2 text-sm font-medium text-gray-700">
                    Trip Progress
                  </Text>
                  <View className="mb-2 h-2 rounded-full bg-gray-200">
                    <View
                      className="h-2 rounded-full bg-blue-500"
                      style={{
                        width: `${
                          trip.status === 'PLANNING'
                            ? 25
                            : trip.status === 'CONFIRMED'
                              ? 50
                              : trip.status === 'IN_PROGRESS'
                                ? 75
                                : 100
                        }%`,
                      }}
                    />
                  </View>
                  <Text className="text-xs text-gray-600">
                    {trip.status === 'PLANNING' &&
                      'Planning phase - getting details ready'}
                    {trip.status === 'CONFIRMED' && 'Confirmed - ready to go!'}
                    {trip.status === 'IN_PROGRESS' && 'Currently traveling'}
                    {trip.status === 'COMPLETED' && 'Trip completed'}
                    {trip.status === 'CANCELLED' && 'Trip cancelled'}
                  </Text>
                </View>

                {/* Recent Activity */}
                <View>
                  <Text className="mb-2 text-sm font-medium text-gray-700">
                    Recent Activity
                  </Text>
                  <View className="space-y-2">
                    <View className="flex-row items-center rounded-lg bg-blue-50 p-3">
                      <View className="mr-3 size-8 items-center justify-center rounded-full bg-blue-100">
                        <Calendar width={14} height={14} color="#2563EB" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-medium text-gray-900">
                          Trip updated
                        </Text>
                        <Text className="text-xs text-gray-600">
                          Last modified {formatDate(trip.updatedAt)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {activeTab === 'itinerary' && (
              <View className="space-y-4">
                <Text className="text-lg font-semibold text-gray-900">
                  Itinerary
                </Text>
                <EmptyState
                  title="No itinerary yet"
                  description="Start planning your trip by adding activities and events."
                  action={
                    canEdit
                      ? {
                          label: 'Add Activity',
                          onPress: () =>
                            router.push(`/trips/${id}/itinerary/create`),
                        }
                      : undefined
                  }
                />
              </View>
            )}

            {activeTab === 'participants' && (
              <View className="space-y-4">
                <View className="flex-row items-center justify-between">
                  <Text className="text-lg font-semibold text-gray-900">
                    Participants ({trip.participants.length})
                  </Text>
                  {canManage && (
                    <Button
                      size="sm"
                      onPress={() => setShowCollaboration(true)}
                      className="bg-blue-600"
                    >
                      <Text className="text-white">Manage</Text>
                    </Button>
                  )}
                </View>

                <View className="space-y-3">
                  {trip.participants.map((participant) => (
                    <View
                      key={participant.id}
                      className="flex-row items-center rounded-lg border border-gray-200 p-3"
                    >
                      <View className="mr-3 size-10 items-center justify-center rounded-full bg-gray-300">
                        <Text className="font-medium text-gray-600">
                          {participant.user?.firstName?.charAt(0) || 'U'}
                        </Text>
                      </View>

                      <View className="flex-1">
                        <Text className="font-medium text-gray-900">
                          {participant.user
                            ? `${participant.user.firstName} ${participant.user.lastName}`
                            : participant.userId}
                          {participant.userId === currentUserId && (
                            <Text className="text-blue-600"> (You)</Text>
                          )}
                        </Text>
                        <View className="mt-1 flex-row items-center">
                          <Text className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                            {participant.role}
                          </Text>
                          <Text
                            className={`ml-2 rounded-full px-2 py-1 text-xs ${
                              participant.status === 'ACCEPTED'
                                ? 'bg-green-100 text-green-700'
                                : participant.status === 'PENDING'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {participant.status}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {activeTab === 'expenses' && (
              <View className="space-y-4">
                <Text className="text-lg font-semibold text-gray-900">
                  Expenses
                </Text>
                <EmptyState
                  title="No expenses yet"
                  description="Track trip expenses to stay within budget."
                  action={
                    canEdit
                      ? {
                          label: 'Add Expense',
                          onPress: () =>
                            router.push(`/trips/${id}/expenses/create`),
                        }
                      : undefined
                  }
                />
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        {canManage && (
          <View className="mt-3 bg-white p-4">
            <View className="flex-row space-x-2">
              <Button
                variant="outline"
                onPress={handleDuplicateTrip}
                className="flex-1 flex-row items-center justify-center"
              >
                <Archive width={16} height={16} color="#374151" />
                <Text className="ml-2 text-gray-700">Duplicate</Text>
              </Button>

              <Button
                variant="outline"
                onPress={() => setShowStatusManager(true)}
                className="flex-1 flex-row items-center justify-center"
              >
                <Settings width={16} height={16} color="#374151" />
                <Text className="ml-2 text-gray-700">Status</Text>
              </Button>

              <Button
                variant="outline"
                onPress={() => {}}
                className="flex-row items-center justify-center p-3"
              >
                <MoreHorizontal width={16} height={16} color="#374151" />
              </Button>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Modals */}
      <CollaborationManager
        trip={trip}
        onInviteParticipants={() => {
          // TODO: Implement participant invitation
          setShowCollaboration(false);
        }}
        onUpdateParticipantRole={(
          participantId: string,
          newRole: ParticipantRole
        ) => {
          console.log('Update participant role:', participantId, newRole);
        }}
        onRemoveParticipant={(participantId: string) => {
          console.log('Remove participant:', participantId);
        }}
        onResendInvitation={(participantId: string) => {
          console.log('Resend invitation:', participantId);
        }}
        currentUserId={currentUserId}
      />

      <TripStatusManager
        trip={trip}
        onStatusChange={handleStatusChange}
        onArchiveTrip={handleArchiveTrip}
        onDuplicateTrip={handleDuplicateTrip}
        onDeleteTrip={handleDeleteTrip}
        canManage={canManage}
      />

      <TripSharingModal
        visible={showSharing}
        onClose={() => setShowSharing(false)}
        trip={trip}
        onInviteParticipants={(emails, role, message) => {
          console.log('Invite participants:', emails, role, message);
          setShowSharing(false);
        }}
        onUpdateSharingSettings={(settings) => {
          console.log('Update sharing settings:', settings);
        }}
      />
    </>
  );
}
