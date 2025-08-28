/**
 * Saved Searches Component
 * Epic 2: Story 2.1 - Core Trip Management
 * Save and manage frequently used search filters
 */

import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { Bookmark, BookmarkCheck, X } from '@/components/ui/icons';

import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { TripListParams } from '@/api/trips/types';
import type { SearchFilters } from './SearchFilters';

interface SavedSearch {
  id: string;
  name: string;
  searchQuery: string;
  filters: TripListParams;
  searchFilters: SearchFilters;
  createdAt: string;
}

interface SavedSearchesProps {
  currentSearch: string;
  currentFilters: TripListParams;
  currentSearchFilters: SearchFilters;
  onApplySearch: (search: SavedSearch) => void;
  onSaveSearch: (name: string) => void;
}

export function SavedSearches({
  currentSearch,
  currentFilters,
  currentSearchFilters,
  onApplySearch,
  onSaveSearch,
}: SavedSearchesProps) {
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [searchName, setSearchName] = useState('');
  
  // Mock saved searches - in real app this would come from storage/API
  const [savedSearches] = useState<SavedSearch[]>([
    {
      id: '1',
      name: 'My Upcoming Business Trips',
      searchQuery: '',
      filters: { status: 'CONFIRMED', upcoming: true, role: 'OWNER' },
      searchFilters: { tripType: 'BUSINESS' },
      createdAt: '2024-01-15T10:00:00Z',
    },
    {
      id: '2',
      name: 'Family Vacations',
      searchQuery: 'family',
      filters: { upcoming: true },
      searchFilters: { tripType: 'FAMILY' },
      createdAt: '2024-01-10T15:30:00Z',
    },
    {
      id: '3',
      name: 'European Adventures',
      searchQuery: '',
      filters: { sort: 'startDate', order: 'asc' },
      searchFilters: { destination: 'Europe', tripType: 'ADVENTURE' },
      createdAt: '2024-01-05T09:15:00Z',
    },
  ]);

  const hasActiveSearch = Boolean(
    currentSearch ||
    currentFilters.status ||
    currentFilters.upcoming ||
    currentFilters.role ||
    currentSearchFilters.destination ||
    currentSearchFilters.tripType
  );

  const handleSaveSearch = () => {
    if (searchName.trim()) {
      onSaveSearch(searchName.trim());
      setSearchName('');
      setShowSaveForm(false);
    }
  };

  const getSearchSummary = (search: SavedSearch) => {
    const parts: string[] = [];
    
    if (search.searchQuery) {
      parts.push(`"${search.searchQuery}"`);
    }
    if (search.filters.status) {
      parts.push(`Status: ${search.filters.status}`);
    }
    if (search.filters.upcoming) {
      parts.push('Upcoming');
    }
    if (search.searchFilters.destination) {
      parts.push(`Destination: ${search.searchFilters.destination}`);
    }
    if (search.searchFilters.tripType) {
      parts.push(`Type: ${search.searchFilters.tripType}`);
    }
    
    return parts.join(' • ');
  };

  if (savedSearches.length === 0 && !hasActiveSearch) {
    return null;
  }

  return (
    <View className="bg-gray-50 border-b border-gray-100">
      <View className="px-4 py-3">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-sm font-medium text-gray-700">Quick Searches</Text>
          
          {hasActiveSearch && !showSaveForm && (
            <Button
              variant="outline"
              size="sm"
              onPress={() => setShowSaveForm(true)}
              className="flex-row items-center px-3"
            >
              <Bookmark width={14} height={14} color="#6B7280" />
              <Text className="text-gray-700 ml-1 text-xs">Save</Text>
            </Button>
          )}
        </View>

        {/* Save Search Form */}
        {showSaveForm && (
          <View className="mb-3 p-3 bg-white rounded-lg border border-gray-200">
            <Text className="text-sm font-medium text-gray-700 mb-2">Save Current Search</Text>
            <View className="flex-row items-center space-x-2">
              <View className="flex-1">
                <Input
                  placeholder="Enter search name..."
                  value={searchName}
                  onChangeText={setSearchName}
                  className="text-sm"
                />
              </View>
              <Button
                variant="default"
                size="sm"
                onPress={handleSaveSearch}
                disabled={!searchName.trim()}
                className="px-3"
              >
                <Text className="text-white text-xs">Save</Text>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onPress={() => {
                  setShowSaveForm(false);
                  setSearchName('');
                }}
                className="px-2"
              >
                <X width={16} height={16} color="#6B7280" />
              </Button>
            </View>
          </View>
        )}

        {/* Saved Searches List */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row space-x-2">
            {savedSearches.map((search) => (
              <Button
                key={search.id}
                variant="outline"
                size="sm"
                onPress={() => onApplySearch(search)}
                className="min-w-[200px] justify-start px-3 py-2 h-auto"
              >
                <View className="flex-1">
                  <View className="flex-row items-center mb-1">
                    <BookmarkCheck width={12} height={12} color="#059669" />
                    <Text className="text-gray-800 font-medium text-xs ml-1" numberOfLines={1}>
                      {search.name}
                    </Text>
                  </View>
                  <Text className="text-gray-500 text-xs" numberOfLines={1}>
                    {getSearchSummary(search)}
                  </Text>
                </View>
              </Button>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}