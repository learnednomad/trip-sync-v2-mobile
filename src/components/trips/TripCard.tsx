/**
 * Trip Card Component
 * Epic 2: Story 2.1 - Core Trip Management
 * Displays trip information in card format for dashboard
 */

import React from 'react';
import { View, Pressable, Image } from 'react-native';
import { Calendar, MapPin, Users, Clock } from '@/components/ui/icons';

import { Text } from '@/components/ui/text';
import type { Trip } from '@/api/trips/types';
import { formatDate } from '@/lib/utils/date';
import { TripStatusBadge } from './TripStatusBadge';

interface TripCardProps {
  trip: Trip;
  viewMode: 'grid' | 'list';
  onPress: () => void;
  className?: string;
}

export function TripCard({ trip, viewMode, onPress, className = '' }: TripCardProps) {
  const isGridMode = viewMode === 'grid';
  const participantCount = trip.participants?.length || 0;
  const daysDuration = Math.ceil(
    (new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Pressable
      onPress={onPress}
      className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${
        isGridMode ? 'shadow-sm' : 'shadow-sm mb-3'
      } ${className}`}
      android_ripple={{ color: '#f3f4f6' }}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`Trip: ${trip.name}`}
      accessibilityHint={`View details for ${trip.name} trip to ${trip.destination}`}
    >
      {/* Cover Image */}
      {trip.coverImageUrl && (
        <Image
          source={{ uri: trip.coverImageUrl }}
          className={`w-full bg-gray-100 ${isGridMode ? 'h-32' : 'h-24'}`}
          resizeMode="cover"
        />
      )}
      
      {/* Card Content */}
      <View className={`p-4 ${isGridMode ? 'space-y-2' : 'flex-row justify-between'}`}>
        {/* Main Content */}
        <View className={isGridMode ? '' : 'flex-1'}>
          {/* Trip Name & Status */}
          <View className={`${isGridMode ? 'mb-2' : 'mb-1'} flex-row items-start justify-between`}>
            <Text 
              className={`font-semibold text-gray-900 flex-1 ${isGridMode ? 'text-base' : 'text-lg'}`}
              numberOfLines={isGridMode ? 2 : 1}
            >
              {trip.name}
            </Text>
            <TripStatusBadge status={trip.status} size={isGridMode ? 'sm' : 'md'} />
          </View>

          {/* Destination */}
          <View className="flex-row items-center mb-2">
            <MapPin width={isGridMode ? 14 : 16} height={isGridMode ? 14 : 16} color="#6B7280" />
            <Text 
              className={`ml-1 text-gray-600 flex-1 ${isGridMode ? 'text-sm' : 'text-base'}`}
              numberOfLines={1}
            >
              {trip.destination}
            </Text>
          </View>

          {/* Trip Details */}
          <View className={`${isGridMode ? 'space-y-1' : 'flex-row space-x-4'}`}>
            {/* Dates */}
            <View className="flex-row items-center">
              <Calendar width={isGridMode ? 14 : 16} height={isGridMode ? 14 : 16} color="#6B7280" />
              <Text className={`ml-1 text-gray-500 ${isGridMode ? 'text-xs' : 'text-sm'}`}>
                {formatDate(trip.startDate, 'MMM d')} - {formatDate(trip.endDate, 'MMM d, yyyy')}
              </Text>
            </View>

            {/* Duration */}
            <View className="flex-row items-center">
              <Clock width={isGridMode ? 14 : 16} height={isGridMode ? 14 : 16} color="#6B7280" />
              <Text className={`ml-1 text-gray-500 ${isGridMode ? 'text-xs' : 'text-sm'}`}>
                {daysDuration} {daysDuration === 1 ? 'day' : 'days'}
              </Text>
            </View>

            {/* Participants */}
            {participantCount > 0 && (
              <View className="flex-row items-center">
                <Users width={isGridMode ? 14 : 16} height={isGridMode ? 14 : 16} color="#6B7280" />
                <Text className={`ml-1 text-gray-500 ${isGridMode ? 'text-xs' : 'text-sm'}`}>
                  {participantCount} {participantCount === 1 ? 'person' : 'people'}
                </Text>
              </View>
            )}
          </View>

          {/* Description - List mode only */}
          {!isGridMode && trip.description && (
            <Text 
              className="text-gray-600 text-sm mt-2" 
              numberOfLines={2}
            >
              {trip.description}
            </Text>
          )}
        </View>

        {/* List Mode Additional Info */}
        {!isGridMode && (
          <View className="ml-4 items-end justify-center">
            {trip.budgetAmount && (
              <Text className="text-green-600 font-semibold text-lg">
                {trip.budgetCurrency} {trip.budgetAmount.toLocaleString()}
              </Text>
            )}
            <Text className="text-gray-400 text-xs mt-1">
              Updated {formatDate(trip.updatedAt, 'MMM d')}
            </Text>
          </View>
        )}
      </View>

      {/* Grid Mode Budget */}
      {isGridMode && trip.budgetAmount && (
        <View className="px-4 pb-3">
          <Text className="text-green-600 font-semibold text-sm">
            Budget: {trip.budgetCurrency} {trip.budgetAmount.toLocaleString()}
          </Text>
        </View>
      )}
    </Pressable>
  );
}