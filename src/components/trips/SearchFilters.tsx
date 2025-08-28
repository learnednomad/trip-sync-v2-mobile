/**
 * Advanced Search Filters Component
 * Epic 2: Story 2.1 - Core Trip Management
 * Enhanced search capabilities with location and date filters
 */

import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { MapPin, Calendar, Filter, X } from '@/components/ui/icons';

import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
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
  onClearSearchFilters 
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
        maxDuration: undefined 
      });
      return;
    }

    const [min, max] = value.split('-');
    if (max === '+') {
      onSearchFiltersChange({ 
        minDuration: parseInt(min), 
        maxDuration: undefined 
      });
    } else {
      onSearchFiltersChange({ 
        minDuration: parseInt(min), 
        maxDuration: parseInt(max) 
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
    <View className="bg-white border-b border-gray-100">
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
        <View className="px-4 pb-3 border-t border-gray-100">
          <View className="flex-row items-center justify-between mb-3 mt-3">
            <Text className="text-sm font-medium text-gray-700">Advanced Search</Text>
            {hasActiveSearchFilters && (
              <Button
                variant="ghost"
                size="sm"
                onPress={onClearSearchFilters}
                className="flex-row items-center"
              >
                <X width={14} height={14} color="#6B7280" />
                <Text className="text-gray-600 ml-1 text-xs">Clear</Text>
              </Button>
            )}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row space-x-3 pb-2">
              {/* Destination Filter */}
              <View className="min-w-[160px]">
                <Text className="text-xs font-medium text-gray-600 mb-1">
                  <MapPin width={12} height={12} color="#6B7280" /> Destination
                </Text>
                <Input
                  placeholder="Enter destination"
                  value={searchFilters.destination || ''}
                  onChangeText={(value) => onSearchFiltersChange({ destination: value || undefined })}
                  className="text-sm"
                />
              </View>

              {/* Trip Type Filter */}
              <View className="min-w-[140px]">
                <Text className="text-xs font-medium text-gray-600 mb-1">Trip Type</Text>
                <Select
                  value={searchFilters.tripType || ''}
                  onSelect={(value) => onSearchFiltersChange({ 
                    tripType: value || undefined 
                  })}
                  options={tripTypeOptions}
                  placeholder="All Types"
                />
              </View>

              {/* Duration Filter */}
              <View className="min-w-[140px]">
                <Text className="text-xs font-medium text-gray-600 mb-1">Duration</Text>
                <Select
                  value={getCurrentDurationValue()}
                  onSelect={handleDurationChange}
                  options={durationOptions}
                  placeholder="Any Duration"
                />
              </View>

              {/* Start Date Range */}
              <View className="min-w-[140px]">
                <Text className="text-xs font-medium text-gray-600 mb-1">
                  <Calendar width={12} height={12} color="#6B7280" /> Start Date From
                </Text>
                <DatePicker
                  date={searchFilters.startDateFrom}
                  onDateChange={(date) => onSearchFiltersChange({ startDateFrom: date })}
                  placeholder="From date"
                  mode="date"
                />
              </View>

              <View className="min-w-[140px]">
                <Text className="text-xs font-medium text-gray-600 mb-1">Start Date To</Text>
                <DatePicker
                  date={searchFilters.startDateTo}
                  onDateChange={(date) => onSearchFiltersChange({ startDateTo: date })}
                  placeholder="To date"
                  mode="date"
                  minimumDate={searchFilters.startDateFrom}
                />
              </View>
            </View>
          </ScrollView>

          {/* Active Search Filter Tags */}
          {hasActiveSearchFilters && (
            <View className="mt-3 flex-row flex-wrap">
              {searchFilters.destination && (
                <View className="bg-blue-50 px-2 py-1 rounded-full mr-2 mb-1 flex-row items-center">
                  <MapPin width={10} height={10} color="#1D4ED8" />
                  <Text className="text-blue-700 text-xs ml-1">{searchFilters.destination}</Text>
                </View>
              )}
              
              {searchFilters.tripType && (
                <View className="bg-green-50 px-2 py-1 rounded-full mr-2 mb-1">
                  <Text className="text-green-700 text-xs">
                    {tripTypeOptions.find(opt => opt.value === searchFilters.tripType)?.label}
                  </Text>
                </View>
              )}
              
              {(searchFilters.minDuration || searchFilters.maxDuration) && (
                <View className="bg-purple-50 px-2 py-1 rounded-full mr-2 mb-1 flex-row items-center">
                  <Calendar width={10} height={10} color="#7C3AED" />
                  <Text className="text-purple-700 text-xs ml-1">
                    {searchFilters.minDuration && !searchFilters.maxDuration && `${searchFilters.minDuration}+ days`}
                    {searchFilters.minDuration && searchFilters.maxDuration && `${searchFilters.minDuration}-${searchFilters.maxDuration} days`}
                  </Text>
                </View>
              )}
              
              {(searchFilters.startDateFrom || searchFilters.startDateTo) && (
                <View className="bg-orange-50 px-2 py-1 rounded-full mr-2 mb-1">
                  <Text className="text-orange-700 text-xs">
                    Start: {searchFilters.startDateFrom} - {searchFilters.startDateTo || 'any'}
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