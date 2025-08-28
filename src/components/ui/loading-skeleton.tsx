/**
 * Loading Skeleton Components
 * Provides skeleton loading states for various UI elements
 */

import React from 'react';
import { View } from 'react-native';

interface SkeletonProps {
  width?: string;
  height?: string;
  className?: string;
}

function Skeleton({ width = 'w-full', height = 'h-4', className = '' }: SkeletonProps) {
  return (
    <View className={`${width} ${height} bg-gray-200 rounded ${className} animate-pulse`} />
  );
}

interface TripListSkeletonProps {
  count?: number;
}

function TripListSkeleton({ count = 3 }: TripListSkeletonProps) {
  return (
    <View className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} className="bg-white rounded-xl border border-gray-200 p-4">
          {/* Cover image skeleton */}
          <Skeleton width="w-full" height="h-32" className="mb-4 rounded-lg" />
          
          {/* Trip name and status */}
          <View className="flex-row items-start justify-between mb-2">
            <Skeleton width="w-2/3" height="h-5" />
            <Skeleton width="w-16" height="h-6" className="rounded-full" />
          </View>
          
          {/* Destination */}
          <View className="flex-row items-center mb-2">
            <Skeleton width="w-4" height="h-4" className="rounded mr-2" />
            <Skeleton width="w-1/2" height="h-4" />
          </View>
          
          {/* Trip details */}
          <View className="space-y-1">
            <View className="flex-row items-center">
              <Skeleton width="w-4" height="h-4" className="rounded mr-2" />
              <Skeleton width="w-1/3" height="h-3" />
            </View>
            <View className="flex-row items-center">
              <Skeleton width="w-4" height="h-4" className="rounded mr-2" />
              <Skeleton width="w-1/4" height="h-3" />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

interface TripCardSkeletonProps {
  viewMode?: 'grid' | 'list';
}

function TripCardSkeleton({ viewMode = 'grid' }: TripCardSkeletonProps) {
  const isGridMode = viewMode === 'grid';
  
  return (
    <View className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${
      isGridMode ? 'shadow-sm' : 'shadow-sm mb-3'
    }`}>
      {/* Cover Image */}
      <Skeleton width="w-full" height={isGridMode ? 'h-32' : 'h-24'} />
      
      {/* Card Content */}
      <View className={`p-4 ${isGridMode ? 'space-y-2' : 'flex-row justify-between'}`}>
        <View className={isGridMode ? '' : 'flex-1'}>
          {/* Trip Name & Status */}
          <View className={`${isGridMode ? 'mb-2' : 'mb-1'} flex-row items-start justify-between`}>
            <Skeleton width={isGridMode ? 'w-3/4' : 'w-2/3'} height={isGridMode ? 'h-4' : 'h-5'} />
            <Skeleton width="w-12" height="h-5" className="rounded-full" />
          </View>

          {/* Destination */}
          <View className="flex-row items-center mb-2">
            <Skeleton width="w-3" height="h-3" className="rounded mr-1" />
            <Skeleton width="w-1/2" height="h-3" />
          </View>

          {/* Trip Details */}
          <View className={`${isGridMode ? 'space-y-1' : 'flex-row space-x-4'}`}>
            <View className="flex-row items-center">
              <Skeleton width="w-3" height="h-3" className="rounded mr-1" />
              <Skeleton width={isGridMode ? 'w-16' : 'w-12'} height="h-3" />
            </View>
            <View className="flex-row items-center">
              <Skeleton width="w-3" height="h-3" className="rounded mr-1" />
              <Skeleton width={isGridMode ? 'w-12' : 'w-10'} height="h-3" />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

export const LoadingSkeleton = {
  TripList: TripListSkeleton,
  TripCard: TripCardSkeleton,
  Skeleton,
};