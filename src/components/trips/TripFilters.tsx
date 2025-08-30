/**
 * Trip Filters Component
 * Epic 2: Story 2.1 - Core Trip Management
 * Filtering interface for trip dashboard
 */

import React from 'react';
import { ScrollView, View } from 'react-native';

import type {
  ParticipantRole,
  TripListParams,
  TripStatus,
} from '@/api/trips/types';
import { Button } from '@/components/ui/button';
import { X } from '@/components/ui/icons';
import { Select } from '@/components/ui/select';
import { Text } from '@/components/ui/text';

interface TripFiltersProps {
  filters: TripListParams;
  onFilterChange: (filters: Partial<TripListParams>) => void;
  onClearFilters: () => void;
}

const statusOptions = [
  { label: 'All Statuses', value: '' },
  { label: 'Planning', value: 'PLANNING' },
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

const sortOptions = [
  { label: 'Recently Updated', value: 'updatedAt' },
  { label: 'Recently Created', value: 'createdAt' },
  { label: 'Trip Name', value: 'name' },
  { label: 'Start Date', value: 'startDate' },
  { label: 'End Date', value: 'endDate' },
];

const orderOptions = [
  { label: 'Descending', value: 'desc' },
  { label: 'Ascending', value: 'asc' },
];

const roleOptions = [
  { label: 'All Roles', value: '' },
  { label: 'Owner', value: 'OWNER' },
  { label: 'Admin', value: 'ADMIN' },
  { label: 'Member', value: 'MEMBER' },
  { label: 'Viewer', value: 'VIEWER' },
];

export function TripFilters({
  filters,
  onFilterChange,
  onClearFilters,
}: TripFiltersProps) {
  const hasActiveFilters = Boolean(
    filters.status ||
      filters.role ||
      filters.upcoming !== undefined ||
      filters.sort !== 'updatedAt' ||
      filters.order !== 'desc'
  );

  return (
    <View className="border-b border-gray-100 bg-white px-4 py-3">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="flex-1"
        contentContainerStyle={{ paddingRight: 16 }}
      >
        <View className="flex-row space-x-3">
          {/* Status Filter */}
          <View className="min-w-[140px]">
            <Text className="mb-1 text-sm font-medium text-gray-700">
              Status
            </Text>
            <Select
              value={filters.status || ''}
              onSelect={(value) =>
                onFilterChange({
                  status: (value as TripStatus) || undefined,
                })
              }
              options={statusOptions}
              placeholder="All Statuses"
            />
          </View>

          {/* Role Filter */}
          <View className="min-w-[120px]">
            <Text className="mb-1 text-sm font-medium text-gray-700">
              My Role
            </Text>
            <Select
              value={filters.role || ''}
              onSelect={(value) =>
                onFilterChange({
                  role: (value as ParticipantRole) || undefined,
                })
              }
              options={roleOptions}
              placeholder="All Roles"
            />
          </View>

          {/* Sort Filter */}
          <View className="min-w-[160px]">
            <Text className="mb-1 text-sm font-medium text-gray-700">
              Sort By
            </Text>
            <Select
              value={filters.sort || 'updatedAt'}
              onSelect={(value) => onFilterChange({ sort: value as any })}
              options={sortOptions}
              placeholder="Sort By"
            />
          </View>

          {/* Order Filter */}
          <View className="min-w-[120px]">
            <Text className="mb-1 text-sm font-medium text-gray-700">
              Order
            </Text>
            <Select
              value={filters.order || 'desc'}
              onSelect={(value) =>
                onFilterChange({ order: value as 'asc' | 'desc' })
              }
              options={orderOptions}
              placeholder="Order"
            />
          </View>

          {/* Upcoming Filter Toggle */}
          <View className="min-w-[140px]">
            <Text className="mb-1 text-sm font-medium text-gray-700">
              Time Filter
            </Text>
            <Button
              variant={filters.upcoming ? 'default' : 'outline'}
              size="sm"
              onPress={() =>
                onFilterChange({
                  upcoming: filters.upcoming ? undefined : true,
                })
              }
              className="justify-start"
            >
              <Text
                className={filters.upcoming ? 'text-white' : 'text-gray-700'}
              >
                Upcoming Only
              </Text>
            </Button>
          </View>
        </View>
      </ScrollView>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <View className="mt-3 flex-row justify-end">
          <Button
            variant="ghost"
            size="sm"
            onPress={onClearFilters}
            className="flex-row items-center"
          >
            <X width={16} height={16} color="#6B7280" />
            <Text className="ml-1 text-gray-600">Clear Filters</Text>
          </Button>
        </View>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <View className="mt-2 flex-row flex-wrap">
          {filters.status && (
            <View className="mb-1 mr-2 flex-row items-center rounded-full bg-blue-100 px-2 py-1">
              <Text className="text-xs text-blue-800">
                Status:{' '}
                {
                  statusOptions.find((opt) => opt.value === filters.status)
                    ?.label
                }
              </Text>
            </View>
          )}

          {filters.role && (
            <View className="mb-1 mr-2 flex-row items-center rounded-full bg-green-100 px-2 py-1">
              <Text className="text-xs text-green-800">
                Role:{' '}
                {roleOptions.find((opt) => opt.value === filters.role)?.label}
              </Text>
            </View>
          )}

          {filters.upcoming && (
            <View className="mb-1 mr-2 flex-row items-center rounded-full bg-purple-100 px-2 py-1">
              <Text className="text-xs text-purple-800">Upcoming</Text>
            </View>
          )}

          {(filters.sort !== 'updatedAt' || filters.order !== 'desc') && (
            <View className="mb-1 mr-2 flex-row items-center rounded-full bg-orange-100 px-2 py-1">
              <Text className="text-xs text-orange-800">
                {sortOptions.find((opt) => opt.value === filters.sort)?.label} (
                {filters.order})
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
