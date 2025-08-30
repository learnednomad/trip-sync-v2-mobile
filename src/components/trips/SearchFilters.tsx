/**
 * Advanced Search Filters Component
 * Epic 2: Story 2.1 - Core Trip Management
 * Enhanced search capabilities with location and date filters
 */

import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Calendar, Filter, MapPin, X } from '@/components/ui/icons';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Text } from '@/components/ui/text';

import { DatePicker } from './DatePicker';

interface SearchFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchFilters: SearchFilters;
  onSearchFiltersChange: (filters: Partial<SearchFilters>) => void;
  onClearSearchFilters: () => void;
}

export interface SearchFilters {
  destination?: string;
  startDateFrom?: string;
  startDateTo?: string;
  endDateFrom?: string;
  endDateTo?: string;
  minDuration?: number;
  maxDuration?: number;
  tripType?: string;
}

const tripTypeOptions = [
  { label: 'All Types', value: '' },
  { label: 'Business', value: 'BUSINESS' },
  { label: 'Leisure', value: 'LEISURE' },
  { label: 'Family', value: 'FAMILY' },
  { label: 'Adventure', value: 'ADVENTURE' },
  { label: 'Romantic', value: 'ROMANTIC' },
  { label: 'Educational', value: 'EDUCATIONAL' },
  { label: 'Cultural', value: 'CULTURAL' },
  { label: 'Wellness', value: 'WELLNESS' },
];

const durationOptions = [
  { label: 'Any Duration', value: '' },
  { label: '1-3 days', value: '1-3' },
  { label: '4-7 days', value: '4-7' },
  { label: '1-2 weeks', value: '8-14' },
  { label: '2+ weeks', value: '15+' },
];

export function SearchFilters({
  searchQuery,
  onSearchChange,
  searchFilters,
  onSearchFiltersChange,
  onClearSearchFilters,
}: SearchFiltersProps) {
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);

  const hasActiveSearchFilters = Boolean(
    searchFilters.destination ||
      searchFilters.startDateFrom ||
      searchFilters.startDateTo ||
      searchFilters.endDateFrom ||
      searchFilters.endDateTo ||
      searchFilters.tripType
  );

  const handleDurationChange = (value: string) => {
    if (!value) {
      onSearchFiltersChange({
        minDuration: undefined,
        maxDuration: undefined,
      });
      return;
    }

    const [min, max] = value.split('-');
    if (max === '+') {
      onSearchFiltersChange({
        minDuration: parseInt(min),
        maxDuration: undefined,
      });
    } else {
      onSearchFiltersChange({
        minDuration: parseInt(min),
        maxDuration: parseInt(max),
      });
    }
  };

  const getCurrentDurationValue = () => {
    if (!searchFilters.minDuration) return '';

    if (!searchFilters.maxDuration) {
      return `${searchFilters.minDuration}+`;
    }

    return `${searchFilters.minDuration}-${searchFilters.maxDuration}`;
  };

  return (
    <View className="border-b border-gray-100 bg-white">
      {/* Main Search Bar */}
      <View className="px-4 py-3">
        <View className="flex-row items-center space-x-3">
          <View className="flex-1">
            <Input
              placeholder="Search trips by name, destination, or description..."
              value={searchQuery}
              onChangeText={onSearchChange}
              className="pr-10"
            />
          </View>

          <Button
            variant={showAdvancedSearch ? 'default' : 'outline'}
            size="sm"
            onPress={() => setShowAdvancedSearch(!showAdvancedSearch)}
            className="px-3"
          >
            <Filter
              width={16}
              height={16}
              color={showAdvancedSearch ? 'white' : '#6B7280'}
            />
          </Button>
        </View>

        {/* Search Suggestions */}
        {searchQuery.length > 0 && (
          <View className="mt-2">
            <Text className="text-xs text-gray-500">
              Searching in: trip names, destinations, descriptions, participants
            </Text>
          </View>
        )}
      </View>

      {/* Advanced Search Filters */}
      {showAdvancedSearch && (
        <View className="border-t border-gray-100 px-4 pb-3">
          <View className="my-3 flex-row items-center justify-between">
            <Text className="text-sm font-medium text-gray-700">
              Advanced Search
            </Text>
            {hasActiveSearchFilters && (
              <Button
                variant="ghost"
                size="sm"
                onPress={onClearSearchFilters}
                className="flex-row items-center"
              >
                <X width={14} height={14} color="#6B7280" />
                <Text className="ml-1 text-xs text-gray-600">Clear</Text>
              </Button>
            )}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row space-x-3 pb-2">
              {/* Destination Filter */}
              <View className="min-w-[160px]">
                <Text className="mb-1 text-xs font-medium text-gray-600">
                  <MapPin width={12} height={12} color="#6B7280" /> Destination
                </Text>
                <Input
                  placeholder="Enter destination"
                  value={searchFilters.destination || ''}
                  onChangeText={(value) =>
                    onSearchFiltersChange({ destination: value || undefined })
                  }
                  className="text-sm"
                />
              </View>

              {/* Trip Type Filter */}
              <View className="min-w-[140px]">
                <Text className="mb-1 text-xs font-medium text-gray-600">
                  Trip Type
                </Text>
                <Select
                  value={searchFilters.tripType || ''}
                  onSelect={(value: string | number) =>
                    onSearchFiltersChange({
                      tripType: String(value) || undefined,
                    })
                  }
                  options={tripTypeOptions}
                  placeholder="All Types"
                />
              </View>

              {/* Duration Filter */}
              <View className="min-w-[140px]">
                <Text className="mb-1 text-xs font-medium text-gray-600">
                  Duration
                </Text>
                <Select
                  value={getCurrentDurationValue()}
                  onSelect={(value: string | number) =>
                    handleDurationChange(String(value))
                  }
                  options={durationOptions}
                  placeholder="Any Duration"
                />
              </View>

              {/* Date Range Filter */}
              <View className="min-w-[140px]">
                <Text className="mb-1 text-xs font-medium text-gray-600">
                  <Calendar width={12} height={12} color="#6B7280" /> Date Range
                </Text>
                <DatePicker
                  startDate={searchFilters.startDateFrom}
                  endDate={searchFilters.startDateTo}
                  onStartDateChange={(date: string) =>
                    onSearchFiltersChange({ startDateFrom: date })
                  }
                  onEndDateChange={(date: string) =>
                    onSearchFiltersChange({ startDateTo: date })
                  }
                />
              </View>
            </View>
          </ScrollView>

          {/* Active Search Filter Tags */}
          {hasActiveSearchFilters && (
            <View className="mt-3 flex-row flex-wrap">
              {searchFilters.destination && (
                <View className="mb-1 mr-2 flex-row items-center rounded-full bg-blue-50 px-2 py-1">
                  <MapPin width={10} height={10} color="#1D4ED8" />
                  <Text className="ml-1 text-xs text-blue-700">
                    {searchFilters.destination}
                  </Text>
                </View>
              )}

              {searchFilters.tripType && (
                <View className="mb-1 mr-2 rounded-full bg-green-50 px-2 py-1">
                  <Text className="text-xs text-green-700">
                    {
                      tripTypeOptions.find(
                        (opt) => opt.value === searchFilters.tripType
                      )?.label
                    }
                  </Text>
                </View>
              )}

              {(searchFilters.minDuration || searchFilters.maxDuration) && (
                <View className="mb-1 mr-2 flex-row items-center rounded-full bg-purple-50 px-2 py-1">
                  <Calendar width={10} height={10} color="#7C3AED" />
                  <Text className="ml-1 text-xs text-purple-700">
                    {searchFilters.minDuration &&
                      !searchFilters.maxDuration &&
                      `${searchFilters.minDuration}+ days`}
                    {searchFilters.minDuration &&
                      searchFilters.maxDuration &&
                      `${searchFilters.minDuration}-${searchFilters.maxDuration} days`}
                  </Text>
                </View>
              )}

              {(searchFilters.startDateFrom || searchFilters.startDateTo) && (
                <View className="mb-1 mr-2 rounded-full bg-orange-50 px-2 py-1">
                  <Text className="text-xs text-orange-700">
                    Start: {searchFilters.startDateFrom} -{' '}
                    {searchFilters.startDateTo || 'any'}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
}
